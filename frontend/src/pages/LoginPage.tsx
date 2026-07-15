import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2, Lock, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth";
import { verifyOtp } from "@/services/api";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const hydrate = useAuthStore((s) => s.hydrate);
  const isLoading = useAuthStore((s) => s.isLoading);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, true);
      toast.success("Welcome back, Admin");
      navigate("/dashboard");
    } catch (error: any) {
      if (error?.response?.data?.error?.code === "OTP_REQUIRED") {
        setShowOtpModal(true);
      } else {
        toast.error(
          error?.response?.data?.message || error?.message || "Invalid credentials"
        );
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingOtp(true);
    try {
      await verifyOtp(email, otpCode, true);
      await hydrate();
      toast.success("Welcome back, Admin");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Invalid OTP");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">TrustShield Admin</CardTitle>
          <CardDescription>
            Secure access to the Unified Trust & Safety Identity Engine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@trustshield.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={showOtpModal}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={showOtpModal}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || showOtpModal}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Glassmorphic OTP Modal Overlay */}
      {showOtpModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 border-primary/20 shadow-2xl">
            <div className="bg-primary p-6 text-center relative text-primary-foreground">
              <button 
                onClick={() => setShowOtpModal(false)}
                className="absolute right-4 top-4 opacity-70 hover:opacity-100 transition-opacity"
              >
                <X size={20} />
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-1">Step-up MFA Required</h3>
              <p className="text-sm opacity-90 leading-relaxed">
                We've noticed you haven't logged in for a while. For your security, we've sent a 6-digit verification code to your email.
              </p>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otpCode" className="text-center block">Verification Code</Label>
                  <Input 
                    id="otpCode"
                    type="text" 
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono py-6"
                    placeholder="000000"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verifying Identity...
                    </>
                  ) : (
                    "Verify Identity"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
