import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ExternalLink, Lock, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSeverityColor } from "@/lib/utils";
import { acknowledgeAlert, getAlerts, lockAlert } from "@/services/api";
import { onThreatAlert } from "@/services/socket";
import type { ThreatAlert } from "@/types";
import { useAuthStore } from "@/store/auth";

export function AlertsPage() {
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "acknowledged" | "acknowledgedByMe">("all");
  
  const { user } = useAuthStore();

  const loadAlerts = () => {
    setLoading(true);
    const acknowledged =
      filter === "pending" ? false : (filter === "acknowledged" || filter === "acknowledgedByMe") ? true : undefined;

    getAlerts({ page: 1, limit: 50, acknowledged })
      .then((data) => setAlerts(data.items))
      .catch(() => toast.error("Failed to load alerts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  // 🔴 REAL-TIME: Listen for new alerts via Socket.IO and refresh the list
  useEffect(() => {
    const unsubscribe = onThreatAlert(() => {
      // Re-fetch alerts from server when a new alert arrives via Socket.IO
      const acknowledged =
        filter === "pending" ? false : (filter === "acknowledged" || filter === "acknowledgedByMe") ? true : undefined;
      getAlerts({ page: 1, limit: 50, acknowledged })
        .then((data) => setAlerts(data.items))
        .catch(() => {});
    });
    return () => unsubscribe();
  }, [filter]);

  const handleAcknowledge = async (alertId: string) => {
    // Navigating to details page instead of immediate ack because we need the decision form now
    window.location.href = `/alerts/${alertId}`;
  };

  const handleLock = async (alertId: string) => {
    try {
      await lockAlert(alertId);
      toast.success("Alert locked for investigation");
      // Optimistic UI update
      setAlerts(alerts.map(a => a.alertId === alertId ? { ...a, lockedByAdminId: user?.id, lockedAt: new Date().toISOString() } : a));
    } catch {
      toast.error("Failed to lock alert or already locked");
      loadAlerts();
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const isLockedByOther = alert.lockedByAdminId && alert.lockedByAdminId !== user?.id;
    if (filter === "pending") return !alert.acknowledged && !isLockedByOther;
    if (filter === "acknowledged") return alert.acknowledged;
    if (filter === "acknowledgedByMe") return alert.acknowledged && alert.acknowledgedBy === user?.id;
    return true; // "all" shows everything
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Live Security Alerts</h1>
          <p className="mt-1 text-muted">
            Hot threat streaming events from the Socket.io pipeline
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAlerts} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "acknowledged", "acknowledgedByMe"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "acknowledgedByMe" ? "Acknowledged By Me" : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card className="border-dashed border-border bg-transparent">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/5 p-4 mb-4">
              <Check className="h-8 w-8 text-muted opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-primary mb-1">No Active Alerts</h3>
            <p className="text-sm text-muted max-w-sm">
              All systems nominal. You have no pending alerts to action on.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 flex flex-col">
          {/* Header Row for Table-like layout */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
            <div className="col-span-4">Alert Details</div>
            <div className="col-span-2 text-center">Locked By Me</div>
            <div className="col-span-2 text-center">Locked By Other</div>
            <div className="col-span-2 text-center">Ack By Me</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.alertId}
              className={
                !alert.acknowledged && alert.severity === "CRITICAL"
                  ? "border-red-900/50 bg-red-950/10 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                  : alert.lockedByAdminId ? "border-yellow-900/50 bg-yellow-950/10" : ""
              }
            >
              <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center">
                <div className="col-span-4 flex flex-col space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Badge variant="secondary">{alert.type}</Badge>
                    {alert.action && (
                      <Badge variant="outline">{alert.action}</Badge>
                    )}
                    {!alert.acknowledged && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        Live
                      </span>
                    )}
                    {alert.locked && (
                      <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 border border-yellow-200 px-2 rounded-full">
                        <Lock className="h-3 w-3" />
                        Locked by {alert.lockedBy === user?.id ? "You" : `Admin ${alert.lockedBy?.slice(0, 4)}`}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-primary">{alert.message}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted">
                    <span>ID: {alert.correlationId.slice(0, 16)}...</span>
                    {alert.ipAddress && <span>IP: {alert.ipAddress}</span>}
                    {alert.email && <span>Email: {alert.email}</span>}
                    {alert.riskScore !== undefined && (
                      <span>Risk: {alert.riskScore.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs text-muted">
                    {alert.timestamp && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Event: {new Date(alert.timestamp).toLocaleString()}</span>
                    )}
                    {alert.createdAt && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Alerted: {new Date(alert.createdAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="col-span-2 flex justify-center items-center">
                  {alert.lockedByAdminId === user?.id ? (
                    <Badge variant="outline" className="border-green-600 text-green-500">Yes</Badge>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </div>

                <div className="col-span-2 flex justify-center items-center">
                  {alert.lockedByAdminId && alert.lockedByAdminId !== user?.id ? (
                    <Badge variant="outline" className="border-yellow-600 text-yellow-500">
                      {alert.acknowledged ? "Acknowledged" : "Pending"}
                    </Badge>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </div>

                <div className="col-span-2 flex justify-center items-center">
                  {alert.acknowledged && alert.acknowledgedBy === user?.id ? (
                    <Badge variant="outline" className="border-green-600 text-green-500">Yes</Badge>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  {alert.eventId && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/alerts/${alert.alertId}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Details
                      </Link>
                    </Button>
                  )}
                  
                  {!alert.acknowledged && !alert.lockedByAdminId && (
                     <Button
                       variant="outline"
                       size="sm"
                       className="border-yellow-700/50 text-yellow-500 hover:bg-yellow-900/20"
                       onClick={() => handleLock(alert.alertId)}
                     >
                       <Lock className="h-4 w-4 mr-1" />
                       Lock
                     </Button>
                  )}

                  {!alert.acknowledged && alert.lockedByAdminId === user?.id && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAcknowledge(alert.alertId)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                  
                  {alert.lockedByAdminId && alert.lockedByAdminId !== user?.id && !alert.acknowledged && (
                     <Button variant="secondary" size="sm" disabled>
                        <Lock className="h-4 w-4 mr-1" />
                        In Progress
                     </Button>
                  )}
                  
                  {alert.acknowledged && (
                    <Badge variant="outline" className="border-green-600 text-green-500 py-1.5 px-3">
                      <Check className="h-4 w-4 mr-1" /> Completed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
