import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldAlert, Activity, MapPin, MonitorSmartphone, Code2, AlertTriangle, Shield, Check, Crosshair } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAlerts } from "@/services/api";
import type { ThreatAlert } from "@/types";
import { cn, getSeverityColor } from "@/lib/utils";

export function AlertDetailPage() {
  const { alertId } = useParams<{ alertId: string }>();
  const [alert, setAlert] = useState<ThreatAlert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!alertId) return;
    // We fetch all alerts and find the one. (In a real app, we'd have a getAlertById API)
    getAlerts({ page: 1, limit: 100 })
      .then((data) => {
        const found = data.items.find((a) => a.alertId === alertId);
        setAlert(found || null);
      })
      .finally(() => setLoading(false));
  }, [alertId]);

  const handleAction = (actionName: string, type: "success" | "error" | "info") => {
    toast[type](`${actionName} triggered successfully.`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Alert not found</p>
        <Link to="/alerts" className="mt-4 text-accent-blue hover:underline">
          Back to alerts
        </Link>
      </div>
    );
  }

  const isLive = !alert.acknowledged;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/alerts"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-primary/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-primary" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">Alert {alert.alertId.slice(0, 8)}</h1>
              {isLive && (
                <Badge variant="outline" className="border-red-500 text-red-500 animate-pulse bg-red-500/10 gap-1">
                  <Activity className="h-3 w-3" /> LIVE
                </Badge>
              )}
            </div>
            <p className="font-mono text-sm text-muted mt-1">{alert.message}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-surface border border-border p-3 rounded-2xl shadow-sm">
          <div className="text-right">
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Risk Score</p>
            <p className="text-xl font-bold text-primary">
              {alert.riskScore !== undefined ? alert.riskScore.toFixed(1) : "N/A"}
            </p>
          </div>
          <div className={cn("h-12 w-1.5 rounded-full", alert.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-yellow-500')} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Details Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-accent-blue" /> Target Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/5 p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-muted">
                    <MonitorSmartphone className="h-4 w-4" /> <span className="text-xs uppercase tracking-wider font-semibold">Origin IP</span>
                  </div>
                  <p className="font-mono text-primary font-medium">{alert.ipAddress || "Unknown"}</p>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-muted">
                    <MapPin className="h-4 w-4" /> <span className="text-xs uppercase tracking-wider font-semibold">Location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇺🇸</span>
                    <p className="text-primary font-medium">Ashburn, VA (Mock)</p>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-border/50 md:col-span-2">
                  <div className="flex items-center gap-2 mb-2 text-muted">
                    <ShieldAlert className="h-4 w-4" /> <span className="text-xs uppercase tracking-wider font-semibold">Target Account</span>
                  </div>
                  <p className="text-primary font-medium">{alert.email || "Unknown"}</p>
                  <p className="text-xs text-muted mt-1 font-mono">ID: {alert.correlationId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payload / Trace Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-accent-pink" /> Threat Payload Trace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto shadow-inner relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent opacity-50" />
                <pre className="text-sm font-mono text-green-400">
                  {`{
  "timestamp": "${alert.timestamp ? new Date(alert.timestamp).toISOString() : "Unknown"}",
  "alertId": "${alert.alertId}",
  "type": "${alert.type}",
  "severity": "${alert.severity}",
  "action_blocked": true,
  "request": {
    "ip": "${alert.ipAddress || "Unknown"}",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "method": "POST",
    "endpoint": "/api/v1/auth/login"
  },
  "flags": ["RATE_LIMIT_EXCEEDED", "HIGH_VELOCITY"]
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Hub - Right Column (1/3) */}
        <div className="space-y-6">
          <Card className="border-accent-blue/20 bg-accent-blue/5 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
            <CardHeader>
              <CardTitle className="text-lg">Response Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button 
                variant="destructive" 
                className="w-full justify-start gap-3 bg-red-600 hover:bg-red-700 shadow-md shadow-red-900/20"
                onClick={() => handleAction("IP Address Blocked", "error")}
              >
                <ShieldAlert className="h-4 w-4" /> Block IP Address
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-colors"
                onClick={() => handleAction("User Account Isolated", "info")}
              >
                <AlertTriangle className="h-4 w-4" /> Isolate User Account
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 border-accent-blue/50 text-accent-blue hover:bg-accent-blue/10 transition-colors"
                onClick={() => handleAction("Escalated to Tier 2", "info")}
              >
                <Shield className="h-4 w-4" /> Escalate to Tier 2
              </Button>

              <div className="h-px w-full bg-border my-2" />

              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-muted hover:text-green-500 hover:bg-green-500/10 transition-colors"
                onClick={() => handleAction("Marked as False Positive", "success")}
              >
                <Check className="h-4 w-4" /> Mark as False Positive
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted">Type</span>
                <span className="font-medium text-primary">{alert.type}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted">Severity</span>
                <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Time</span>
                <span className="font-medium text-primary">{alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : "Unknown"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
