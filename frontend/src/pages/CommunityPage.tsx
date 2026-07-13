import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CommunityLayout } from "@/components/layout/CommunityLayout";
import { PostCard } from "@/components/posts/PostCard";
import { PostComposer } from "@/components/posts/PostComposer";
import { getFeed, getMyPosts, getOrganizations } from "@/services/community-api";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { X, Filter } from "lucide-react";

export const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");
  const [feedContext, setFeedContext] = useState<string>(""); // "" = all, "global" = global, "orgId" = specific org
  const [myOrgs, setMyOrgs] = useState<any[]>([]);
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic");

  useEffect(() => {
    if (user) {
      getOrganizations().then(res => {
        if (res.success) {
          const joined = res.data.items.filter((org: any) => org.members?.includes(user.id) || org.ownerId?._id === user.id || org.ownerId === user.id);
          setMyOrgs(joined);
        }
      });
    }
  }, [user]);

  const fetchFeed = async () => {
    try {
      if (activeTab === "for-you") {
        const res = await getFeed(1, 'hot', feedContext || undefined, topic || undefined);
        setPosts(res.data.items);
      } else {
        const res = await getMyPosts(1, feedContext || undefined);
        setPosts(res.data.items);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [activeTab, topic, feedContext]);

  return (
    <CommunityLayout>
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="flex w-full cursor-pointer">
          <div 
            onClick={() => setActiveTab("for-you")} 
            className="flex-1 hover:bg-slate-100 transition-colors flex justify-center pt-4"
          >
            <div className={`pb-3 font-bold text-[15px] border-b-4 rounded-sm ${activeTab === 'for-you' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-500'}`}>
              For you
            </div>
          </div>
          {user && (
            <div 
              onClick={() => setActiveTab("following")} 
              className="flex-1 hover:bg-slate-100 transition-colors flex justify-center pt-4"
            >
              <div className={`pb-3 font-bold text-[15px] border-b-4 rounded-sm ${activeTab === 'following' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-500'}`}>
                My Posts
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feed Filter Dropdown */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <Filter size={16} className="text-slate-400" />
        <select 
          value={feedContext} 
          onChange={(e) => setFeedContext(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block px-2.5 py-1.5 outline-none font-medium appearance-none cursor-pointer pr-8 relative"
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.2rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
        >
          <option value="">All Feed (Combined)</option>
          <option value="global">Global Feed (No Community)</option>
          {myOrgs.map(org => (
            <option key={org._id} value={org._id}>c/{org.name}</option>
          ))}
        </select>
      </div>

      {topic && (
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold text-sm">Topic:</span>
            <span className="bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded text-sm">{topic}</span>
          </div>
          <Link to="/community" className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </Link>
        </div>
      )}

      {user && !user.isUnderInvestigation && (
        <PostComposer 
          onPostCreated={fetchFeed} 
          orgId={feedContext === 'global' ? '' : feedContext} 
        />
      )}

      {!user && (
        <div className="p-4 bg-slate-50 text-center text-sm text-slate-500 border-b border-slate-200">
          Sign in to join the conversation.
        </div>
      )}

      <div>
        {posts.map(post => (
          <PostCard key={post._id} post={post} onUpdate={fetchFeed} />
        ))}
        {posts.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-medium">
            No posts to show right now.
          </div>
        )}
      </div>
    </CommunityLayout>
  );
};
