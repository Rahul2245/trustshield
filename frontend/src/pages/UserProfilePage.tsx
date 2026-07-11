import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User, MapPin, Link as LinkIcon, Calendar, Globe, Hash,
  Award, Shield, Edit2, CheckCircle2, MessageSquare, Heart,
  Bookmark, Camera, X, Check, Loader2, Briefcase, Code, Sparkles, Building
} from "lucide-react";
import { toast } from "sonner";
import { getMyProfile, updateProfile } from "@/services/community-api";
import { useAuthStore } from "@/store/auth";

export const UserProfilePage: React.FC = () => {
  const { user: authUser, hydrate } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    headline: "",
    bio: "",
    company: "",
    jobTitle: "",
    location: "",
    website: "",
    skills: "",
    interests: "",
    avatar: "",
    coverImage: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await getMyProfile();
      setProfile(res.data);
      populateEditForm(res.data);
    } catch (err) {
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (data: any) => {
    const sl = data.socialLinks || {};
    setEditForm({
      name: sl.name || "",
      username: sl.username || data.email.split("@")[0],
      headline: sl.headline || "",
      bio: data.bio || "",
      company: sl.company || "",
      jobTitle: sl.jobTitle || "",
      location: sl.location || "",
      website: sl.website || "",
      skills: sl.skills || "",
      interests: sl.interests || "",
      avatar: data.avatar || "",
      coverImage: data.coverImage || "",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        bio: editForm.bio,
        avatar: editForm.avatar,
        coverImage: editForm.coverImage,
        socialLinks: {
          name: editForm.name,
          username: editForm.username,
          headline: editForm.headline,
          company: editForm.company,
          jobTitle: editForm.jobTitle,
          location: editForm.location,
          website: editForm.website,
          skills: editForm.skills,
          interests: editForm.interests,
        }
      };
      await updateProfile(payload);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      await loadProfile();
      hydrate(); // refresh auth store user
    } catch (err) {
      toast.error("Failed to save profile updates.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const sl = profile.socialLinks || {};
  const displayName = sl.name || "Anonymous User";
  const displayUsername = sl.username || profile.email.split("@")[0];
  const displayLocation = sl.location || "";
  const displayCompany = sl.company || "";
  const displayRole = sl.jobTitle || "";
  const displayWebsite = sl.website || "";
  const displaySkills = sl.skills ? sl.skills.split(",") : [];

  const completionScore = Object.values(editForm).filter(Boolean).length / Object.keys(editForm).length * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-8 py-3 flex items-center justify-between">
        <Link to="/community" className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-orange-500 to-orange-400 rounded-lg shadow-sm flex items-center justify-center">
             <Shield size={16} className="text-white" />
          </div>
          EchoSphere
        </Link>
        <div className="flex items-center gap-6">
           <Link to="/community" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Feed</Link>
           <button 
             onClick={() => setIsEditing(true)}
             className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow active:scale-95"
           >
             Edit Profile
           </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* HERO SECTION */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-8 relative transition-all">
           {/* Cover Image */}
           <div className="h-64 w-full relative group">
              {profile.coverImage ? (
                <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-orange-400 via-rose-400 to-purple-500" />
              )}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              
              <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                 <Shield size={14} className="text-blue-300" /> Verified Member
              </div>
           </div>
           
           <div className="px-8 pb-8 relative">
              {/* Avatar */}
              <div className="w-36 h-36 rounded-full border-4 border-white bg-slate-100 absolute -top-16 shadow-lg flex items-center justify-center overflow-hidden z-10 group">
                 {profile.avatar ? (
                   <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <User size={64} className="text-slate-400" />
                 )}
                 <button onClick={() => setIsEditing(true)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white h-8 w-8" />
                 </button>
              </div>
              
              <div className="mt-24 flex flex-col md:flex-row justify-between items-start gap-6">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                      {displayName}
                      {profile.role === "ADMIN" && <CheckCircle2 className="text-blue-500 h-5 w-5" />}
                    </h1>
                    <p className="text-slate-500 font-medium">@{displayUsername}</p>
                    
                    {sl.headline && (
                      <p className="text-slate-800 mt-4 max-w-2xl text-lg leading-relaxed font-medium">
                        {sl.headline}
                      </p>
                    )}
                 </div>
                 
                 <div className="flex gap-3 shrink-0">
                    <button className="w-10 h-10 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all shadow-sm">
                       <Hash size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all shadow-sm">
                       <Globe size={18} />
                    </button>
                    <button onClick={() => setIsEditing(true)} className="px-4 h-10 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-700 font-medium transition-all shadow-sm gap-2">
                       <Edit2 size={16} /> Edit
                    </button>
                 </div>
              </div>
              
              {/* Info Tags */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6 text-sm text-slate-600 font-medium">
                 {displayLocation && <div className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer"><MapPin size={16} className="text-slate-400"/> {displayLocation}</div>}
                 {(displayCompany || displayRole) && <div className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer"><Briefcase size={16} className="text-slate-400"/> {displayRole} {displayCompany && `at ${displayCompany}`}</div>}
                 {displayWebsite && <div className="flex items-center gap-2"><LinkIcon size={16} className="text-slate-400"/> <a href={displayWebsite} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{displayWebsite.replace(/^https?:\/\//, '')}</a></div>}
                 <div className="flex items-center gap-2"><Calendar size={16} className="text-slate-400"/> Joined {new Date(profile.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              </div>
              
              {/* Stats */}
              <div className="flex gap-8 mt-8 pt-6 border-t border-slate-100">
                 <div className="hover:opacity-80 cursor-pointer transition-opacity"><span className="font-bold text-slate-900 text-xl">{profile.followers?.length || 0}</span> <span className="text-slate-500 text-sm font-medium">Followers</span></div>
                 <div className="hover:opacity-80 cursor-pointer transition-opacity"><span className="font-bold text-slate-900 text-xl">{profile.following?.length || 0}</span> <span className="text-slate-500 text-sm font-medium">Following</span></div>
                 <div><span className="font-bold text-slate-900 text-xl">15k</span> <span className="text-slate-500 text-sm font-medium">Reputation</span></div>
                 <div><span className="font-bold text-slate-900 text-xl">4.9</span> <span className="text-slate-500 text-sm font-medium">Engagement</span></div>
              </div>
           </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Sidebar */}
           <div className="lg:col-span-1 space-y-6">
              {/* Completion Widget */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center mb-2">
                   <h3 className="font-semibold text-slate-900">Profile Completion</h3>
                   <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">{Math.round(completionScore)}%</span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-1000" style={{ width: `${completionScore}%` }} />
                 </div>
                 {completionScore < 100 && (
                   <p className="text-xs text-slate-500 font-medium">Complete your profile to boost visibility and trust within the community.</p>
                 )}
              </div>

              {/* Badges & Achievements */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2"><Award size={18} className="text-orange-500"/> Badges & Trophies</h3>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-default">
                       <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-600 flex items-center justify-center shadow-sm border border-yellow-300/50"><Sparkles size={20}/></div>
                       <div>
                          <div className="font-semibold text-sm text-slate-900">Top Contributor</div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">Top 1% of community</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-default">
                       <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 flex items-center justify-center shadow-sm border border-blue-300/50"><Shield size={20}/></div>
                       <div>
                          <div className="font-semibold text-sm text-slate-900">Guardian</div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">Keeps community safe</div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Skills */}
              {displaySkills.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Code size={18} className="text-slate-500"/> Skills</h3>
                   <div className="flex flex-wrap gap-2">
                     {displaySkills.map((skill: string, idx: number) => (
                       <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200/60 hover:border-slate-300 transition-colors">{skill.trim()}</span>
                     ))}
                   </div>
                </div>
              )}
           </div>
           
           {/* Activity & Content Area */}
           <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
                 
                 {/* Tabs */}
                 <div className="flex items-center border-b border-slate-100 px-2 overflow-x-auto no-scrollbar">
                    {["Posts", "Discussions", "Comments", "Saved", "Upvoted", "About"].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'}`}
                      >
                        {tab}
                      </button>
                    ))}
                 </div>
                 
                 {/* Tab Content */}
                 <div className="flex-1 p-8">
                    {activeTab === "about" ? (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div>
                           <h3 className="text-lg font-bold text-slate-900 mb-3">About</h3>
                           <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{profile.bio || "No bio provided."}</p>
                         </div>
                         
                         {sl.interests && (
                           <div>
                             <h3 className="text-lg font-bold text-slate-900 mb-3">Interests</h3>
                             <p className="text-slate-600 leading-relaxed">{sl.interests}</p>
                           </div>
                         )}

                         {/* Security Summary (Read Only View) */}
                         <div className="pt-8 mt-8 border-t border-slate-100">
                           <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Shield size={18} className="text-green-500"/> Account Security</h3>
                           <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                                <p className="font-medium text-green-600 flex items-center gap-1"><CheckCircle2 size={14}/> {profile.status}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</p>
                                <p className="font-medium text-slate-900">{profile.email}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Login</p>
                                <p className="font-medium text-slate-900">{profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : "Unknown"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">2FA Status</p>
                                <p className="font-medium text-slate-400">Not configured</p>
                              </div>
                           </div>
                           <p className="text-xs text-slate-500 mt-3 font-medium">To change your email or password, please visit your account Settings.</p>
                         </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12 animate-in fade-in duration-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                          {activeTab === "posts" && <MessageSquare size={24} className="text-slate-300"/>}
                          {activeTab === "comments" && <MessageSquare size={24} className="text-slate-300"/>}
                          {activeTab === "saved" && <Bookmark size={24} className="text-slate-300"/>}
                          {activeTab === "upvoted" && <Heart size={24} className="text-slate-300"/>}
                          {activeTab === "discussions" && <Hash size={24} className="text-slate-300"/>}
                        </div>
                        <h4 className="text-lg font-medium text-slate-900 mb-1">No {activeTab} yet</h4>
                        <p className="text-sm">When you interact with the community, it will show up here.</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </main>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur z-10">
               <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
               <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                 <X size={20} className="text-slate-500" />
               </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
               <form id="edit-profile-form" onSubmit={handleSave} className="space-y-6">
                  
                  {/* Media Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Avatar URL</label>
                      <input 
                        type="url" 
                        value={editForm.avatar} 
                        onChange={(e) => setEditForm({...editForm, avatar: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Cover Image URL</label>
                      <input 
                        type="url" 
                        value={editForm.coverImage} 
                        onChange={(e) => setEditForm({...editForm, coverImage: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={editForm.name} 
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-2.5 text-slate-400 font-medium">@</span>
                        <input 
                          type="text" 
                          required
                          value={editForm.username} 
                          onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900">Professional Headline</label>
                    <input 
                      type="text" 
                      value={editForm.headline} 
                      onChange={(e) => setEditForm({...editForm, headline: e.target.value})}
                      placeholder="e.g. Senior Product Designer @ TechCorp"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-900">Bio</label>
                      <span className="text-xs text-slate-400 font-medium">{editForm.bio.length} / 500</span>
                    </div>
                    <textarea 
                      maxLength={500}
                      rows={4}
                      value={editForm.bio} 
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Company</label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={editForm.company} 
                          onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Job Title</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={editForm.jobTitle} 
                          onChange={(e) => setEditForm({...editForm, jobTitle: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={editForm.location} 
                          onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Website</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input 
                          type="url" 
                          value={editForm.website} 
                          onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900">Skills (comma separated)</label>
                    <input 
                      type="text" 
                      value={editForm.skills} 
                      onChange={(e) => setEditForm({...editForm, skills: e.target.value})}
                      placeholder="React, TypeScript, UI/UX"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>

               </form>
             </div>

             <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="edit-profile-form"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/20 active:scale-95 transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2 shadow-md"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
