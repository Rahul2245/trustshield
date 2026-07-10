import React from "react";
import { CommunityLayout } from "@/components/layout/CommunityLayout";
import { PostCard } from "@/components/posts/PostCard";
import { PostComposer } from "@/components/posts/PostComposer";
import { getPosts, getMyPosts } from "@/services/community-api";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";

export const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");
  const { user } = useAuthStore();

  const fetchFeed = async () => {
    try {
      if (activeTab === "for-you") {
        const res = await getPosts(1);
        setPosts(res.data.items);
      } else {
        const res = await getMyPosts(1);
        setPosts(res.data.items);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [activeTab]);

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

      {user && (
        <PostComposer onPostCreated={fetchFeed} />
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
