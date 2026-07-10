import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, MessageCircle, Share2, ArrowUp, ArrowDown } from "lucide-react";
import { upvotePost, downvotePost } from "@/services/community-api";

interface PostCardProps {
  post: any;
  onUpdate?: () => void;
  isDetail?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdate, isDetail = false }) => {
  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await upvotePost(post._id);
      if (onUpdate) onUpdate();
    } catch (error) {}
  };

  const handleDownvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await downvotePost(post._id);
      if (onUpdate) onUpdate();
    } catch (error) {}
  };

  const netVotes = (post.upvotes?.length || 0) - (post.downvotes?.length || 0);
  
  // Decide how to render the author image
  const authorImage = post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?._id}`;
  const authorName = post.author?.email?.split('@')[0] || "anonymous";

  return (
    <article className={`flex gap-3 bg-white p-4 ${!isDetail ? 'border-b border-slate-200 hover:bg-slate-50 transition-colors' : ''}`}>
      {/* Left side: Avatar and Voting (Reddit style on detail, X style on feed) */}
      <div className="flex flex-col items-center shrink-0 w-12">
        <Link to={`/user/${post.author?._id}`}>
          <img src={authorImage} alt={authorName} className="w-10 h-10 rounded-full bg-slate-200 hover:opacity-80 transition-opacity object-cover" />
        </Link>
      </div>

      {/* Right side: Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 overflow-hidden text-[15px]">
            <Link to={`/user/${post.author?._id}`} className="font-bold text-slate-900 truncate hover:underline">
              {authorName}
            </Link>
            <span className="text-slate-500 truncate">@{authorName}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500 text-sm hover:underline">
              {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {post.status === 'APPROVED' ? (
            <div className="flex items-center gap-1 text-green-600 text-xs font-bold shrink-0">
              <ShieldCheck size={14} /> Safe
            </div>
          ) : post.status === 'PENDING' ? (
            <div className="flex items-center gap-1 text-yellow-600 text-xs font-bold shrink-0 bg-yellow-50 px-2 py-0.5 rounded-full">
              <ShieldAlert size={14} /> Scanning
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600 text-xs font-bold shrink-0">
              <ShieldAlert size={14} /> Flagged
            </div>
          )}
        </div>

        {post.organization && (
          <div className="text-xs text-slate-500 mb-2">
            Posted in <Link to={`/org/${post.organization.slug || post.organization._id}`} className="font-bold text-orange-600 hover:underline">c/{post.organization.name}</Link>
          </div>
        )}

        {isDetail ? (
          <p className="text-slate-900 text-[17px] leading-normal mb-3 whitespace-pre-wrap break-words">{post.content}</p>
        ) : (
          <Link to={`/community/post/${post._id}`}>
            <p className="text-slate-900 text-[15px] leading-normal mb-3 whitespace-pre-wrap break-words">{post.content}</p>
          </Link>
        )}

        <div className="flex items-center justify-between text-slate-500 mt-2 max-w-md">
          {/* Comments */}
          <Link to={`/community/post/${post._id}`} className="flex items-center gap-2 group hover:text-blue-500 transition-colors">
            <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
              <MessageCircle size={18} />
            </div>
            <span className="text-sm">{post.commentCount || 0}</span>
          </Link>
          
          {/* Upvote / Downvote */}
          <div className="flex items-center gap-1">
            <button onClick={handleUpvote} className="p-2 rounded-full hover:bg-orange-50 hover:text-orange-500 transition-colors">
              <ArrowUp size={18} />
            </button>
            <span className={`text-sm font-bold min-w-[20px] text-center ${netVotes > 0 ? 'text-orange-500' : netVotes < 0 ? 'text-blue-500' : ''}`}>
              {netVotes}
            </span>
            <button onClick={handleDownvote} className="p-2 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors">
              <ArrowDown size={18} />
            </button>
          </div>

          <button className="flex items-center gap-2 group hover:text-green-500 transition-colors">
            <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
              <Share2 size={18} />
            </div>
          </button>
        </div>
      </div>
    </article>
  );
};
