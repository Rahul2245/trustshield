import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, MessageCircle, Share2, ArrowUp, ArrowDown, Flag } from "lucide-react";
import { toggleVotePost } from "@/services/community-api";
import { useAuthStore } from "@/store/auth";

interface PostCardProps {
  post: any;
  onUpdate?: () => void;
  isDetail?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdate, isDetail = false }) => {
  const { user } = useAuthStore();
  const [localScore, setLocalScore] = useState(post.score || 0);
  const [localVote, setLocalVote] = useState<'up'|'down'|null>(null); // We could infer from current user ID if passed, but typically fetched from backend

  const handleVote = async (e: React.MouseEvent, type: 'up' | 'down') => {
    e.preventDefault();
    try {
      const res = await toggleVotePost(post._id, type);
      if (res.success) {
        setLocalScore(res.data.score);
        setLocalVote(res.data.voted);
        if (onUpdate) onUpdate();
      }
    } catch (error) {}
  };

  const authorImage = post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?._id}`;
  const authorName = post.author?.email?.split('@')[0] || "anonymous";

  return (
    <article className={`flex bg-white ${!isDetail ? 'border-b border-slate-200 hover:bg-slate-50 transition-colors' : 'rounded-2xl border border-slate-200 shadow-sm'}`}>
      
      {/* Left side: Vertical Voting (Reddit style) */}
      <div className="flex flex-col items-center shrink-0 w-12 bg-slate-50/50 py-3 border-r border-slate-100/50 rounded-l-2xl">
        <button 
          onClick={(e) => handleVote(e, 'up')} 
          className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${localVote === 'up' ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500'}`}
        >
          <ArrowUp size={22} strokeWidth={localVote === 'up' ? 3 : 2} />
        </button>
        <span className={`text-[13px] font-bold py-1 ${localVote === 'up' ? 'text-orange-600' : localVote === 'down' ? 'text-blue-600' : 'text-slate-700'}`}>
          {localScore >= 1000 ? (localScore/1000).toFixed(1)+'k' : localScore}
        </span>
        <button 
          onClick={(e) => handleVote(e, 'down')} 
          className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${localVote === 'down' ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}`}
        >
          <ArrowDown size={22} strokeWidth={localVote === 'down' ? 3 : 2} />
        </button>
      </div>

      {/* Right side: Content Area */}
      <div className="flex-1 min-w-0 p-3 pt-3.5 pl-4 pr-5">
        
        {/* Header: Org Name and Author */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center flex-wrap gap-1.5 text-xs font-medium text-slate-500">
            {post.organization ? (
              <Link to={`/org/${post.organization.slug || post.organization._id}`} className="font-bold text-slate-900 hover:underline flex items-center gap-1.5">
                {post.organization.avatarImage ? (
                   <img src={post.organization.avatarImage} className="w-5 h-5 rounded-full object-cover border border-slate-200" alt=""/>
                ) : (
                   <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[10px] text-orange-600 font-bold border border-orange-200">{post.organization.name[0]}</div>
                )}
                c/{post.organization.slug || post.organization.name}
              </Link>
            ) : (
              <span className="font-bold text-slate-900">c/Global</span>
            )}
            
            <span className="text-slate-300">•</span>
            
            <span className="text-slate-500">Posted by</span>
            <Link to={`/user/${post.author?._id}`} className="text-slate-500 hover:underline flex items-center gap-1">
              <img src={authorImage} alt="" className="w-4 h-4 rounded-full object-cover" />
              u/{authorName}
            </Link>
            
            <span className="text-slate-300">•</span>
            <span className="hover:underline cursor-pointer">
              {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* TrustShield Status Badge */}
          {post.status === 'APPROVED' ? (
            <div className="flex items-center gap-1 text-green-600 text-[11px] font-bold shrink-0 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
              <ShieldCheck size={12} /> Safe
            </div>
          ) : post.status === 'PENDING' ? (
            <div className="flex items-center gap-1 text-yellow-600 text-[11px] font-bold shrink-0 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
              <ShieldAlert size={12} /> Scanning
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600 text-[11px] font-bold shrink-0 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              <ShieldAlert size={12} /> Flagged
            </div>
          )}
        </div>

        {/* Content Body */}
        {isDetail ? (
          <h1 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{post.content}</h1>
        ) : (
          <Link to={`/community/post/${post._id}`}>
            <h2 className="text-[16px] font-semibold text-slate-900 mb-2 hover:underline leading-snug">{post.content}</h2>
          </Link>
        )}

        {/* Media Grid */}
        {post.media && post.media.length > 0 && (
          <div className="mb-3 rounded-xl overflow-hidden border border-slate-200">
            {post.media.map((url: string, idx: number) => (
              <img key={idx} src={url} alt="Post media" className="w-full h-auto max-h-[500px] object-cover" />
            ))}
          </div>
        )}

        {/* Tags / Flairs */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag: string, idx: number) => (
              <span key={idx} className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2.5 py-1 rounded-md border border-slate-200/60">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center gap-1 text-slate-500 font-semibold text-[13px] mt-1 -ml-2">
          <Link to={`/community/post/${post._id}`} className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-slate-100 transition-colors">
            <MessageCircle size={18} className="text-slate-400" />
            <span>{post.commentCount || 0} Comments</span>
          </Link>
          
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-slate-100 transition-colors">
            <Share2 size={18} className="text-slate-400" />
            <span>Share</span>
          </button>
          
          {user && user.id !== post.author?._id && (
            <button onClick={async () => {
              const reason = window.prompt("Why are you reporting this post?");
              if (!reason) return;
              try {
                const { reportPost } = await import("@/services/community-api");
                await reportPost(post._id, reason);
                alert("Post reported successfully. Our admin team will review it.");
              } catch (err) {
                console.error(err);
                alert("Failed to report post.");
              }
            }} className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-slate-100 transition-colors ml-auto">
              <Flag size={16} className="text-slate-400" />
              <span className="hidden sm:inline">Report</span>
            </button>
          )}
        </div>

      </div>
    </article>
  );
};
