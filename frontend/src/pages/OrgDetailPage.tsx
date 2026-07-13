import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Users, ShieldCheck, FileText } from "lucide-react";
import { CommunityLayout } from "@/components/layout/CommunityLayout";
import { PostCard } from "@/components/posts/PostCard";
import { PostComposer } from "@/components/posts/PostComposer";
import { getOrganizationById, getPosts, joinOrganization, leaveOrganization } from "@/services/community-api";
import { useAuthStore } from "@/store/auth";

export const OrgDetailPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useAuthStore();
  
  const [org, setOrg] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!orgId) return;
    try {
      const orgRes = await getOrganizationById(orgId);
      setOrg(orgRes.data);
      // Use the actual object ID for fetching posts, in case orgId in URL was a slug
      const id = orgRes.data._id;
      const postsRes = await getPosts(1, id);
      setPosts(postsRes.data.items);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  if (loading) {
    return (
      <CommunityLayout>
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-500" /></div>
      </CommunityLayout>
    );
  }

  if (!org) {
    return (
      <CommunityLayout>
        <div className="p-8 text-center text-slate-500">Community not found.</div>
      </CommunityLayout>
    );
  }

  const isMember = user ? org.members?.includes(user.id) : false;
  const isOwner = user ? org.ownerId?._id === user.id : false;
  const hasAccess = isMember || isOwner;

  const handleJoinLeave = async () => {
    if (!user) return;
    try {
      if (isMember) {
        await leaveOrganization(org._id);
      } else {
        await joinOrganization(org._id);
      }
      fetchData();
    } catch (e) {}
  };

  return (
    <CommunityLayout>
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md flex items-center gap-6 px-4 py-3">
        <Link to="/organizations" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-900" />
        </Link>
        <h2 className="text-xl font-bold text-slate-900">{org.name}</h2>
      </div>

      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-orange-400 via-orange-500 to-rose-500 relative overflow-hidden group">
          {org.bannerImage && (
            <img src={org.bannerImage} alt="" className="w-full h-full object-cover mix-blend-overlay opacity-60" />
          )}
        </div>
        
        <div className="px-5 pb-4 bg-white relative">
          <div className="flex justify-between items-start">
            <div className="w-24 h-24 rounded-2xl bg-white p-1.5 border border-slate-100 shadow-sm relative -top-12">
              <div className="w-full h-full rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-4xl overflow-hidden">
                {org.avatarImage ? <img src={org.avatarImage} alt="" className="w-full h-full object-cover" /> : org.name[0]}
              </div>
            </div>
            
            <div className="pt-4">
              {user && org.ownerId?._id !== user.id && (
                <button 
                  onClick={handleJoinLeave}
                  className={`px-6 py-2 rounded-full font-bold transition-colors shadow-sm ${
                    isMember 
                      ? "bg-slate-100 text-slate-900 hover:bg-red-50 hover:text-red-600 border border-slate-200" 
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {isMember ? "Joined" : "Join Community"}
                </button>
              )}
            </div>
          </div>
          
          <div className="-mt-8">
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              {org.name}
              {org.isVerified && <ShieldCheck size={20} className="text-blue-500" />}
            </h1>
            <p className="text-slate-500 mb-4">c/{org.slug || org._id}</p>
            
            <p className="text-slate-800 text-[15px] mb-4 whitespace-pre-wrap">{org.description}</p>
            
            <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <Users size={16} />
                <span className="font-bold text-slate-900">{org.memberCount}</span> Members
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-3 bg-slate-50 border-y border-slate-200" />

      {user && hasAccess && (
        <PostComposer onPostCreated={fetchData} orgId={org._id} />
      )}

      {!user ? (
        <div className="p-4 bg-slate-50 text-center text-sm text-slate-500 border-b border-slate-200">
          <Link to="/login" className="text-orange-600 hover:underline">Log in</Link> to view and post.
        </div>
      ) : !hasAccess ? (
        <div className="p-12 text-center bg-slate-50/50">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Private Community</h3>
          <p className="text-slate-500">You must join this community to view its posts.</p>
        </div>
      ) : (
        <div>
          {posts.map(post => (
            <PostCard key={post._id} post={post} onUpdate={fetchData} />
          ))}
          {posts.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-medium">
              No posts in this community yet.
            </div>
          )}
        </div>
      )}
    </CommunityLayout>
  );
};
