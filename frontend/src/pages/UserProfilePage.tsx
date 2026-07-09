import React from "react";
import { Link } from "react-router-dom";
import { User, MapPin, Link as LinkIcon, Calendar, Github, Twitter, Award, Shield } from "lucide-react";

export const UserProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
        <Link to="/community" className="text-xl font-bold tracking-tight text-slate-900">EchoSphere</Link>
        <div className="flex items-center gap-4">
           <Link to="/community" className="text-sm font-medium hover:text-orange-600 transition-colors">Feed</Link>
           <button className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors">Edit Profile</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Cover & Avatar Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8 relative">
           <div className="h-48 bg-gradient-to-r from-orange-400 to-orange-600 w-full relative">
              <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium flex items-center gap-1.5">
                 <Shield size={14} /> Trust Level: Exceptional
              </div>
           </div>
           
           <div className="px-8 pb-8 relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-slate-100 absolute -top-16 shadow-md flex items-center justify-center">
                 <User size={64} className="text-slate-400" />
              </div>
              
              <div className="mt-20 flex justify-between items-start">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-900">Gajula Rahul</h1>
                    <p className="text-slate-500 font-medium">@rahul_g</p>
                    <p className="text-slate-700 mt-4 max-w-xl text-lg">
                      Principal Software Engineer & Open Source Contributor. Passionate about AI, Trust & Safety, and building scalable platforms.
                    </p>
                 </div>
                 
                 <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                       <Github size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                       <Twitter size={18} />
                    </button>
                 </div>
              </div>
              
              <div className="flex flex-wrap gap-6 mt-6 text-sm text-slate-600">
                 <div className="flex items-center gap-2"><MapPin size={16} className="text-slate-400"/> San Francisco, CA</div>
                 <div className="flex items-center gap-2"><LinkIcon size={16} className="text-slate-400"/> <a href="#" className="text-orange-500 hover:underline">rahul.dev</a></div>
                 <div className="flex items-center gap-2"><Calendar size={16} className="text-slate-400"/> Joined July 2026</div>
              </div>
              
              <div className="flex gap-6 mt-6 pt-6 border-t border-slate-100">
                 <div><span className="font-bold text-slate-900 text-lg">1,204</span> <span className="text-slate-500 text-sm">Followers</span></div>
                 <div><span className="font-bold text-slate-900 text-lg">842</span> <span className="text-slate-500 text-sm">Following</span></div>
                 <div><span className="font-bold text-slate-900 text-lg">15k</span> <span className="text-slate-500 text-sm">Reputation</span></div>
              </div>
           </div>
        </div>

        {/* Badges & Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                 <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Award size={20} className="text-orange-500"/> Achievements</h3>
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center"><Award size={20}/></div>
                       <div>
                          <div className="font-semibold text-sm">Top Contributor</div>
                          <div className="text-xs text-slate-500">Awarded July 2026</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Shield size={20}/></div>
                       <div>
                          <div className="font-semibold text-sm">Bug Hunter</div>
                          <div className="text-xs text-slate-500">Reported 50+ issues</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="md:col-span-2">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[300px]">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 text-lg">Activity Timeline</h3>
                    <div className="text-sm font-medium text-slate-500 flex gap-4">
                       <span className="text-orange-500 border-b-2 border-orange-500 pb-1">Posts</span>
                       <span className="hover:text-slate-900 cursor-pointer">Comments</span>
                       <span className="hover:text-slate-900 cursor-pointer">Saved</span>
                    </div>
                 </div>
                 
                 <div className="text-center text-slate-400 py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                    No recent activity to display.
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};
