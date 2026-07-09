import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Shield, ArrowRight, Plus } from "lucide-react";

export const OrganizationsPage: React.FC = () => {
  const [orgs] = useState([
    { id: 'org-1', name: 'OpenAI Developer Group', members: 12450, isVerified: true, description: 'Discussing the latest in LLMs, prompt engineering, and AGI alignment.' },
    { id: 'org-2', name: 'React Enthusiasts', members: 8900, isVerified: true, description: 'A community for React, React Native, Next.js, and Remix developers.' },
    { id: 'org-3', name: 'Trust & Safety Professionals', members: 3200, isVerified: false, description: 'Sharing best practices on automated moderation, content policies, and user safety.' },
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
        <Link to="/community" className="text-xl font-bold tracking-tight text-slate-900">EchoSphere</Link>
        <div className="flex items-center gap-4">
           <Link to="/community" className="text-sm font-medium hover:text-orange-600 transition-colors">Feed</Link>
           <button className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
             <Plus size={16} /> Create Org
           </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
           <h1 className="text-4xl font-bold text-slate-900 mb-4">Discover Organizations</h1>
           <p className="text-lg text-slate-500 max-w-2xl mx-auto">
             Join thousands of communities built around shared interests, open-source projects, and professional networks.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {orgs.map(org => (
             <div key={org.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <Users size={24} className="text-orange-500" />
                   </div>
                   {org.isVerified && (
                     <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                       <Shield size={12} /> Verified
                     </div>
                   )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">{org.name}</h3>
                <p className="text-sm text-slate-600 mb-6 line-clamp-2 min-h-[40px]">{org.description}</p>
                
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                   <div className="text-sm font-medium text-slate-500">
                     <span className="text-slate-900 font-bold">{org.members.toLocaleString()}</span> Members
                   </div>
                   <button className="text-orange-500 group-hover:text-orange-600 transition-colors">
                     <ArrowRight size={20} />
                   </button>
                </div>
             </div>
           ))}
        </div>
      </main>
    </div>
  );
};
