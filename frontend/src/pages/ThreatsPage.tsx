import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getActionColor, formatRiskScore } from "@/lib/utils";
import { getThreats } from "@/services/api";
import type { ThreatLog } from "@/types";

export function ThreatsPage() {
  const [threats, setThreats] = useState<ThreatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    getThreats({
      page: 1,
      limit: 50,
      search: search || undefined,
      action: actionFilter || undefined,
    })
      .then((data) => setThreats(data.items))
      .finally(() => setLoading(false));
  }, [search, actionFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Threat Matrix Logs</h1>
        <p className="mt-1 text-muted">
          Unified threat evaluations from the AI computational engine
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search by event ID, correlation ID, user, or IP..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm text-primary outline-none focus:ring-2 focus:ring-accent-green/50 hover:bg-primary/5 transition-colors cursor-pointer"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          <option value="ALLOW">Allow</option>
          <option value="MONITOR">Monitor</option>
          <option value="SHADOW">Shadow</option>
          <option value="BLOCK">Block</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : threats.length === 0 ? (
        <Card className="border-dashed border-border bg-transparent">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/5 p-4 mb-4">
              <Search className="h-8 w-8 text-muted opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-primary mb-1">No Threat Logs Found</h3>
            <p className="text-sm text-muted max-w-sm">
              Events will appear here after login attempts are processed by the AI computational engine.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-[28px] border border-border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-primary/5 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-primary">Event</th>
                <th className="px-6 py-4 text-left font-semibold text-primary">User / IP</th>
                <th className="px-6 py-4 text-left font-semibold text-primary">NLP</th>
                <th className="px-6 py-4 text-left font-semibold text-primary">IF Score</th>
                <th className="px-6 py-4 text-left font-semibold text-primary">Fusion</th>
                <th className="px-6 py-4 text-left font-semibold text-primary">Action</th>
                <th className="px-6 py-4 text-left font-semibold text-primary">Time</th>
              </tr>
            </thead>
            <tbody>
              {threats.map((threat) => (
                <tr
                  key={threat.threat_matrix.event_id}
                  className="border-t border-border hover:bg-primary/10 even:bg-primary/5 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/threats/${threat.threat_matrix.event_id}`}
                      className="font-mono text-xs text-accent-blue hover:underline hover:text-accent-blue/80 transition-colors"
                    >
                      {threat.threat_matrix.event_id.slice(0, 12)}...
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-primary">
                    <div className="text-xs">
                      <p className="font-medium">{threat.threat_matrix.user_id.slice(0, 12)}...</p>
                      <p className="text-muted mt-0.5">{threat.input.origin_ip}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-primary font-medium">
                    {formatRiskScore(threat.threat_matrix.tier1_nlp_score)}
                  </td>
                  <td className="px-6 py-4 text-primary font-medium">
                    {formatRiskScore(threat.threat_matrix.tier2_if_score)}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">
                    {formatRiskScore(threat.threat_matrix.final_fusion_score)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getActionColor(threat.threat_matrix.action_taken)}>
                      {threat.threat_matrix.action_taken}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">
                    {new Date(threat.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
