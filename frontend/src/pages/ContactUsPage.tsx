import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { CommunityLayout } from "@/components/layout/CommunityLayout";
import { useAuthStore } from "@/store/auth";
import { Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const ContactUsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [issue, setIssue] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) {
      toast.error("Please enter your issue.");
      return;
    }
    // Mock submit
    setIsSubmitted(true);
    toast.success("Your message has been sent to support!");
  };

  return (
    <CommunityLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Contact Support</h1>
        <p className="text-slate-500 mb-8 font-medium">We're here to help! Let us know what issue you're experiencing.</p>

        {isSubmitted ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Message Sent</h2>
            <p className="text-slate-600 font-medium">Thank you for reaching out. Our support team will respond to {user?.email} shortly.</p>
            <button 
              onClick={() => { setIsSubmitted(false); setIssue(""); }}
              className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors"
            >
              Submit Another Issue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  disabled
                  value={user?.email || ""} 
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 text-sm cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1.5 font-medium">We will reply to this address.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Describe your issue</label>
                <textarea 
                  rows={6}
                  required
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="Tell us what's going wrong..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm shadow-orange-500/20"
                >
                  <Send size={18} /> Send Message
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </CommunityLayout>
  );
};
