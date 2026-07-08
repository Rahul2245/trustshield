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

import { MetricCard } from "@/components/dashboard/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getActionColor } from "@/lib/utils";
import { getDashboardStats, getThreatTrend, getAlerts } from "@/services/api";
import type { DashboardStats, ThreatAlert, TrendPoint } from "@/types";

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
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  const actionData = Object.entries(stats?.threats.actionBreakdown ?? {}).map(
    ([name, value]) => ({ name, value })
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Security Incident Overview
          </h1>
          <p className="mt-1 text-muted">
            Real-time threat intelligence from the AI pipeline
          </p>
        </div>
        <Link
          to="/alerts"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          View Live Alerts
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Active High-Risk Threats"
          value={stats?.threats.highRiskCount ?? 0}
          trend={-12}
          trendLabel="vs last week"
          accent="red"
          href="/threats"
        />
        <MetricCard
          title="Events Scanned Today"
          value={stats?.threats.todayThreats ?? 0}
          trend={23}
          trendLabel="vs yesterday"
          accent="blue"
          href="/threats"
        />
        <MetricCard
          title="Pending Alerts"
          value={stats?.unacknowledgedAlerts ?? 0}
          accent="pink"
          href="/alerts"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Threat Velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trend}>
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Action Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={actionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {actionData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={ACTION_COLORS[entry.name] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {actionData.map((item) => (
                <Badge
                  key={item.name}
                  variant="secondary"
                  className={getActionColor(item.name)}
                >
                  {item.name}: {item.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.length === 0 ? (
                <p className="text-sm text-muted">No recent alerts</p>
              ) : (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.alertId}
                    className="rounded-2xl border border-border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          alert.severity === "CRITICAL" ? "destructive" : "warning"
                        }
                      >
                        {alert.type}
                      </Badge>
                      {!alert.acknowledged && (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium">{alert.message}</p>
                    <p className="mt-1 text-xs text-muted">
                      {alert.correlationId.slice(0, 12)}...
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted">Total Threats</p>
            <p className="text-2xl font-bold">{stats?.threats.totalThreats}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted">Avg Risk Score</p>
            <p className="text-2xl font-bold">
              {stats?.threats.averageRiskScore.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted">Active Users</p>
            <p className="text-2xl font-bold">{stats?.users.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted">Week Events</p>
            <p className="text-2xl font-bold">{stats?.threats.weekThreats}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
