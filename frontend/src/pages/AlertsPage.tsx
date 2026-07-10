import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ExternalLink, Lock, RefreshCw } from "lucide-react";
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
  const [filter, setFilter] = useState<"all" | "pending" | "acknowledged">("all");
  
  const { user } = useAuthStore();

  const loadAlerts = () => {
    setLoading(true);
    const acknowledged =
      filter === "pending" ? false : filter === "acknowledged" ? true : undefined;

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
        filter === "pending" ? false : filter === "acknowledged" ? true : undefined;
      getAlerts({ page: 1, limit: 50, acknowledged })
        .then((data) => setAlerts(data.items))
        .catch(() => {});
    });
    return () => unsubscribe();
  }, [filter]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      toast.success("Alert acknowledged");
      loadAlerts();
    } catch {
      toast.error("Failed to acknowledge alert");
    }
  };

  const handleLock = async (alertId: string) => {
    try {
      await lockAlert(alertId);
      toast.success("Alert locked for investigation");
      // Optimistic UI update
      setAlerts(alerts.map(a => a.alertId === alertId ? { ...a, locked: true, lockedBy: user?.id } : a));
    } catch {
      toast.error("Failed to lock alert or already locked");
      loadAlerts();
    }
  };

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
        {(["all", "pending", "acknowledged"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted">
            No alerts found. Alerts appear when rate limits trigger or AI
            evaluation completes.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card
              key={alert.alertId}
              className={
                !alert.acknowledged && alert.severity === "CRITICAL"
                  ? "border-red-300 bg-red-50/30"
                  : alert.locked ? "border-yellow-300 bg-yellow-50/10" : ""
              }
            >
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
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
                </div>
                <div className="flex gap-2">
                  {alert.eventId && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/threats/${alert.eventId}`}>
                        <ExternalLink className="h-4 w-4" />
                        Details
                      </Link>
                    </Button>
                  )}
                  
                  {!alert.acknowledged && !alert.locked && (
                     <Button
                       variant="outline"
                       size="sm"
                       className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                       onClick={() => handleLock(alert.alertId)}
                     >
                       <Lock className="h-4 w-4 mr-1" />
                       Lock
                     </Button>
                  )}

                  {!alert.acknowledged && (alert.lockedBy === user?.id || !alert.locked) && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAcknowledge(alert.alertId)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                  
                  {alert.locked && alert.lockedBy !== user?.id && (
                     <Button variant="secondary" size="sm" disabled>
                        <Lock className="h-4 w-4 mr-1" />
                        In Progress
                     </Button>
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
