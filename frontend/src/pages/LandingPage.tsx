import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Shield, Users } from "lucide-react";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-200">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white ml-1" />
            <div className="w-2 h-2 rounded-full bg-orange-500 mr-1 mt-2" />
          </div>
          <span className="text-xl font-semibold tracking-tight">EchoSphere</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-slate-900 transition-colors">Home</a>
          <a href="#" className="hover:text-slate-900 transition-colors">About</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Reviews</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Community</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="px-5 py-2.5 rounded-full bg-slate-200 text-sm font-medium hover:bg-slate-300 transition-colors">
            Contact us
          </Link>
          <Link to="/community" className="px-5 py-2.5 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30">
            Join Platform
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-16 pb-24 text-center">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter max-w-4xl mx-auto leading-[1.1] mb-6">
          Find Communities To Suit Your Taste
        </h1>
        <p className="text-lg text-slate-600 mb-12 max-w-xl mx-auto">
          Experience a next-generation social platform secured by real-time Trust & Safety AI. Engage freely without the spam.
        </p>

        {/* Feature Grid based on reference UI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-6xl mx-auto mt-16">
          
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative">
             <div className="flex items-center gap-4 mb-16">
               <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white">
                 <Shield size={20} />
               </div>
               <div className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium shadow-md shadow-orange-500/20">
                 Secure Environment
               </div>
             </div>
             <div>
               <h3 className="text-3xl font-semibold mb-2">AI Protected</h3>
               <p className="text-slate-500">Every message is scanned instantly for threats.</p>
             </div>
             <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
          </div>

          <div className="md:col-span-1 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
             <div className="flex justify-between items-start mb-8">
               <span className="text-sm font-medium px-3 py-1 bg-slate-100 rounded-full">&lt;&lt; About &gt;&gt;</span>
               <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                 <Users size={14} />
               </div>
             </div>
             <h3 className="text-2xl font-semibold mb-6">By choosing your favorite community you will plunge into its world</h3>
             <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl relative overflow-hidden shadow-inner">
               <div className="absolute inset-0 flex items-center justify-center">
                 <MessageSquare className="text-white/30 w-24 h-24" />
               </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between space-y-6">
            <h3 className="text-xl font-medium">Trending Topics</h3>
            
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg transform rotate-[-6deg]">
                 <span className="font-semibold text-sm">Tech</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shadow-md transform rotate-[4deg]">
                 <span className="font-semibold text-xs">Crypto</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100 mt-auto">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 shadow-sm" />
                 ))}
               </div>
               <div className="text-xs font-semibold text-slate-600 text-right">
                 10k+ <br/> Active Users
               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
