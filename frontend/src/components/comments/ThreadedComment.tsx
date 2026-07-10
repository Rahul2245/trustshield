import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowDown, ShieldCheck, ShieldAlert, Reply } from "lucide-react";
import { likeComment, createComment } from "@/services/community-api";

interface ThreadedCommentProps {
  comment: any;
  postId: string;
  onUpdate: () => void;
}

export const ThreadedComment: React.FC<ThreadedCommentProps> = ({ comment, postId, onUpdate }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLike = async () => {
    try {
      await likeComment(comment._id);
      onUpdate();
    } catch (e) {}
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await createComment({ content: replyContent, postId, parentCommentId: comment._id });
      setReplyContent("");
      setIsReplying(false);
      onUpdate();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const authorImage = comment.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?._id}`;
  const authorName = comment.author?.email?.split('@')[0] || "anonymous";
  const likesCount = comment.likes?.length || 0;

  return (
    <div className={`flex flex-col mt-3 ${comment.depth > 0 ? 'ml-6' : ''}`}>
      <div className="flex gap-2">
        {/* Collapse line/avatar */}
        <div className="flex flex-col items-center shrink-0 w-8">
          <Link to={`/user/${comment.author?._id}`}>
            <img src={authorImage} alt={authorName} className="w-8 h-8 rounded-full bg-slate-200 cursor-pointer object-cover" />
          </Link>
          {!isCollapsed && comment.replies?.length > 0 && (
            <div className="w-0.5 h-full bg-slate-200 mt-2 hover:bg-orange-400 cursor-pointer transition-colors" onClick={() => setIsCollapsed(true)} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm mb-0.5">
            <Link to={`/user/${comment.author?._id}`} className="font-bold text-slate-900 hover:underline">
              {authorName}
            </Link>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500">
              {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            {comment.status === 'APPROVED' ? (
              <span className="flex items-center text-green-600 ml-2"><ShieldCheck size={12}/></span>
            ) : (
              <span className="flex items-center text-yellow-600 ml-2"><ShieldAlert size={12}/></span>
            )}
            
            {isCollapsed && (
              <button onClick={() => setIsCollapsed(false)} className="ml-2 text-orange-500 font-bold hover:underline">
                [+]
              </button>
            )}
          </div>

          {!isCollapsed && (
            <>
              <p className="text-slate-900 text-[15px] whitespace-pre-wrap break-words">{comment.content}</p>
              
              <div className="flex items-center gap-4 mt-1 text-slate-500 font-bold text-xs">
                <div className="flex items-center gap-1">
                  <button onClick={handleLike} className="p-1 hover:bg-slate-100 rounded transition-colors flex items-center gap-1">
                    <ArrowUp size={16} />
                    <span>{likesCount}</span>
                  </button>
                  <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                    <ArrowDown size={16} />
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <Reply size={14} /> Reply
                </button>
              </div>

              {isReplying && (
                <form onSubmit={handleReplySubmit} className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <textarea
                    autoFocus
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:border-orange-500 min-h-[60px]"
                    placeholder="What are your thoughts?"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setIsReplying(false)} className="px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-full">Cancel</button>
                    <button disabled={isSubmitting || !replyContent.trim()} type="submit" className="px-4 py-1.5 text-sm font-bold bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50">
                      Reply
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {!isCollapsed && comment.replies && comment.replies.length > 0 && (
        <div className="flex flex-col">
          {comment.replies.map((reply: any) => (
            <ThreadedComment key={reply._id} comment={reply} postId={postId} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
};
