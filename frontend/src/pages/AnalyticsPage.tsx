import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats, getThreatTrend } from "@/services/api";
import type { DashboardStats, TrendPoint } from "@/types";

export function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getDashboardStats(), getThreatTrend(days)])
      .then(([statsData, trendData]) => {
        setStats(statsData);
        setTrend(trendData);
      })
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const actionData = Object.entries(stats?.threats.actionBreakdown ?? {}).map(
    ([name, count]) => ({ name, count })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Threat Analytics</h1>
          <p className="mt-1 text-muted">
            Classification breakdown and velocity trends
          </p>
        </div>
        <select
          className="h-10 rounded-full border border-border bg-surface px-4 text-sm text-primary outline-none focus:ring-2 focus:ring-accent-green/50 hover:bg-primary/5 transition-colors cursor-pointer"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Threat Velocity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={(v) => v.slice(5)} stroke="var(--color-border)" />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} stroke="var(--color-border)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-primary)' }}
                itemStyle={{ color: 'var(--color-primary)' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                fill="url(#colorCount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={(v) => v.slice(5)} stroke="var(--color-border)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} stroke="var(--color-border)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-primary)' }}
                  itemStyle={{ color: 'var(--color-primary)' }}
                />
                <Line
                  type="monotone"
                  dataKey="avgRisk"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={{ fill: "#ec4899" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blocked Events</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={(v) => v.slice(5)} stroke="var(--color-border)" />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} stroke="var(--color-border)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-primary)' }}
                  itemStyle={{ color: 'var(--color-primary)' }}
                />
                <Line
                  type="monotone"
                  dataKey="blocked"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classification Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actionData.map((item) => {
              const total = stats?.threats.totalThreats || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-primary/10">
                    <div
                      className="h-full rounded-full bg-accent-blue transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
