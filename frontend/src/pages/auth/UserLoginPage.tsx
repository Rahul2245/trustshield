import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Shield } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export const UserLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const login = useAuthStore(s => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      // Use the global auth store for login (handles both users and admins)
      await login(email, password);
      // Determine where to route based on user role (assuming useAuthStore updates state)
      // For simplicity, we just route to /community. Protected routes will handle it.
      navigate("/community");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Invalid credentials");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Enter your credentials to access your account</p>
          </div>

          {error && (
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
              />
            </div>
            
            <div className="flex items-center justify-between text-sm pt-2">
               <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                 <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" /> Remember me
               </label>
               <Link to="#" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">Forgot password?</Link>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 mt-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
            </button>
          </form>

          <p className="text-center text-slate-600 mt-10">
            Don't have an account? <Link to="/register" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
