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
          className="h-11 rounded-2xl border border-border bg-white px-4 text-sm"
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
        <Card>
          <CardContent className="py-12 text-center text-muted">
            No threat logs found. Events appear after login attempts are
            processed by the AI worker.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">Event</th>
                <th className="px-4 py-3 text-left font-medium text-muted">User / IP</th>
                <th className="px-4 py-3 text-left font-medium text-muted">NLP</th>
                <th className="px-4 py-3 text-left font-medium text-muted">IF Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Fusion</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Time</th>
              </tr>
            </thead>
            <tbody>
              {threats.map((threat) => (
                <tr
                  key={threat.threat_matrix.event_id}
                  className="border-t border-border hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/threats/${threat.threat_matrix.event_id}`}
                      className="font-mono text-xs text-accent-blue hover:underline"
                    >
                      {threat.threat_matrix.event_id.slice(0, 12)}...
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <p>{threat.threat_matrix.user_id.slice(0, 12)}...</p>
                      <p className="text-muted">{threat.input.origin_ip}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatRiskScore(threat.threat_matrix.tier1_nlp_score)}
                  </td>
                  <td className="px-4 py-3">
                    {formatRiskScore(threat.threat_matrix.tier2_if_score)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatRiskScore(threat.threat_matrix.final_fusion_score)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getActionColor(threat.threat_matrix.action_taken)}>
                      {threat.threat_matrix.action_taken}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
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
