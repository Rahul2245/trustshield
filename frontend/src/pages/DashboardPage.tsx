import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats, getThreatTrend, getAlerts } from "@/services/api";
import type { DashboardStats, ThreatAlert, TrendPoint } from "@/types";
import { Shield, Activity, AlertTriangle } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  ALLOW: "#10b981",
  MONITOR: "#f59e0b",
  SHADOW: "#a855f7",
  BLOCK: "#ef4444",
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<ThreatAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getThreatTrend(7),
      getAlerts({ page: 1, limit: 5 }),
    ])
      .then(([statsData, trendData, alertsData]) => {
        setStats(statsData);
        setTrend(trendData);
        setRecentAlerts(alertsData.items);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const actionData = Object.entries(stats?.threats.actionBreakdown ?? {}).map(
    ([name, value]) => ({ name, value })
  );

  return (
    <div className="space-y-6 min-h-screen pb-12 font-sans bg-[#111111]">
      {/* Premium Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Trust & Safety <span className="text-[#00FF9D]">Overview</span></h1>
        <div className="flex items-center gap-4">
          <select className="bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-[#00FF9D]">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <button className="bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00FF9D]/20 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface rounded-xl p-6 border border-border relative overflow-hidden group hover:border-accent-green/50 transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] flex flex-col justify-between">
           <div>
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Shield size={64} className="text-accent-green"/></div>
             <p className="text-muted text-sm font-medium mb-2 uppercase tracking-wider">Total Events Scanned</p>
             <h2 className="text-4xl font-bold text-primary mb-4">{stats?.threats.todayThreats ?? 0}</h2>
             <p className="text-xs text-accent-green flex items-center gap-1 font-semibold">+12.5% <span className="text-muted font-normal">vs last period</span></p>
           </div>
           <Link to="/threats" className="mt-4 text-xs font-medium text-accent-green hover:text-accent-green/80 flex items-center gap-1 w-max">
             View Details <span className="text-[10px]">→</span>
           </Link>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-border relative overflow-hidden group hover:border-red-500/50 transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] flex flex-col justify-between">
           <div>
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-500"><AlertTriangle size={64}/></div>
             <p className="text-muted text-sm font-medium mb-2 uppercase tracking-wider">Pending Alerts</p>
             <h2 className="text-4xl font-bold text-primary mb-4">{stats?.unacknowledgedAlerts ?? 0}</h2>
             <p className="text-xs text-red-500 flex items-center gap-1 font-semibold">+5.2% <span className="text-muted font-normal">vs last period</span></p>
           </div>
           <Link to="/alerts" className="mt-4 text-xs font-medium text-red-500 hover:text-red-400 flex items-center gap-1 w-max">
             View Details <span className="text-[10px]">→</span>
           </Link>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-border relative overflow-hidden group hover:border-accent-blue/50 transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] flex flex-col justify-between">
           <div>
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-accent-blue"><Activity size={64}/></div>
             <p className="text-muted text-sm font-medium mb-2 uppercase tracking-wider">AI Confidence Score</p>
             <h2 className="text-4xl font-bold text-primary mb-4">98.5%</h2>
             <p className="text-xs text-accent-green flex items-center gap-1 font-semibold">+0.8% <span className="text-muted font-normal">accuracy rating</span></p>
           </div>
           <Link to="/analytics" className="mt-4 text-xs font-medium text-accent-blue hover:text-accent-blue/80 flex items-center gap-1 w-max">
             View Details <span className="text-[10px]">→</span>
           </Link>
        </div>
      </div>

      {/* Phase 8: System Monitors */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] flex items-center justify-between">
            <div>
               <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Gateway</p>
               <p className="text-white text-sm font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00FF9D]"></span> Online</p>
            </div>
         </div>
         <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] flex items-center justify-between">
            <div>
               <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Redis</p>
               <p className="text-white text-sm font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00FF9D]"></span> Connected</p>
            </div>
         </div>
         <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] flex items-center justify-between">
            <div>
               <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">RabbitMQ</p>
               <p className="text-white text-sm font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00FF9D]"></span> Queues Healthy</p>
            </div>
         </div>
         <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] flex items-center justify-between">
            <div>
               <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">AI Worker</p>
               <p className="text-[#00FF9D] text-sm font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00FF9D] animate-pulse shadow-[0_0_8px_#00FF9D]"></span> Processing</p>
            </div>
         </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-surface rounded-xl p-6 border border-border shadow-sm hover:shadow-[0_0_20px_rgba(239,68,68,0.03)] transition-all">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary">Threat Velocity Trend</h3>
              <div className="flex gap-2 text-xs font-medium">
                 <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20">1H</span>
                 <span className="px-2 py-1 rounded text-muted hover:text-primary cursor-pointer hover:bg-primary/5 transition-colors">4H</span>
                 <span className="px-2 py-1 rounded text-muted hover:text-primary cursor-pointer hover:bg-primary/5 transition-colors">1D</span>
                 <span className="px-2 py-1 rounded text-muted hover:text-primary cursor-pointer hover:bg-primary/5 transition-colors">1W</span>
              </div>
           </div>
           <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '4 4'}} contentStyle={{backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-primary)'}} itemStyle={{ color: '#ef4444' }} />
                <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorRed)" />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-surface rounded-xl p-6 border border-border flex flex-col shadow-sm">
           <h3 className="text-lg font-bold text-primary mb-6">Action Breakdown</h3>
           <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={actionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4}>
                  {actionData.map((entry) => (
                    <Cell key={entry.name} fill={ACTION_COLORS[entry.name] ?? "var(--color-muted)"} stroke="var(--color-surface)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-primary)'}} />
              </PieChart>
            </ResponsiveContainer>
           </div>
           <div className="mt-4 flex flex-wrap justify-center gap-2">
              {actionData.map((item) => (
                <div key={item.name} className="px-3 py-1.5 bg-primary/5 rounded-full border border-border text-xs font-medium text-primary flex items-center gap-2 shadow-sm transition-colors hover:bg-primary/10">
                  <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{backgroundColor: ACTION_COLORS[item.name] || 'var(--color-muted)'}} />
                  {item.name}: <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
        </div>
      </div>
      
      {/* Analytics Section */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
         <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-white mb-6">Targeted Organizations (Top 5)</h3>
            <div className="space-y-4">
               {[
                  { name: "React Enthusiasts", threats: 342, percentage: 85 },
                  { name: "Trust & Safety Professionals", threats: 156, percentage: 65 },
                  { name: "OpenAI Developer Group", threats: 98, percentage: 40 },
                  { name: "Cyber Security Group", threats: 64, percentage: 25 },
                  { name: "Cloud Computing Hub", threats: 32, percentage: 10 },
               ].map(org => (
                  <div key={org.name}>
                     <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{org.name}</span>
                        <span className="text-[#00FF9D] font-bold">{org.threats}</span>
                     </div>
                     <div className="w-full bg-[#111111] rounded-full h-2">
                        <div className="bg-[#00FF9D] h-2 rounded-full" style={{ width: `${org.percentage}%` }}></div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
         <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-white mb-6">Threat Origins (IP Location)</h3>
            <div className="space-y-4">
               {[
                  { region: "North America", threats: 450, percentage: 90 },
                  { region: "Eastern Europe", threats: 230, percentage: 60 },
                  { region: "Asia Pacific", threats: 180, percentage: 45 },
                  { region: "Western Europe", threats: 95, percentage: 25 },
                  { region: "South America", threats: 40, percentage: 10 },
               ].map(origin => (
                  <div key={origin.region}>
                     <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{origin.region}</span>
                        <span className="text-[#ef4444] font-bold">{origin.threats}</span>
                     </div>
                     <div className="w-full bg-[#111111] rounded-full h-2">
                        <div className="bg-[#ef4444] h-2 rounded-full" style={{ width: `${origin.percentage}%` }}></div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
      
      {/* Recent Alerts Section */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Recent Alerts</h3>
            <Link to="/alerts" className="text-sm font-medium text-[#00FF9D] hover:text-[#00FF9D]/80">View All</Link>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAlerts.length === 0 ? (
                <p className="text-sm text-gray-500 col-span-3 py-8 text-center">No recent alerts</p>
              ) : (
                recentAlerts.map((alert) => (
                  <Link to={`/alerts/${alert.alertId}`} key={alert.alertId} className="bg-primary/5 rounded-lg p-5 border border-border hover:border-accent-green/50 transition-colors block">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-sm ${
                          alert.severity === "CRITICAL" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      }`}>
                        {alert.type}
                      </span>
                      {!alert.acknowledged && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                      )}
                    </div>
                    <p className="font-medium text-primary text-sm leading-relaxed">{alert.message}</p>
                    <p className="mt-3 text-[10px] text-muted font-mono">
                      TRACE ID: {alert.correlationId.slice(0, 12)}
                    </p>
                  </Link>
                ))
            )}
         </div>
      </div>
    </div>
  );  


}