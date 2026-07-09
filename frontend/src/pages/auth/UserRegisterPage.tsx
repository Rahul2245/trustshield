import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export const UserRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Mocking user auth for demonstration
      setTimeout(() => {
        setIsLoading(false);
        navigate("/login");
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
          <p className="text-sm text-slate-500 mt-2">Join the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              placeholder="John Doe"
            />
          </div>
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

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex justify-center items-center gap-2 disabled:opacity-70 mt-4"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
