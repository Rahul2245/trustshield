import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Shield, ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";

export const OrganizationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("explore");
  
  const [orgs] = useState([
    { id: 'org-1', name: 'OpenAI Developer Group', members: 12450, isVerified: true, description: 'Discussing the latest in LLMs, prompt engineering, and AGI alignment.', tags: ['AI', 'Research'] },
    { id: 'org-2', name: 'React Enthusiasts', members: 8900, isVerified: true, description: 'A community for React, React Native, Next.js, and Remix developers.', tags: ['Frontend', 'JavaScript'] },
    { id: 'org-3', name: 'Trust & Safety Professionals', members: 3200, isVerified: false, description: 'Sharing best practices on automated moderation, content policies, and user safety.', tags: ['Security', 'Community'] },
    { id: 'org-4', name: 'Cyber Security Group', members: 5400, isVerified: true, description: 'Whitehat hackers discussing latest vulnerabilities.', tags: ['Security', 'Hacking'] },
    { id: 'org-5', name: 'Cloud Computing Hub', members: 7800, isVerified: false, description: 'AWS, GCP, and Azure discussions.', tags: ['Cloud', 'DevOps'] },
  ]);

  const handleOrgClick = (orgName: string) => {
    toast.info(`Navigating to ${orgName}...`);
  };

  const handleCreateOrg = () => {
    toast.info("Create Organization feature coming soon!");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
        <Link to="/community" className="text-xl font-bold tracking-tight text-slate-900">EchoSphere</Link>
        <div className="flex items-center gap-4">
           <Link to="/community" className="text-sm font-medium hover:text-orange-600 transition-colors">Feed</Link>
           <button onClick={handleCreateOrg} className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
             <Plus size={16} /> Create Org
           </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
           <div>
             <h1 className="text-4xl font-bold text-slate-900 mb-2">Organizations</h1>
             <p className="text-lg text-slate-500 max-w-2xl">
               Join communities built around shared interests and open-source projects.
             </p>
           </div>
           
           <div className="flex bg-slate-200 p-1 rounded-xl">
             <button onClick={() => setActiveTab('explore')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'explore' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Explore</button>
             <button onClick={() => setActiveTab('joined')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'joined' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Joined (2)</button>
             <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'manage' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Manage</button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {orgs.map(org => (
             <div key={org.id} onClick={() => handleOrgClick(org.name)} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center relative">
                      <Users size={24} className="text-orange-500" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                   </div>
                   {org.isVerified && (
                     <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                       <Shield size={12} /> Verified
                     </div>
                   )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">{org.name}</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px] flex-grow">{org.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {org.tags.map(tag => (
                     <span key={tag} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                   <div className="flex items-center">
                     <div className="flex -space-x-2 mr-3">
                        {[1,2,3].map(i => (
                           <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${org.id}-${i}`} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" alt="Member" />
                        ))}
                     </div>
                     <div className="text-xs font-medium text-slate-500">
                       <span className="text-slate-900 font-bold">{org.members.toLocaleString()}</span> Members
                     </div>
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
