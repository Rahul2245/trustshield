export type UserRole = "ADMIN" | "ANALYST" | "USER";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type AlertType = "RATE_LIMIT" | "AI_THREAT" | "BLOCK" | "SHADOW";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ThreatAction = "ALLOW" | "MONITOR" | "SHADOW" | "BLOCK";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  lastLoginAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  requestId?: string;
}

export interface DashboardStats {
  threats: {
    totalThreats: number;
    todayThreats: number;
    weekThreats: number;
    highRiskCount: number;
    averageRiskScore: number;
    actionBreakdown: Record<string, number>;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    admins: number;
  };
  unacknowledgedAlerts: number;
}

export interface TrendPoint {
  _id: string;
  count: number;
  avgRisk: number;
  blocked: number;
}

export interface ThreatAlert {
  alertId: string;
  eventId?: string;
  correlationId: string;
  type: AlertType;
  severity: AlertSeverity;
  userId?: string;
  email?: string;
  ipAddress?: string;
  riskScore?: number;
  action?: string;
  message: string;
  metadata?: Record<string, unknown>;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  locked?: boolean;
  lockedBy?: string;
  timestamp?: string;
  createdAt?: string;
}

export interface ThreatMatrix {
  event_id: string;
  correlation_id: string;
  user_id: string;
  tier1_nlp_score: number;
  tier2_if_score: number;
  final_fusion_score: number;
  shadow_queue_verdict: string;
  shadow_queue_confidence: number;
  action_taken: ThreatAction;
  processing_time_ms: number;
  model_versions: Record<string, string>;
  created_at: string;
}

export interface ThreatLog {
  input: {
    event_id: string;
    correlation_id: string;
    user_id: string;
    origin_ip: string;
    payload_text: string;
    burst_velocity: number;
    target_recipient_ratio: number;
    uri_hyperlink_density: number;
    session_dwell_duration: number;
  };
  prediction: {
    nlp: {
      spam_probability: number;
      safe_probability: number;
      predicted_label: string;
      risk_score: number;
    };
    isolation_forest: {
      is_anomaly: boolean;
      anomaly_score: number;
      risk_score: number;
      features: Record<string, number>;
    };
    fusion: {
      risk_score: number;
      confidence: number;
      decision: ThreatAction;
      risk_level: string;
      explanation: string;
    };
    shadow: {
      enabled: boolean;
      completed: boolean;
      is_malicious: boolean;
      confidence_score: number;
      reason: string;
    };
  };
  threat_matrix: ThreatMatrix;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
