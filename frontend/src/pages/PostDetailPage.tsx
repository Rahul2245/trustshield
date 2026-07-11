import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CommunityLayout } from "@/components/layout/CommunityLayout";
import { PostCard } from "@/components/posts/PostCard";
import { ThreadedComment } from "@/components/comments/ThreadedComment";
import { getPostById, getCommentsByPost, createComment } from "@/services/community-api";
import { useAuthStore } from "@/store/auth";

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!postId) return;
    try {
      const [postRes, commentsRes] = await Promise.all([
        getPostById(postId),
        getCommentsByPost(postId)
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [postId]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !postId) return;
    setIsSubmitting(true);
    try {
      await createComment({ content: replyContent, postId });
      setReplyContent("");
      fetchData();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <CommunityLayout>
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-orange-500" /></div>
      </CommunityLayout>
    );
  }

  if (!post) {
    return (
      <CommunityLayout>
        <div className="p-8 text-center text-slate-500">Post not found.</div>
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-900" />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Post</h2>
      </div>

      <PostCard post={post} onUpdate={fetchData} isDetail={true} />

      <div className="border-b border-slate-200">
        {user && !user.isUnderInvestigation ? (
          <form onSubmit={handleReplySubmit} className="flex gap-4 p-4 border-b border-slate-200">
            <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="" className="w-12 h-12 rounded-full bg-slate-200 object-cover" />
            <div className="flex-1 flex flex-col">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Post your reply"
                className="w-full bg-transparent text-xl border-none resize-none focus:outline-none placeholder-slate-500 min-h-[60px]"
              />
              <div className="flex justify-end mt-2">
                <button 
                  disabled={!replyContent.trim() || isSubmitting}
                  type="submit" 
                  className="bg-orange-500 text-white font-bold py-1.5 px-5 rounded-full hover:bg-orange-600 disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-slate-50 text-center text-slate-500 text-sm">
            <Link to="/login" className="text-orange-600 hover:underline">Log in</Link> to reply
          </div>
        )}
      </div>

      <div className="p-4 bg-white">
        {comments.map(c => (
          <ThreadedComment key={c._id} comment={c} postId={postId as string} onUpdate={fetchData} />
        ))}
      </div>
    </CommunityLayout>
  );
};
