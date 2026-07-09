import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldAlert, ShieldCheck, User, MessageCircle, Share2, Heart, Send } from "lucide-react";
import axios from "axios";

interface Comment {
  _id: string;
  content: string;
  author: { email: string; avatar?: string };
  createdAt: string;
  status: string;
}

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  // Mocking post data for now, ideally fetch from /api/v1/posts/:postId
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 5000);
    return () => clearInterval(interval);
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/v1/comments/post/${postId}`);
      setComments(res.data.data);
    } catch (error) {
      console.error("Failed to fetch comments", error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/v1/comments", { 
        content: newComment,
        postId: postId,
        authorId: "64e0a4f61f7481b4c3e8a111" // Dummy ID
      });
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Failed to create comment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <Link to="/community" className="text-slate-500 hover:text-slate-900 transition-colors">&larr; Back to Feed</Link>
           <span className="text-xl font-bold tracking-tight text-slate-900">EchoSphere</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-4">
        {/* Mock Post View */}
        <article className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <User size={24} className="text-slate-500" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-lg">Anonymous User</div>
              <div className="text-sm text-slate-500">Just now</div>
            </div>
          </div>
          <p className="text-slate-800 text-xl leading-relaxed mb-6">
            This is a mock detailed view of a community post. Let's start a discussion below!
          </p>
        </article>

        <h3 className="text-xl font-bold text-slate-900 mb-6 px-2">Discussion</h3>

        {/* Comment Input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-8 flex gap-4">
           <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
             <User size={18} />
           </div>
           <form onSubmit={handleCommentSubmit} className="flex-1 flex flex-col">
             <textarea 
               value={newComment}
               onChange={(e) => setNewComment(e.target.value)}
               placeholder="Write a comment..."
               className="w-full bg-transparent border-none resize-none focus:outline-none text-slate-800 placeholder-slate-400 min-h-[60px]"
             />
             <div className="flex justify-end mt-2">
                <button 
                  disabled={isSubmitting || !newComment.trim()}
                  type="submit" 
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                  {isSubmitting ? "Scanning..." : "Reply"}
                </button>
             </div>
           </form>
        </div>

        {/* Comments Feed */}
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment._id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
               <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                       <User size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{comment.author?.email || 'Anonymous'}</div>
                      <div className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</div>
                    </div>
                 </div>
                 {comment.status === 'APPROVED' ? (
                   <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><ShieldCheck size={12}/> Safe</span>
                 ) : (
                   <span className="flex items-center gap-1 text-yellow-600 text-xs font-medium"><ShieldAlert size={12}/> Scanning</span>
                 )}
               </div>
               <p className="text-slate-700 text-sm pl-11">{comment.content}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center text-slate-500 py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              No comments yet. Start the conversation!
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
