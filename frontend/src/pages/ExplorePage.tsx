import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CommunityLayout } from "@/components/layout/CommunityLayout";
import { getTrendingTopics } from "@/services/community-api";
import { Loader2, TrendingUp } from "lucide-react";

export const ExplorePage: React.FC = () => {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrendingTopics()
      .then(res => setTrending(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <CommunityLayout>
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="text-orange-500" /> Explore
        </h2>
      </div>

      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">Trending Topics Worldwide</h3>
              <p className="text-slate-500 text-sm">See what the community is discussing right now.</p>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-500" /></div>
            ) : (
              <div className="flex flex-col">
                {trending.map((topicItem, i) => (
                  <Link 
                    key={i} 
                    to={`/community?topic=${encodeURIComponent(topicItem.topic)}`} 
                    className="px-6 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs font-medium mb-1">
                        {i + 1} &middot; Trending
                      </span>
                      <span className="font-bold text-slate-900 text-[17px] group-hover:text-orange-600 transition-colors">
                        {topicItem.topic}
                      </span>
                      <span className="text-slate-500 text-sm mt-1">
                        {topicItem.count} {topicItem.count === 1 ? 'post' : 'posts'}
                      </span>
                    </div>
                  </Link>
                ))}
                {trending.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-medium">
                    No trending topics available at the moment.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CommunityLayout>
  );
};
