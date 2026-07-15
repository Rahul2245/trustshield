import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Shield, Lock, X } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { verifyOtp } from "@/services/api";

export const UserLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  const login = useAuthStore(s => s.login);
  const hydrate = useAuthStore(s => s.hydrate); // to refetch profile after otp

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/community");
    } catch (err: any) {
      if (err?.response?.data?.error?.code === "OTP_REQUIRED") {
        setShowOtpModal(true);
      } else {
        setError(err?.response?.data?.message || err?.message || "Invalid credentials");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingOtp(true);
    setError("");
    try {
      await verifyOtp(email, otpCode, false);
      await hydrate(); // Rehydrate auth state since verifyOtp bypasses standard auth store login
      navigate("/community");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Invalid OTP");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <span className="text-xl font-bold tracking-tight">EchoSphere</span>
          </Link>
        </div>
        
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold mb-6">Connect securely. <br/> Engage freely.</h1>
          <p className="text-slate-400 text-lg">Join a community protected by enterprise-grade Trust & Safety AI. No spam, no toxicity, just pure engagement.</p>
        </div>
        
        <div className="relative z-10 text-sm text-slate-500">
          &copy; 2026 EchoSphere / TrustShield
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-orange-500/20 to-blue-500/10 blur-[100px]" />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Enter your credentials to access your account</p>
          </div>

          {error && !showOtpModal && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900"
                placeholder="name@example.com"
                disabled={showOtpModal}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900"
                placeholder="••••••••"
                disabled={showOtpModal}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm pt-2">
               <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                 <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" disabled={showOtpModal} /> Remember me
               </label>
               <Link to="#" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">Forgot password?</Link>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || showOtpModal}
              className="w-full py-3.5 mt-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
            </button>
          </form>

          <p className="text-center text-slate-600 mt-10">
            Don't have an account? <Link to="/register" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">Create one</Link>
          </p>
        </div>

        {/* Glassmorphic OTP Modal Overlay */}
        {showOtpModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md p-4">
            <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-slate-900 p-6 text-center relative">
                <button 
                  onClick={() => setShowOtpModal(false)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
                  <Lock className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Step-up MFA Required</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We've noticed you haven't logged in for a while. For your security, we've sent a 6-digit verification code to your email.
                </p>
              </div>
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center font-medium border border-red-100">
                    {error}
                  </div>
                )}
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 text-center">
                      Verification Code
                    </label>
                    <input 
                      type="text" 
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={6}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-900 text-center text-2xl tracking-widest font-mono"
                      placeholder="000000"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isVerifyingOtp ? <Loader2 size={18} className="animate-spin" /> : "Verify Identity"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

