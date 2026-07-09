import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export const UserLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Mocking user auth for demonstration
      setTimeout(() => {
        setIsLoading(false);
        navigate("/community");
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold tracking-tight text-slate-900">EchoSphere</Link>
          <p className="text-sm text-slate-500 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
             <label className="flex items-center gap-2 text-slate-600">
               <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" /> Remember me
             </label>
             <Link to="#" className="text-orange-600 hover:text-orange-700 font-medium">Forgot password?</Link>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account? <Link to="/register" className="text-orange-600 hover:text-orange-700 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
};
