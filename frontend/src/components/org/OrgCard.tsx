import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Users, ShieldCheck } from "lucide-react";
import { joinOrganization, leaveOrganization } from "@/services/community-api";

interface OrgCardProps {
  org: any;
  onUpdate?: () => void;
  userId?: string;
}

export const OrgCard: React.FC<OrgCardProps> = ({ org, onUpdate, userId }) => {
  const [isMember, setIsMember] = useState(userId ? org.members?.includes(userId) : false);
  const [memberCount, setMemberCount] = useState(org.memberCount || org.members?.length || 0);

  const handleJoinLeave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!userId) return;
    try {
      if (isMember) {
        await leaveOrganization(org._id);
        setIsMember(false);
        setMemberCount((prev: number) => Math.max(0, prev - 1));
      } else {
        await joinOrganization(org._id);
        setIsMember(true);
        setMemberCount((prev: number) => prev + 1);
      }
      if (onUpdate) onUpdate();
    } catch (e) {}
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300">
      <Link to={`/org/${org.slug || org._id}`}>
        <div className="h-32 bg-gradient-to-r from-orange-400 via-orange-500 to-rose-500 relative group">
          {org.bannerImage && (
            <img src={org.bannerImage} alt="" className="w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:opacity-70 transition-opacity" />
          )}
        </div>
      </Link>
      
      <div className="p-5 relative">
        <Link to={`/org/${org.slug || org._id}`}>
          <div className="absolute -top-12 left-5 w-20 h-20 rounded-2xl bg-white p-1.5 border border-slate-100 shadow-sm">
            <div className="w-full h-full rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-3xl overflow-hidden">
              {org.avatarImage ? <img src={org.avatarImage} alt="" className="w-full h-full object-cover" /> : org.name[0]}
            </div>
          </div>
        </Link>
        
        <div className="flex justify-end mb-2 h-10">
          {userId && org.ownerId !== userId && (
            <button 
              onClick={handleJoinLeave}
              className={`px-5 py-1.5 rounded-full text-[15px] font-bold transition-all shadow-sm ${
                isMember 
                  ? "bg-slate-100 text-slate-900 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200" 
                  : "bg-slate-900 text-white hover:bg-slate-800 border border-transparent"
              }`}
            >
              {isMember ? "Joined" : "Join"}
            </button>
          )}
        </div>
        
        <Link to={`/org/${org.slug || org._id}`}>
          <div className="flex flex-col mt-2">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[22px] font-extrabold text-slate-900 leading-tight">{org.name}</h3>
              {org.isVerified && <ShieldCheck size={18} className="text-blue-500 fill-blue-50" />}
            </div>
            <p className="text-slate-500 text-[15px] font-medium mb-3">c/{org.slug || org._id}</p>
            
            <p className="text-slate-700 text-[15px] mb-5 line-clamp-3 leading-snug">{org.description}</p>
            
            <div className="flex items-center gap-4 text-[14px] font-bold text-slate-500 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-slate-400" />
                <span className="text-slate-700">{memberCount}</span> 
                <span className="font-medium">Members</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};
