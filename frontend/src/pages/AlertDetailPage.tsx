import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldAlert, Activity, MapPin, MonitorSmartphone, Code2, AlertTriangle, Shield, Check, Crosshair, FileText, Clock, User, Lock } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAlertById, acknowledgeAlert } from "@/services/api";
import type { ThreatAlert } from "@/types";
import { cn, getSeverityColor } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

type AlertWithAudit = ThreatAlert & { auditLogs?: any[] };

export function AlertDetailPage() {
  const { alertId } = useParams<{ alertId: string }>();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<AlertWithAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const [decision, setDecision] = useState("Handled");
  const [remarks, setRemarks] = useState("");
  const [userStatus, setUserStatus] = useState<"ACTIVE" | "INACTIVE" | "SUSPENDED" | "">("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!alertId) return;
    getAlertById(alertId)
      .then((data) => setAlert(data))
      .catch(() => toast.error("Failed to load alert details"))
      .finally(() => setLoading(false));
  }, [alertId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertId) return;
    setSubmitting(true);
    try {
      await acknowledgeAlert(alertId, {
        decision,
        resolution: "Completed",
        userStatus: userStatus || undefined,
        remarks
      });
      toast.success("Alert successfully acknowledged and closed.");
      navigate("/alerts");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to acknowledge alert");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionClick = (presetDecision: string, actionName: string, type: "success" | "error" | "info") => {
    setDecision(presetDecision);
    toast[type](`${actionName} preset selected.`);
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
  const canAcknowledge = isLive && (!alert.lockedByAdminId || alert.lockedByAdminId === user?.id);

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
              {isLive ? (
                <Badge variant="outline" className="border-red-500 text-red-500 animate-pulse bg-red-500/10 gap-1">
                  <Activity className="h-3 w-3" /> LIVE
                </Badge>
              ) : (
                <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> COMPLETED
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

      {/* Admin Assignment / Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-primary/5 p-4 rounded-xl border border-border">
        <div>
          <p className="text-xs text-muted font-semibold uppercase mb-1">Generated By</p>
          <p className="text-sm font-medium">System Automated</p>
        </div>
        <div>
          <p className="text-xs text-muted font-semibold uppercase mb-1">Handled By</p>
          <p className="text-sm font-medium">
             {alert.acknowledgedBy ? `Admin ${alert.acknowledgedBy.slice(0,6)}` : alert.lockedByAdminId ? `Admin ${alert.lockedByAdminId.slice(0,6)}` : "Unassigned"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted font-semibold uppercase mb-1">Decision</p>
          <p className="text-sm font-medium">{alert.decision || "Pending"}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-semibold uppercase mb-1">User Status</p>
          <p className="text-sm font-medium">{alert.userStatus || "No Change"}</p>
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

          {/* Threat Description / Payload Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-blue" /> Threat Description & Payload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-muted">
                    <span className="text-xs uppercase tracking-wider font-semibold">Alert Message</span>
                  </div>
                  <p className="font-medium text-primary">{alert.message}</p>
                </div>
                {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                  <div className="bg-primary/5 p-4 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 mb-2 text-muted">
                      <span className="text-xs uppercase tracking-wider font-semibold">Data Payload / Metadata</span>
                    </div>
                    <pre className="text-xs font-mono bg-surface p-3 rounded border border-border text-primary overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(alert.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-blue" /> Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alert.auditLogs && alert.auditLogs.length > 0 ? (
                <div className="space-y-4">
                  {alert.auditLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-4 items-start pb-4 border-b border-border/50 last:border-0 last:pb-0">
                      <div className="mt-1 bg-primary/10 p-2 rounded-full">
                        {log.eventType === "ALERT_LOCKED" ? <Lock className="h-4 w-4 text-yellow-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{log.eventType.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted mb-1">
                          By Admin {log.userId?.slice(0, 8)} on {new Date(log.createdAt).toLocaleString()}
                        </p>
                        {log.metadata?.decision && (
                          <div className="text-xs bg-primary/5 p-2 rounded-md mt-2">
                            <span className="font-semibold text-primary">Decision:</span> {log.metadata.decision} <br/>
                            {log.metadata.userStatus && <><span className="font-semibold text-primary">User Status Updated:</span> {log.metadata.userStatus} <br/></>}
                            {log.metadata.remarks && <><span className="font-semibold text-primary">Remarks:</span> {log.metadata.remarks}</>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No audit history available for this alert.</p>
              )}
            </CardContent>
          </Card>

          {/* User Details */}
          {alert.targetUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-accent-blue" /> User Database Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-24 w-24 rounded-full border-4 border-border overflow-hidden bg-surface flex items-center justify-center text-4xl">
                      {alert.targetUser.avatar ? (
                        <img src={alert.targetUser.avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        "👤"
                      )}
                    </div>
                  </div>
                  <div className="flex-grow space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted font-semibold uppercase mb-1">Email</p>
                        <p className="text-sm font-medium">{alert.targetUser.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted font-semibold uppercase mb-1">Role</p>
                        <Badge variant="secondary">{alert.targetUser.role}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted font-semibold uppercase mb-1">Status</p>
                        <Badge className={
                          alert.targetUser.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' :
                          alert.targetUser.status === 'INACTIVE' ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' :
                          'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                        }>{alert.targetUser.status}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted font-semibold uppercase mb-1">Last Login</p>
                        <p className="text-sm font-medium">
                          {alert.targetUser.lastLoginAt ? new Date(alert.targetUser.lastLoginAt).toLocaleString() : "Never"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted font-semibold uppercase mb-1">Bio / Notes</p>
                        <p className="text-sm text-muted">{alert.targetUser.bio || "No bio provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Hub - Right Column (1/3) */}
        <div className="space-y-6">
          {canAcknowledge && (
            <Card className="border-accent-blue/20 bg-accent-blue/5 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
              <CardHeader>
                <CardTitle className="text-lg">Response Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button 
                  variant="destructive" 
                  className="w-full justify-start gap-3 bg-red-600 hover:bg-red-700 shadow-md shadow-red-900/20"
                  onClick={() => handleActionClick("Blocked", "IP Address Blocked", "error")}
                >
                  <ShieldAlert className="h-4 w-4" /> Block Action
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-colors"
                  onClick={() => handleActionClick("User Suspended", "User Account Isolated", "info")}
                >
                  <AlertTriangle className="h-4 w-4" /> Isolate User Account
                </Button>
                
                <div className="h-px w-full bg-border my-2" />

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-muted block mb-1">Final Decision</label>
                    <input 
                      type="text" 
                      required
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted block mb-1">Set User Status (Optional)</label>
                    <select 
                      value={userStatus}
                      onChange={(e: any) => setUserStatus(e.target.value)}
                      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
                    >
                      <option value="">Leave Unchanged</option>
                      <option value="ACTIVE">Active (Safe)</option>
                      <option value="SUSPENDED">Suspended (Blocked)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted block mb-1">Remarks</label>
                    <textarea 
                      required
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue h-20 resize-none" 
                      placeholder="Add resolution details..."
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-accent-blue text-white hover:bg-accent-blue/90">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> 
                    {submitting ? "Processing..." : "Acknowledge & Close"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {!canAcknowledge && isLive && (
             <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardContent className="pt-6">
                   <div className="flex items-center gap-3 text-yellow-500 mb-2">
                      <Lock className="h-5 w-5" />
                      <h3 className="font-bold">Locked by Another Admin</h3>
                   </div>
                   <p className="text-sm text-muted">You cannot acknowledge or process this alert because it is currently locked by Admin {alert.lockedByAdminId}.</p>
                </CardContent>
             </Card>
          )}

          {alert.acknowledged && alert.remarks && (
            <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="pt-6">
                   <h3 className="font-bold text-green-500 mb-2 flex items-center gap-2">
                     <CheckCircle2 className="h-5 w-5" /> Final Remarks
                   </h3>
                   <p className="text-sm text-muted whitespace-pre-wrap">{alert.remarks}</p>
                </CardContent>
             </Card>
          )}
          
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
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted">Event Generated Time</span>
                <span className="font-medium text-primary">{alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "Unknown"}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted">Alert Created Time</span>
                <span className="font-medium text-primary">{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "Unknown"}</span>
              </div>
              {alert.lockedAt && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted">Locked Time</span>
                  <span className="font-medium text-primary">{new Date(alert.lockedAt).toLocaleString()}</span>
                </div>
              )}
              {alert.acknowledgedAt && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted">Acknowledged Time</span>
                  <span className="font-medium text-primary">{new Date(alert.acknowledgedAt).toLocaleString()}</span>
                </div>
              )}
              {alert.lastUpdatedAt && (
                <div className="flex justify-between">
                  <span className="text-muted">Last Updated Time</span>
                  <span className="font-medium text-primary">{new Date(alert.lastUpdatedAt).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
