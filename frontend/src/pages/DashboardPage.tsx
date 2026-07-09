import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
    <div className="space-y-10 min-h-screen pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-2">
            Trust & Safety <span className="text-orange-500">Console</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl">
            Real-time threat intelligence protecting the community from spam, account takeovers, and social engineering.
          </p>
        </div>
        <div className="relative z-10">
          <Link
            to="/alerts"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            <Activity size={16} /> Live Feed
          </Link>
        </div>
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        {/* Phase 8: System Monitors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex items-center justify-between">
              <div>
                 <p className="text-slate-400 text-sm font-medium mb-1">Gateway</p>
                 <p className="text-white text-xl font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Online</p>
              </div>
           </div>
           <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex items-center justify-between">
              <div>
                 <p className="text-slate-400 text-sm font-medium mb-1">Redis</p>
                 <p className="text-white text-xl font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Connected</p>
              </div>
           </div>
           <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex items-center justify-between">
              <div>
                 <p className="text-slate-400 text-sm font-medium mb-1">RabbitMQ</p>
                 <p className="text-white text-xl font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Queues Healthy</p>
              </div>
           </div>
           <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex items-center justify-between">
              <div>
                 <p className="text-slate-400 text-sm font-medium mb-1">AI Worker</p>
                 <p className="text-white text-xl font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Processing</p>
              </div>
           </div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                 <AlertTriangle size={18} />
              </div>
              <h3 className="font-semibold text-slate-700">High-Risk Threats</h3>
           </div>
           <div className="text-4xl font-bold text-slate-900 mb-2">{stats?.threats.highRiskCount ?? 0}</div>
           <p className="text-sm text-slate-500">Active threats requiring attention</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-6 rounded-3xl shadow-lg border border-orange-500 text-white relative overflow-hidden">
           <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <Shield size={18} />
              </div>
              <h3 className="font-semibold">Events Scanned</h3>
           </div>
           <div className="text-4xl font-bold mb-2 relative z-10">{stats?.threats.todayThreats ?? 0}</div>
           <p className="text-orange-100 text-sm relative z-10">Today's AI processing volume</p>
           
           <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white rounded-full opacity-10" />
           <div className="absolute top-4 -right-4 w-16 h-16 bg-white rounded-full opacity-10" />
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                 <Activity size={18} />
              </div>
              <h3 className="font-semibold text-slate-700">Pending Alerts</h3>
           </div>
           <div className="text-4xl font-bold text-slate-900 mb-2">{stats?.unacknowledgedAlerts ?? 0}</div>
           <p className="text-sm text-slate-500">Unacknowledged system alerts</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
           <h3 className="text-xl font-bold mb-6">Threat Velocity</h3>
           <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
           <h3 className="text-xl font-bold mb-6">Action Breakdown</h3>
           <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={actionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4}>
                  {actionData.map((entry) => (
                    <Cell key={entry.name} fill={ACTION_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
           </div>
           <div className="mt-4 flex flex-wrap justify-center gap-2">
              {actionData.map((item) => (
                <div key={item.name} className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: ACTION_COLORS[item.name] || '#94a3b8'}} />
                  {item.name}: {item.value}
                </div>
              ))}
            </div>
        </div>
      </div>
      
      {/* Recent Alerts Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Recent Alerts</h3>
            <Link to="/alerts" className="text-sm font-medium text-orange-500 hover:text-orange-600">View All</Link>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAlerts.length === 0 ? (
                <p className="text-sm text-slate-500 col-span-3 py-8 text-center">No recent alerts</p>
              ) : (
                recentAlerts.map((alert) => (
                  <div key={alert.alertId} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full ${
                          alert.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {alert.type}
                      </span>
                      {!alert.acknowledged && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                      )}
                    </div>
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{alert.message}</p>
                    <p className="mt-3 text-xs text-slate-400 font-mono bg-white px-2 py-1 rounded inline-block">
                      Trace: {alert.correlationId.slice(0, 12)}...
                    </p>
                  </div>
                ))
            )}
         </div>
      </div>
    </div>
  );
}
