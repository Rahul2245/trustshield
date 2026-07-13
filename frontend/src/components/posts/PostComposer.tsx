import React, { useState, useEffect } from "react";
import { Image, Smile, Loader2, Tag, X, ChevronDown } from "lucide-react";
import { createPost, getOrganizations } from "@/services/community-api";
import { useAuthStore } from "@/store/auth";

interface PostComposerProps {
  onPostCreated: () => void;
  orgId?: string; // If provided, locks the composer to this org
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated, orgId }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>(orgId || "");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [myOrgs, setMyOrgs] = useState<any[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!orgId) {
      // Fetch orgs to populate the dropdown
      getOrganizations().then(res => {
        if (res.success) {
          // In a real app, we might filter to just "joined" orgs
          setMyOrgs(res.data.items);
        }
      });
    }
  }, [orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createPost({ 
        content, 
        organizationId: selectedOrg || undefined,
        tags: tags.length > 0 ? tags : undefined
      } as any); // Backend currently doesn't strictly type tags in frontend API call, but we can pass it
      setContent("");
      setTags([]);
      setSelectedOrg(orgId || "");
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

  const authorImage = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'anon'}`;

  return (
    <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm mb-4">
      {!orgId && (
        <div className="mb-3 flex items-center gap-2">
          <select 
            value={selectedOrg} 
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block px-2.5 py-1.5 outline-none font-bold appearance-none cursor-pointer pr-8 relative"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.2rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="">Global Feed (No Community)</option>
            {myOrgs.map(org => (
              <option key={org._id} value={org._id}>c/{org.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-4">
        <div className="shrink-0 w-12 pt-1">
          <img src={authorImage} alt="User Avatar" className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
        </div>
        <form className="flex-1" onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={selectedOrg ? "Post to this community..." : "What is happening?!"}
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

          <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1 text-orange-500 relative">
              <button type="button" className="p-2 hover:bg-orange-50 rounded-full transition-colors group relative">
                <Image size={20} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">Add Media</span>
              </button>
              <button type="button" className="p-2 hover:bg-orange-50 rounded-full transition-colors relative group">
                <Smile size={20} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">Emoji</span>
              </button>
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
