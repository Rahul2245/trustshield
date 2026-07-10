import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Shield } from "lucide-react";
import { registerUser } from "@/services/community-api";

export const UserRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await registerUser({ email, password, name });
      navigate("/login");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to register");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create an account</h2>
            <p className="text-slate-500">Join EchoSphere today</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900"
                placeholder="John Doe"
              />
            </div>
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
                minLength={8}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 mt-6 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-slate-600 mt-10">
            Already have an account? <Link to="/login" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 text-slate-900 flex-col justify-between p-12 relative overflow-hidden border-l border-slate-200">
        <div className="relative z-10 flex justify-end">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">EchoSphere</span>
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
              <Shield size={16} />
            </div>
          </Link>
        </div>
        
        <div className="relative z-10 max-w-md ml-auto text-right">
          <h1 className="text-4xl font-bold mb-6">Your voice, amplified.</h1>
          <p className="text-slate-500 text-lg">Build communities and share ideas in an environment designed for safety and quality discourse.</p>
        </div>
        
        <div className="relative z-10 text-sm text-slate-400 text-right">
          &copy; 2026 EchoSphere / TrustShield
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-orange-500/10 to-transparent blur-[100px]" />
      </div>
    </div>
  );
};
