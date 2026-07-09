import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ShieldCheck, User, MessageCircle, Share2, Heart, Plus } from "lucide-react";
import axios from "axios";

interface Post {
  _id: string;
  content: string;
  author: { email: string; avatar?: string };
  createdAt: string;
  status: string;
  aiVerdict?: boolean;
}

export const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
    // Simulate real-time by polling, or in a real app, use Socket.IO here
    const interval = setInterval(fetchPosts, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/v1/posts");
      setPosts(res.data.data);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setIsSubmitting(true);
    try {
      // Mocking authorId for demonstration without strict auth wrapper
      await axios.post("http://localhost:5000/api/v1/posts", { 
        content: newPost,
        authorId: "64e0a4f61f7481b4c3e8a111" // Dummy ID
      });
      setNewPost("");
      fetchPosts();
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">EchoSphere</Link>
        <div className="flex items-center gap-4">
           <Link to="/dashboard" className="text-sm font-medium hover:text-orange-600 transition-colors">Admin Dashboard</Link>
           <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
             <User size={16} />
           </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-4">
        {/* Create Post Area */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
          <form onSubmit={handlePostSubmit}>
             <textarea 
               value={newPost}
               onChange={(e) => setNewPost(e.target.value)}
               placeholder="What's happening in the community?"
               className="w-full bg-transparent border-none resize-none focus:outline-none text-lg placeholder-slate-400 min-h-[100px]"
             />
             <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                <div className="flex gap-2 text-slate-400">
                   <button type="button" className="p-2 hover:bg-slate-50 rounded-full transition-colors"><Plus size={20}/></button>
                </div>
                <button 
                  disabled={isSubmitting || !newPost.trim()}
                  type="submit" 
                  className="px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Scanning..." : "Post"}
                </button>
             </div>
          </form>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {posts.map(post => (
            <article key={post._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                       <User size={20} className="text-slate-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{post.author?.email || 'Anonymous'}</div>
                      <div className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString()}</div>
                    </div>
                 </div>
                 
                 {/* AI Status Badge */}
                 {post.status === 'APPROVED' ? (
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                     <ShieldCheck size={14} /> Safe
                   </div>
                 ) : (
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full border border-yellow-100">
                     <ShieldAlert size={14} /> Pending Scan
                   </div>
                 )}
              </div>
              
              <p className="text-slate-800 text-[15px] leading-relaxed mb-6 whitespace-pre-wrap">
                {post.content}
              </p>

              <div className="flex items-center justify-between text-slate-500 border-t border-slate-50 pt-4">
                 <button className="flex items-center gap-2 text-sm hover:text-orange-500 transition-colors group">
                    <div className="p-2 group-hover:bg-orange-50 rounded-full transition-colors"><Heart size={18}/></div>
                    <span>0</span>
                 </button>
                 <Link to={`/community/post/${post._id}`} className="flex items-center gap-2 text-sm hover:text-blue-500 transition-colors group">
                    <div className="p-2 group-hover:bg-blue-50 rounded-full transition-colors"><MessageCircle size={18}/></div>
                    <span>View Comments</span>
                 </Link>
                 <button className="flex items-center gap-2 text-sm hover:text-green-500 transition-colors group">
                    <div className="p-2 group-hover:bg-green-50 rounded-full transition-colors"><Share2 size={18}/></div>
                 </button>
              </div>
            </article>
          ))}
          {posts.length === 0 && (
            <div className="text-center text-slate-500 py-12">No safe posts yet. Be the first to say hello!</div>
          )}
        </div>
      </main>
    </div>
  );
};
