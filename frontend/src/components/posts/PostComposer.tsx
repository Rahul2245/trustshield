import React, { useState } from "react";
import { Image, Smile, Loader2 } from "lucide-react";
import { createPost } from "@/services/community-api";
import { useAuthStore } from "@/store/auth";

interface PostComposerProps {
  onPostCreated: () => void;
  orgId?: string;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated, orgId }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createPost({ content, organizationId: orgId });
      setContent("");
      onPostCreated();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const authorImage = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'anon'}`;

  return (
    <div className="bg-white p-4 border-b border-slate-200">
      <div className="flex gap-4">
        <div className="shrink-0 w-12 pt-1">
          <img src={authorImage} alt="User Avatar" className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
        </div>
        <form className="flex-1" onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={orgId ? "Post to this community..." : "What is happening?!"}
            className="w-full min-h-[50px] bg-transparent border-none resize-none focus:outline-none text-xl placeholder-slate-500 text-slate-900 py-2"
            rows={content.split('\n').length > 1 ? content.split('\n').length : 2}
          />
          <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1 text-orange-500">
              <button type="button" className="p-2 hover:bg-orange-50 rounded-full transition-colors"><Image size={20} /></button>
              <button type="button" className="p-2 hover:bg-orange-50 rounded-full transition-colors"><Smile size={20} /></button>
            </div>
            <button
              disabled={!content.trim() || isSubmitting}
              type="submit"
              className="bg-orange-500 text-white font-bold py-1.5 px-5 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
