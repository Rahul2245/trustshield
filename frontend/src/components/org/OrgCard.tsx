import React from "react";
import { Link } from "react-router-dom";
import { Users, ShieldCheck } from "lucide-react";
import { joinOrganization, leaveOrganization } from "@/services/community-api";

interface OrgCardProps {
  org: any;
  onUpdate?: () => void;
  userId?: string;
}

export const OrgCard: React.FC<OrgCardProps> = ({ org, onUpdate, userId }) => {
  const isMember = userId ? org.members?.includes(userId) : false;

  const handleJoinLeave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!userId) return;
    try {
      if (isMember) {
        await leaveOrganization(org._id);
      } else {
        await joinOrganization(org._id);
      }
      if (onUpdate) onUpdate();
    } catch (e) {}
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/org/${org.slug || org._id}`}>
        <div className="h-24 bg-gradient-to-r from-orange-400 to-orange-600 relative">
          {org.bannerImage && (
            <img src={org.bannerImage} alt="" className="w-full h-full object-cover mix-blend-overlay opacity-50" />
          )}
        </div>
      </Link>
      
      <div className="p-4 relative">
        <Link to={`/org/${org.slug || org._id}`}>
          <div className="absolute -top-10 left-4 w-16 h-16 rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
            <div className="w-full h-full rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl overflow-hidden">
              {org.avatarImage ? <img src={org.avatarImage} alt="" className="w-full h-full object-cover" /> : org.name[0]}
            </div>
          </div>
        </Link>
        
        <div className="flex justify-end mb-2 h-8">
          {userId && org.ownerId !== userId && (
            <button 
              onClick={handleJoinLeave}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                isMember 
                  ? "bg-slate-100 text-slate-900 hover:bg-red-50 hover:text-red-600 hover:border-red-200" 
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {isMember ? "Joined" : "Join"}
            </button>
          )}
        </div>
        
        <Link to={`/org/${org.slug || org._id}`}>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-slate-900">{org.name}</h3>
            {org.isVerified && <ShieldCheck size={16} className="text-blue-500" />}
          </div>
          <p className="text-slate-500 text-sm mb-4 line-clamp-2">{org.description}</p>
          
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <Users size={16} />
              <span>{org.memberCount} Members</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};
