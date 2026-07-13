import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowDown, ShieldCheck, ShieldAlert, Reply, MoreHorizontal } from "lucide-react";
import { toggleVoteComment, createComment } from "@/services/community-api";

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

  const [localScore, setLocalScore] = useState(comment.score || 0);
  const [localVote, setLocalVote] = useState<'up'|'down'|null>(null);

  const handleVote = async (type: 'up' | 'down') => {
    try {
      const res = await toggleVoteComment(comment._id, type);
      if (res.success) {
        setLocalScore(res.data.score);
        setLocalVote(res.data.voted);
        onUpdate();
      }
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

  return (
    <div className={`flex flex-col mt-3 ${comment.depth > 0 ? 'ml-6' : ''}`}>
      <div className="flex gap-2">
        {/* Collapse line/avatar */}
        <div className="flex flex-col items-center shrink-0 w-8">
          <Link to={`/user/${comment.author?._id}`}>
            <img src={authorImage} alt={authorName} className="w-8 h-8 rounded-full bg-slate-200 cursor-pointer object-cover shadow-sm border border-slate-100" />
          </Link>
          {!isCollapsed && comment.replies?.length > 0 && (
            <div className="w-0.5 h-full bg-slate-200 mt-2 hover:bg-orange-400 cursor-pointer transition-colors" onClick={() => setIsCollapsed(true)} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pb-2">
          <div className="flex items-center gap-1.5 text-xs mb-0.5 bg-slate-50 w-fit px-2 py-0.5 rounded-full border border-slate-100">
            <Link to={`/user/${comment.author?._id}`} className="font-bold text-slate-900 hover:underline">
              {authorName}
            </Link>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 font-medium">
              {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            {comment.isEdited && <span className="text-slate-400 text-[10px] italic ml-1">(edited)</span>}
            
            {comment.status === 'APPROVED' ? (
              <span className="flex items-center text-green-600 ml-1"><ShieldCheck size={12}/></span>
            ) : (
              <span className="flex items-center text-yellow-600 ml-1"><ShieldAlert size={12}/></span>
            )}
            
            {isCollapsed && (
              <button onClick={() => setIsCollapsed(false)} className="ml-2 text-orange-500 font-bold hover:underline bg-orange-50 px-1.5 rounded">
                Expand
              </button>
            )}
          </div>

          {!isCollapsed && (
            <>
              <p className="text-slate-900 text-[15px] whitespace-pre-wrap break-words mt-1.5 pl-1 leading-snug">{comment.content}</p>
              
              <div className="flex items-center gap-1.5 mt-2 text-slate-500 font-bold text-xs pl-1">
                <div className="flex items-center bg-slate-100 rounded-full border border-slate-200/60">
                  <button onClick={() => handleVote('up')} className={`p-1.5 hover:bg-slate-200 rounded-l-full transition-colors ${localVote === 'up' ? 'text-orange-500' : ''}`}>
                    <ArrowUp size={16} strokeWidth={localVote === 'up' ? 3 : 2} />
                  </button>
                  <span className={`px-2 min-w-[20px] text-center ${localVote === 'up' ? 'text-orange-600' : localVote === 'down' ? 'text-blue-600' : ''}`}>
                    {localScore}
                  </span>
                  <button onClick={() => handleVote('down')} className={`p-1.5 hover:bg-slate-200 rounded-r-full transition-colors ${localVote === 'down' ? 'text-blue-500' : ''}`}>
                    <ArrowDown size={16} strokeWidth={localVote === 'down' ? 3 : 2} />
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Reply size={15} /> Reply
                </button>

                <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors ml-1 text-slate-400">
                   <MoreHorizontal size={16} />
                </button>
              </div>

              {isReplying && (
                <form onSubmit={handleReplySubmit} className="mt-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm ml-1">
                  <textarea
                    autoFocus
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 min-h-[80px]"
                    placeholder={`Replying to ${authorName}...`}
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button type="button" onClick={() => setIsReplying(false)} className="px-4 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-colors">Cancel</button>
                    <button disabled={isSubmitting || !replyContent.trim()} type="submit" className="px-5 py-1.5 text-sm font-bold bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50">
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
