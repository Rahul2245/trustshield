import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Brain, Shield, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getActionColor, formatRiskScore } from "@/lib/utils";
import { getThreatById } from "@/services/api";
import type { ThreatLog } from "@/types";

export function ThreatDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [threat, setThreat] = useState<ThreatLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    getThreatById(eventId)
      .then(setThreat)
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!threat) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Threat not found</p>
        <Link to="/threats" className="mt-4 text-accent-blue hover:underline">
          Back to threats
        </Link>
      </div>
    );
  }

  const { threat_matrix: matrix, prediction, input } = threat;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/threats"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">Threat Analysis</h1>
          <p className="font-mono text-sm text-muted">{matrix.event_id}</p>
        </div>
        <Badge className={`ml-auto ${getActionColor(matrix.action_taken)}`}>
          {matrix.action_taken}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-accent-blue" />
              Fusion Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              {formatRiskScore(matrix.final_fusion_score)}
            </p>
            <p className="mt-2 text-sm text-muted">
              Confidence: {(prediction.fusion.confidence * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-accent-pink" />
              Tier 1 — NLP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{formatRiskScore(matrix.tier1_nlp_score)}</p>
            <p className="mt-2 text-sm text-muted">
              Label: {prediction.nlp.predicted_label}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-accent-green" />
              Tier 2 — Isolation Forest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{formatRiskScore(matrix.tier2_if_score)}</p>
            <p className="mt-2 text-sm text-muted">
              Anomaly: {prediction.isolation_forest.is_anomaly ? "Yes" : "No"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Decision Explanation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{prediction.fusion.explanation}</p>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-medium">Risk Level: {prediction.fusion.risk_level}</p>
              <p className="mt-1 text-muted">
                Processing time: {matrix.processing_time_ms}ms
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shadow Queue (Llama 3)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {prediction.shadow.enabled ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={prediction.shadow.is_malicious ? "destructive" : "success"}>
                    {prediction.shadow.is_malicious ? "Malicious" : "Safe"}
                  </Badge>
                  <span className="text-muted">
                    Confidence: {(prediction.shadow.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p>{prediction.shadow.reason || "No additional reasoning provided."}</p>
              </>
            ) : (
              <p className="text-muted">{prediction.shadow.reason}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <p className="text-muted">Correlation ID</p>
              <p className="font-mono">{matrix.correlation_id}</p>
            </div>
            <div>
              <p className="text-muted">User ID</p>
              <p className="font-mono">{matrix.user_id}</p>
            </div>
            <div>
              <p className="text-muted">Origin IP</p>
              <p>{input.origin_ip}</p>
            </div>
            <div>
              <p className="text-muted">Payload</p>
              <p className="rounded-xl bg-gray-50 p-3">{input.payload_text}</p>
            </div>
          </div>

          <h4 className="mt-6 mb-3 font-medium">Behavioral Features</h4>
          <div className="grid gap-2 md:grid-cols-2">
            {Object.entries(prediction.isolation_forest.features).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between rounded-xl bg-gray-50 px-4 py-2 text-sm"
              >
                <span className="text-muted">{key}</span>
                <span className="font-medium">{value.toFixed(4)}</span>
              </div>
            ))}
          </div>

          <h4 className="mt-6 mb-3 font-medium">Model Versions</h4>
          <div className="flex gap-2">
            {Object.entries(matrix.model_versions).map(([key, version]) => (
              <Badge key={key} variant="outline">
                {key}: {version}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
