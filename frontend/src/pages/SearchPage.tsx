import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, Filter, Hash, User, Building } from "lucide-react";

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'users' | 'orgs'>('all');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
        <Link to="/community" className="text-xl font-bold tracking-tight text-slate-900">EchoSphere</Link>
        <Link to="/community" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Cancel</Link>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Search Bar */}
        <div className="relative mb-8">
           <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
             <SearchIcon size={20} className="text-slate-400" />
           </div>
           <input 
             type="text"
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors shadow-sm"
             placeholder="Search for posts, users, organizations, or communities..."
             autoFocus
           />
           <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
             <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
               <Filter size={20} />
             </button>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
           <button onClick={() => setActiveTab('all')} className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>All Results</button>
           <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'posts' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Hash size={16}/> Posts</button>
           <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><User size={16}/> Users</button>
           <button onClick={() => setActiveTab('orgs')} className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'orgs' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Building size={16}/> Organizations</button>
        </div>

        {/* Results Area */}
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 text-center">
           {query ? (
             <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4">
                  <SearchIcon size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Searching...</h3>
                <p className="text-slate-500 max-w-sm">
                  We are querying the database for "{query}" across {activeTab === 'all' ? 'all categories' : activeTab}.
                </p>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <SearchIcon size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Discover EchoSphere</h3>
                <p className="text-slate-500 max-w-sm">
                  Start typing above to search the global network of users, communities, and discussions.
                </p>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};
