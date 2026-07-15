import React, { useState, useEffect } from "react";
import { Image, Smile, Loader2, Tag, X, ChevronDown } from "lucide-react";
import { createPost, getOrganizations } from "@/services/community-api";
import { useAuthStore } from "@/store/auth";
import EmojiPicker from "emoji-picker-react";

interface PostComposerProps {
  onPostCreated: () => void;
  orgId?: string; // If provided, locks the composer to this org
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated, orgId }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createPost({ 
        content, 
        organizationId: orgId || undefined,
        tags: tags.length > 0 ? tags : undefined,
        mediaUrls: mediaUrl ? [mediaUrl] : undefined
      } as any); 
      setContent("");
      setTags([]);
      setMediaUrl("");
      onPostCreated();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim()) && tags.length < 5) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setContent(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      // Import uploadMedia dynamically or ensure it's imported at top
      const { uploadMedia } = await import("@/services/community-api");
      const res = await uploadMedia(file);
      if (res.success) {
        setMediaUrl(res.url);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const authorImage = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'anon'}`;

  return (
    <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm mb-4">

      <div className="flex gap-4">
        <div className="shrink-0 w-12 pt-1">
          <img src={authorImage} alt="User Avatar" className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
        </div>
        <form className="flex-1" onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={orgId ? "Post to this community..." : "What is happening?!"}
            className="w-full min-h-[60px] bg-transparent border-none resize-none focus:outline-none text-[17px] placeholder-slate-500 text-slate-900 py-1"
            rows={content.split('\n').length > 1 ? content.split('\n').length : 2}
          />
          
          {/* Tags preview */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 text-xs font-bold text-slate-600">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="text-slate-400 hover:text-red-500"><X size={12}/></button>
                </div>
              ))}
            </div>
          )}

          {/* Media preview */}
          {mediaUrl && (
            <div className="relative mb-2 inline-block">
              <img src={`${import.meta.env.VITE_API_URL || ''}${mediaUrl}`} alt="Upload preview" className="max-h-48 rounded-lg border border-slate-200 object-contain" />
              <button 
                type="button" 
                onClick={() => setMediaUrl("")} 
                className="absolute top-1 right-1 bg-slate-800 text-white rounded-full p-1 hover:bg-slate-700"
              >
                <X size={14}/>
              </button>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1 text-orange-500 relative">
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-orange-50 rounded-full transition-colors group relative">
                {isUploading ? <Loader2 size={20} className="animate-spin text-orange-400" /> : <Image size={20} />}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">Add Media</span>
              </button>
              <div className="relative">
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-orange-50 rounded-full transition-colors relative group">
                  <Smile size={20} />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">Emoji</span>
                </button>
                {showEmojiPicker && (
                  <div className="absolute z-50 top-full mt-2 left-0 shadow-xl rounded-xl">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>
              <div className="relative group ml-1 flex items-center">
                <Tag size={18} className="absolute left-2 text-slate-400" />
                <input 
                  type="text" 
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add flair..." 
                  className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs outline-none focus:border-orange-300 w-32 focus:w-48 transition-all" 
                />
              </div>
            </div>
            <button
              disabled={!content.trim() || isSubmitting}
              type="submit"
              className="bg-orange-500 text-white font-bold py-1.5 px-6 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
