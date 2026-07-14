import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, ChevronDown, ChevronRight, Download, CheckCircle2, Shield, Brain, Zap, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getActionColor, formatRiskScore, cn } from "@/lib/utils";
import { getThreats } from "@/services/api";
import { onThreatAlert } from "@/services/socket";
import type { ThreatLog } from "@/types";

export function ThreatsPage() {
  const [threats, setThreats] = useState<ThreatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const loadThreats = () => {
    setLoading(true);
    getThreats({
      page: 1,
      limit: 50,
      search: search || undefined,
      action: actionFilter || undefined,
    })
      .then((data) => setThreats(data.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadThreats();
  }, [search, actionFilter]);

  // 🔴 REAL-TIME: Listen for new threat events via Socket.IO and refresh the list
  useEffect(() => {
    const unsubscribe = onThreatAlert(() => {
      getThreats({
        page: 1,
        limit: 50,
        search: search || undefined,
        action: actionFilter || undefined,
      })
        .then((data) => setThreats(data.items))
        .catch(() => {});
    });
    return () => unsubscribe();
  }, [search, actionFilter]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedRows(next);
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRows(next);
  };

  const selectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(threats.map(t => t.threat_matrix.event_id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const getStatusBadge = (action: string) => {
    switch (action) {
      case "BLOCK":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">Blocked</Badge>;
      case "SHADOW":
        return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Shadow Queue</Badge>;
      case "MONITOR":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Investigating</Badge>;
      case "ALLOW":
      default:
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Allowed</Badge>;
    }
  };

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Unified Threat Matrix</h1>
          <p className="mt-1 text-muted">
            Deep-dive logs from the AI computational engine.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadThreats} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Interactive Filters */}
      <div className="flex flex-col gap-3 md:flex-row bg-surface p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search by event ID, correlation ID, user, or IP..."
            className="pl-10 bg-primary/5 border-border text-primary focus-visible:ring-accent-blue"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-xl border border-border bg-primary/5 px-4 text-sm text-primary outline-none focus:ring-2 focus:ring-accent-blue hover:bg-primary/10 transition-colors cursor-pointer"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All Threat Types</option>
          <option value="ALLOW">Safe / Allowed</option>
          <option value="MONITOR">Rate Limit / Investigating</option>
          <option value="SHADOW">Injection / Shadow</option>
          <option value="BLOCK">Malicious / Blocked</option>
        </select>
        
        <button className="h-10 flex items-center gap-2 rounded-xl border border-border bg-primary/5 px-4 text-sm text-primary outline-none focus:ring-2 focus:ring-accent-blue hover:bg-primary/10 transition-colors">
          <Calendar className="h-4 w-4 text-muted" />
          <span>Last 24 Hours</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : threats.length === 0 ? (
        <Card className="border-dashed border-border bg-transparent">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/5 p-4 mb-4">
              <Shield className="h-8 w-8 text-muted opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-primary mb-1">No Threats Found</h3>
            <p className="text-sm text-muted max-w-sm">
              Adjust your filters or try a different search term.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-primary/5 border-b border-border">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-600 bg-transparent text-accent-blue focus:ring-accent-blue focus:ring-offset-0"
                    onChange={selectAll}
                    checked={selectedRows.size === threats.length && threats.length > 0}
                  />
                </th>
                <th className="w-10"></th>
                <th className="px-4 py-4 text-left font-semibold text-muted uppercase tracking-wider text-xs">Timestamp</th>
                <th className="px-4 py-4 text-left font-semibold text-muted uppercase tracking-wider text-xs">Target</th>
                <th className="px-4 py-4 text-left font-semibold text-muted uppercase tracking-wider text-xs">Classification</th>
                <th className="px-4 py-4 text-left font-semibold text-muted uppercase tracking-wider text-xs">Risk Score</th>
                <th className="px-4 py-4 text-left font-semibold text-muted uppercase tracking-wider text-xs">Status</th>
                <th className="px-4 py-4 text-right font-semibold text-muted uppercase tracking-wider text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {threats.map((threat) => {
                const id = threat.threat_matrix.event_id;
                const isExpanded = expandedRows.has(id);
                const isSelected = selectedRows.has(id);
                
                return (
                  <React.Fragment key={id}>
                    <tr
                      onClick={() => toggleExpand(id)}
                      className={cn(
                        "hover:bg-primary/5 transition-colors cursor-pointer",
                        isSelected ? "bg-accent-blue/5 hover:bg-accent-blue/10" : "",
                        isExpanded ? "bg-primary/5" : ""
                      )}
                    >
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => toggleSelect(id, e as any)}
                          className="rounded border-gray-600 bg-transparent text-accent-blue focus:ring-accent-blue focus:ring-offset-0"
                        />
                      </td>
                      <td className="px-2 text-center text-muted">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="px-4 py-4 text-xs text-muted whitespace-nowrap">
                        {new Date(threat.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-primary text-xs">{threat.threat_matrix.user_id.slice(0, 16)}</span>
                          <span className="text-muted text-[10px] font-mono mt-0.5">{threat.input.origin_ip}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-primary flex items-center gap-1">
                               <Brain className="h-3 w-3 text-accent-pink" />
                               {threat.prediction.nlp.predicted_label}
                            </span>
                            {threat.prediction.isolation_forest.is_anomaly && (
                               <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm w-max border border-red-500/20">Anomaly</span>
                            )}
                         </div>
                      </td>
                      <td className="px-4 py-4">
                         <div className="flex items-center gap-2">
                           <span className={cn(
                              "font-bold text-sm",
                              threat.threat_matrix.final_fusion_score > 70 ? "text-red-500" :
                              threat.threat_matrix.final_fusion_score > 40 ? "text-yellow-500" : "text-green-500"
                           )}>
                             {formatRiskScore(threat.threat_matrix.final_fusion_score)}
                           </span>
                           <span className="text-[10px] text-muted">/ 100</span>
                         </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(threat.threat_matrix.action_taken)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 text-accent-blue h-8" onClick={(e) => e.stopPropagation()}>
                          <Link to={`/threats/${id}`}>Deep Dive</Link>
                        </Button>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Content */}
                    {isExpanded && (
                      <tr className="bg-primary/[0.02] border-b-2 border-b-border">
                        <td colSpan={8} className="p-0">
                          <div className="p-6 grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-200">
                             
                             {/* Quick Glance Payload */}
                             <div className="space-y-3">
                                <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                                  Raw Payload Fragment
                                </h4>
                                <div className="bg-[#0c0c0c] rounded-xl p-4 border border-border shadow-inner font-mono text-xs overflow-x-auto text-green-400">
                                   "{threat.input.payload_text}"
                                </div>
                             </div>

                             {/* AI Confidence Breakdown */}
                             <div className="space-y-3">
                                <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                                  <Zap className="h-3 w-3 text-accent-blue" /> Engine Confidence
                                </h4>
                                <div className="bg-surface rounded-xl p-4 border border-border grid grid-cols-2 gap-4">
                                   <div>
                                      <p className="text-[10px] text-muted uppercase">NLP Confidence</p>
                                      <p className="text-lg font-bold text-primary">{((threat.prediction.nlp.confidence_score || 0) * 100).toFixed(1)}%</p>
                                   </div>
                                   <div>
                                      <p className="text-[10px] text-muted uppercase">Shadow Queue</p>
                                      <p className="text-lg font-bold text-primary">
                                        {threat.prediction.shadow.enabled 
                                          ? `${(threat.prediction.shadow.confidence_score * 100).toFixed(1)}%`
                                          : 'N/A'
                                        }
                                      </p>
                                   </div>
                                   <div className="col-span-2 text-xs text-muted">
                                      <span className="font-medium text-primary">Reasoning:</span> {threat.prediction.fusion.explanation}
                                   </div>
                                </div>
                             </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Actions Floating Bar */}
      {selectedRows.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-surface/90 backdrop-blur-md border border-border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6">
             <span className="text-sm font-semibold text-primary border-r border-border pr-6">
               <span className="text-accent-blue font-bold">{selectedRows.size}</span> rows selected
             </span>
             <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-2 border-border hover:bg-primary/5 hover:text-primary">
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button size="sm" className="gap-2 bg-accent-green hover:bg-accent-green/90 text-slate-900 font-bold">
                  <CheckCircle2 className="h-4 w-4" /> Mark Resolved
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
