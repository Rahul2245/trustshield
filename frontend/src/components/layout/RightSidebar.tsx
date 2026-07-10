import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrganizations } from "@/services/community-api";

export const RightSidebar: React.FC = () => {
  const [orgs, setOrgs] = useState<any[]>([]);

  useEffect(() => {
    getOrganizations(1).then(res => setOrgs(res.data.items.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <aside className="fixed hidden lg:block w-80 h-screen pt-4 pb-8 pl-8 overflow-y-auto">
      {/* Search */}
      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="Search EchoSphere" 
          className="w-full bg-slate-100 border-none rounded-full py-3 px-5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
        />
      </div>

      {/* Trending Orgs */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4 px-2">Trending Communities</h2>
        
        <div className="space-y-4">
          {orgs.map(org => (
            <Link key={org._id} to={`/org/${org.slug || org._id}`} className="flex items-center justify-between px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold overflow-hidden">
                  {org.avatarImage ? <img src={org.avatarImage} alt="" className="w-full h-full object-cover"/> : org.name[0]}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-[15px]">{org.name}</span>
                  <span className="text-slate-500 text-sm">{org.memberCount} members</span>
                </div>
              </div>
              <button className="px-4 py-1.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-slate-800 transition-colors">
                Join
              </button>
            </Link>
          ))}
          {orgs.length === 0 && <p className="text-slate-500 text-sm px-2">No active communities.</p>}
        </div>
        
        <Link to="/organizations" className="block text-orange-500 hover:text-orange-600 text-[15px] p-4 font-normal mt-2 hover:bg-slate-100 rounded-b-2xl -mx-4 -mb-4">
          Show more
        </Link>
      </div>

      <div className="text-xs text-slate-500 px-4 space-x-3">
        <Link to="#" className="hover:underline">Terms of Service</Link>
        <Link to="#" className="hover:underline">Privacy Policy</Link>
        <Link to="#" className="hover:underline">Cookie Policy</Link>
        <span>&copy; 2026 EchoSphere</span>
      </div>
    </aside>
  );
};
