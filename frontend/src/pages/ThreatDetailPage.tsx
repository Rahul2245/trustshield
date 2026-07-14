import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, Brain, Shield, Zap, Activity, AlertTriangle, 
  CheckCircle, Fingerprint, Clock, Server, FileText, 
  BarChart, Info, Network, Hash, Cpu, Database
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      <div className="space-y-6 animate-pulse">
        <div className="flex gap-4 items-center">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!threat) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-500">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-primary">Threat Not Found</h2>
        <p className="mt-2 text-muted max-w-md">We couldn't locate the threat record you are looking for. It may have been removed or the ID is incorrect.</p>
        <Link to="/threats" className="mt-8 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          Return to Threats
        </Link>
      </div>
    );
  }

  const { threat_matrix: matrix, prediction, input, created_at } = threat;
  
  // Safe fallbacks for potentially missing data from heuristic fallbacks
  const features = prediction.isolation_forest?.features || {};
  const fusionConfidence = prediction.fusion?.confidence ?? 1;
  const fusionRiskLevel = prediction.fusion?.risk_level || (matrix.final_fusion_score > 80 ? 'CRITICAL' : matrix.final_fusion_score > 50 ? 'HIGH' : 'LOW');
  
  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 50) return "text-amber-500";
    return "text-emerald-500";
  };

  const getRiskBg = (score: number) => {
    if (score >= 80) return "bg-red-500/10 border-red-500/20";
    if (score >= 50) return "bg-amber-500/10 border-amber-500/20";
    return "bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-start gap-4">
          <Link
            to="/threats"
            className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full border border-border bg-surface hover:bg-primary/5 text-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary tracking-tight">Threat Intelligence Report</h1>
              <Badge className={`px-3 py-1 text-xs uppercase tracking-wider font-semibold ${getActionColor(matrix.action_taken)}`}>
                {matrix.action_taken}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
              <div className="flex items-center gap-1.5 font-mono bg-primary/5 px-2 py-0.5 rounded text-xs">
                <Hash className="h-3 w-3" />
                {matrix.event_id}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {new Date(created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Fusion Score */}
        <Card className={`overflow-hidden border shadow-sm transition-all hover:shadow-md ${getRiskBg(matrix.final_fusion_score)}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-primary/90">
              <div className="flex items-center gap-2">
                <Zap className={`h-5 w-5 ${getRiskColor(matrix.final_fusion_score)}`} />
                Unified Fusion Score
              </div>
              <Badge variant="outline" className="bg-surface/60 backdrop-blur-sm">Tier 3</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-black tracking-tighter ${getRiskColor(matrix.final_fusion_score)}`}>
                {formatRiskScore(matrix.final_fusion_score)}
              </span>
              <span className="text-sm font-medium text-muted">/ 100</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-medium text-primary/90 flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> Risk Level: <span className="uppercase">{fusionRiskLevel}</span>
              </span>
              <span className="text-muted">Conf: {(fusionConfidence * 100).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* NLP Score */}
        <Card className="overflow-hidden border shadow-sm transition-all hover:shadow-md bg-surface">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-primary/90">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-500" />
                NLP Analysis
              </div>
              <Badge variant="outline">Tier 1</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-primary">
                {formatRiskScore(matrix.tier1_nlp_score)}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Predicted Label:</span>
                <Badge variant="secondary" className="font-medium bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/200/10">{prediction.nlp?.predicted_label || 'Unknown'}</Badge>
              </div>
              {(prediction.nlp?.spam_probability !== undefined) && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500/100 rounded-full" style={{ width: `${(prediction.nlp.spam_probability || 0) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* IF Score */}
        <Card className="overflow-hidden border shadow-sm transition-all hover:shadow-md bg-surface">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-primary/90">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                Structural Anomaly
              </div>
              <Badge variant="outline">Tier 2</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-primary">
                {formatRiskScore(matrix.tier2_if_score)}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Anomaly Detected:</span>
                {prediction.isolation_forest?.is_anomaly ? (
                  <Badge variant="destructive" className="flex gap-1"><AlertTriangle className="h-3 w-3" /> Yes</Badge>
                ) : (
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30 flex gap-1"><CheckCircle className="h-3 w-3" /> No</Badge>
                )}
              </div>
              {(prediction.isolation_forest?.anomaly_score !== undefined) && (
                <div className="text-xs text-muted/80 text-right font-mono">
                  Score: {prediction.isolation_forest.anomaly_score.toFixed(4)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Context & Identity */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="shadow-sm">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-muted" />
                Identity & Origin
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted/80 uppercase tracking-wider">User ID</span>
                  <span className="text-sm font-mono text-primary break-all">{matrix.user_id}</span>
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted/80 uppercase tracking-wider">Origin IP</span>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted/80" />
                    <span className="text-sm font-mono text-primary">{input.origin_ip || 'Unknown'}</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted/80 uppercase tracking-wider">Correlation ID</span>
                  <span className="text-xs font-mono text-muted break-all">{matrix.correlation_id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted" />
                System Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Processing Time</span>
                <span className="text-sm font-mono font-medium">{matrix.processing_time_ms}ms</span>
              </div>
              
              {matrix.model_versions && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-primary block">Model Versions</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(matrix.model_versions).map(([key, version]) => (
                      <Badge key={key} variant="secondary" className="text-xs bg-primary/10 text-muted hover:bg-gray-200">
                        {key}: {String(version)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle & Right Column: Content, Reasoning, & Features */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Payload Content */}
          <Card className="shadow-sm border-border overflow-hidden">
            <CardHeader className="bg-primary/5 border-b pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted" />
                Evaluated Payload
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[200px] w-full bg-slate-950 p-4 overflow-auto">
                <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                  {input.payload_text || <span className="italic text-slate-400">No payload text provided</span>}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* AI Reasoning */}
          <Card className="shadow-sm border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/100"></div>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-indigo-400">
                <Info className="h-5 w-5 text-indigo-500" />
                AI Decision Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary/90 leading-relaxed text-sm">
                {prediction.fusion?.explanation || "No explanation provided by the engine."}
              </p>
              
              {/* Shadow Queue Context */}
              {prediction.shadow?.enabled && (
                <div className="mt-6 p-4 bg-indigo-500/10/50 border border-indigo-500/20 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-indigo-400 flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Shadow Engine Review (Llama 3)
                    </h4>
                    <div className="flex gap-2 items-center">
                       <Badge variant={prediction.shadow.is_malicious ? "destructive" : "secondary"} className={!prediction.shadow.is_malicious ? "bg-emerald-100 text-emerald-800" : ""}>
                         {prediction.shadow.is_malicious ? "Malicious" : "Safe"}
                       </Badge>
                       <span className="text-xs text-indigo-400 font-mono">Conf: {(prediction.shadow.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-indigo-200/80 italic border-l-2 border-indigo-200 pl-3">
                    "{prediction.shadow.reason || "No detailed reasoning provided."}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Behavioral Features */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart className="h-4 w-4 text-muted" />
                Extracted Behavioral Features
              </CardTitle>
              <CardDescription>Metrics used by the Isolation Forest model</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {Object.keys(features).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(features).map(([key, value]) => (
                    <div key={key} className="bg-primary/5 rounded-lg p-3 border border-border">
                      <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1 truncate" title={key}>
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-lg font-mono font-medium text-primary">
                        {Number(value).toFixed(3)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted/80">
                  <Database className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No behavioral features extracted</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
