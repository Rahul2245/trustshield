import { v4 as uuidv4 } from "uuid";

import { broadcastThreatAlert, ThreatAlertPayload } from "../../../infrastructure/websocket/socket";
import { AdminRepository } from "../repositories/admin.repository";
import { IAdminAlert } from "../models/admin-alert.model";
import { SecurityEventLogModel } from "../models/security-event-log.model";

import { PostModel } from "../../posts/models/post.model";

export interface WebhookPayload {
    event_id: string;
    event_type?: string;
    correlation_id: string;
    user_id: string;
    risk_score: number;
    action: "ALLOW" | "MONITOR" | "SHADOW" | "BLOCK";
    timestamp: string;
    // Full security_event_log document from the AI worker for guaranteed fallback.
    threat_document?: Record<string, unknown>;
}

export class AdminService {
    private adminRepository: AdminRepository;

    constructor() {
        this.adminRepository = new AdminRepository();
    }

    public async createUserReport(postId: string, reporterId: string, reason: string, postAuthorId: string) {
        const alertData: Partial<IAdminAlert> = {
            alertId: `REP-${uuidv4().slice(0, 8).toUpperCase()}`,
            eventId: postId,
            correlationId: uuidv4(),
            type: "USER_REPORT",
            severity: "MEDIUM",
            userId: postAuthorId,
            message: `User report: ${reason}`,
            metadata: { reporterId, reason },
        };
        const alert = await this.adminRepository.createAlert(alertData);
        
        const payload: ThreatAlertPayload = {
            alertId: alert.alertId,
            correlationId: alert.correlationId,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            timestamp: new Date().toISOString(),
        };
        broadcastThreatAlert(payload);
        return alert;
    }

    public async processAiWebhook(payload: WebhookPayload) {
        const severity = this.resolveSeverity(payload.risk_score, payload.action);
        const alertType = this.resolveAlertType(payload.action);

        // Update Post or Comment based on event_type — wrapped in try/catch so
        // an invalid event_id (or missing document) never crashes the webhook
        // before the threat log fallback and alert creation run.
        try {
            if (payload.event_type === "new_post" || payload.event_type === "NEW_POST") {
                const status = payload.action === "ALLOW" ? "APPROVED" : (payload.action === "BLOCK" ? "REJECTED" : "PENDING");
                await PostModel.findByIdAndUpdate(payload.event_id, {
                    status,
                    isFlagged: payload.action !== "ALLOW",
                    threatScore: payload.risk_score,
                    aiVerdict: payload.action === "BLOCK" || payload.action === "SHADOW",
                });
            } else if (payload.event_type === "new_comment" || payload.event_type === "NEW_COMMENT") {
                const { CommentModel } = require("../../comments/models/comment.model");
                const status = payload.action === "ALLOW" ? "APPROVED" : (payload.action === "BLOCK" ? "REJECTED" : "PENDING");
                await CommentModel.findByIdAndUpdate(payload.event_id, {
                    status,
                    isFlagged: payload.action !== "ALLOW",
                    threatScore: payload.risk_score,
                    aiVerdict: payload.action === "BLOCK" || payload.action === "SHADOW",
                });
            }
        } catch (updateErr) {
            // Non-fatal: log and continue — the threat log and alert must still be created
            console.warn("[Gateway] Post/Comment status update skipped:", (updateErr as Error).message);
        }

        // ── Gateway-side fallback: write threat document to security_event_logs
        // if the AI worker sent it (covers the case where AI worker's own
        // MongoDB write failed silently, e.g. Atlas connection dropped).
        if (payload.threat_document) {
            try {
                const exists = await SecurityEventLogModel.exists({
                    "threat_matrix.event_id": payload.event_id,
                });
                if (!exists) {
                    const doc = {
                        ...payload.threat_document,
                        // Ensure created_at is a proper Date for index queries
                        created_at: new Date(
                            (payload.threat_document.created_at as string) ?? payload.timestamp
                        ),
                    };
                    await SecurityEventLogModel.create(doc);
                }
            } catch (persistErr) {
                // Non-fatal: log but don't block alert creation
                console.error("[Gateway] Fallback threat log persistence failed:", persistErr);
            }
        } else {
            // Local heuristic fallback triggers webhook without threat_document
            try {
                const exists = await SecurityEventLogModel.exists({
                    "threat_matrix.event_id": payload.event_id,
                });
                if (!exists) {
                    const doc = {
                        input: {
                            event_id: payload.event_id,
                            event_type: payload.event_type,
                            correlation_id: payload.correlation_id,
                            user_id: payload.user_id,
                            origin_ip: "unknown",
                            payload_text: "Local heuristic fallback",
                        },
                        prediction: {
                            nlp: { risk_score: payload.risk_score, confidence_score: 1.0, predicted_label: "heuristic" },
                            isolation_forest: { is_anomaly: false, risk_score: payload.risk_score },
                            fusion: { risk_score: payload.risk_score, decision: payload.action, explanation: "Local heuristic fallback" },
                            shadow: { enabled: false, is_malicious: false, confidence_score: 0.0 }
                        },
                        threat_matrix: {
                            event_id: payload.event_id,
                            correlation_id: payload.correlation_id,
                            user_id: payload.user_id,
                            tier1_nlp_score: payload.risk_score,
                            tier2_if_score: payload.risk_score,
                            final_fusion_score: payload.risk_score,
                            shadow_queue_verdict: "False",
                            shadow_queue_confidence: 0.0,
                            action_taken: payload.action,
                            processing_time_ms: 0,
                            model_versions: { fallback: "1.0" }
                        },
                        created_at: new Date(payload.timestamp),
                    };
                    await SecurityEventLogModel.create(doc);
                }
            } catch (persistErr) {
                console.error("[Gateway] Heuristic fallback threat log persistence failed:", persistErr);
            }
        }

        const alert = await this.adminRepository.createAlert({
            alertId: uuidv4(),
            eventId: payload.event_id,
            correlationId: payload.correlation_id,
            type: alertType,
            severity,
            userId: payload.user_id,
            riskScore: payload.risk_score,
            action: payload.action,
            message: `AI evaluation complete: ${payload.action} (risk ${payload.risk_score.toFixed(1)})`,
            metadata: { source: "ai-worker", event_type: payload.event_type },
        });

        this.broadcastAlert(alert);
        return alert;
    }

    public async createRateLimitAlert(params: {
        ipAddress: string;
        email?: string;
        correlationId: string;
    }) {
        const alert = await this.adminRepository.createAlert({
            alertId: uuidv4(),
            correlationId: params.correlationId,
            type: "RATE_LIMIT",
            severity: "HIGH",
            email: params.email,
            ipAddress: params.ipAddress,
            message: `Rate limit exceeded for IP ${params.ipAddress}`,
            metadata: { source: "rate-limiter" },
        });

        this.broadcastAlert(alert);
        return alert;
    }

    public getThreats(query: Parameters<AdminRepository["findThreats"]>[0]) {
        return this.adminRepository.findThreats(query);
    }

    public getThreatByEventId(eventId: string) {
        return this.adminRepository.findThreatByEventId(eventId);
    }

    public getStats() {
        return this.adminRepository.getThreatStats();
    }

    public getTrend(days: number) {
        return this.adminRepository.getDailyThreatTrend(days);
    }

    public getAlerts(page: number, limit: number, acknowledged?: boolean) {
        return this.adminRepository.findAlerts(page, limit, acknowledged);
    }

    public getAlertById(alertId: string) {
        return this.adminRepository.findAlertById(alertId);
    }

    public async acknowledgeAlert(
        alertId: string, 
        userId: string, 
        payload: { decision: string, resolution: string, userStatus?: string, remarks: string }
    ) {
        const { AuditLogModel } = require("../../audit/models/audit-log.model");
        const { UserModel } = require("../../users/models/user.model");

        const alert = await this.adminRepository.acknowledgeAlert(alertId, userId, payload);
        
        if (alert) {
            if (payload.userStatus && alert.userId) {
                const updateQuery: any = { status: payload.userStatus };
                if (payload.userStatus === "ACTIVE") {
                    updateQuery.isUnderInvestigation = false;
                }
                await UserModel.findByIdAndUpdate(alert.userId, updateQuery);
            }
            
            // Auto-approve the associated post/comment if user is set to ACTIVE or decision indicates safe
            const isSafeDecision = payload.decision && /safe|false positive|handled|approve|ignore/i.test(payload.decision);
            if (payload.userStatus === "ACTIVE" || isSafeDecision) {
                const { PostModel } = require("../../posts/models/post.model");
                const { CommentModel } = require("../../comments/models/comment.model");
                
                await PostModel.findByIdAndUpdate(alert.eventId, { status: 'APPROVED', isFlagged: false });
                await CommentModel.findByIdAndUpdate(alert.eventId, { status: 'APPROVED', isFlagged: false });
            }
            
            await AuditLogModel.create({
                eventType: "ALERT_ACKNOWLEDGED",
                severity: "INFO",
                userId,
                metadata: {
                    alertId,
                    decision: payload.decision,
                    resolution: payload.resolution,
                    userStatus: payload.userStatus,
                    remarks: payload.remarks
                }
            });
            
            const { broadcastThreatAlert } = require("../../../infrastructure/websocket/socket");
            broadcastThreatAlert({
                alertId,
                type: 'ACKNOWLEDGE',
                userId,
                message: `Alert acknowledged by admin ${userId}`,
            } as any);
        }

        return alert;
    }

    public getUnacknowledgedCount() {
        return this.adminRepository.getUnacknowledgedAlertCount();
    }

    public async lockAlert(alertId: string, adminId: string) {
        const { AuditLogModel } = require("../../audit/models/audit-log.model");
        const lockedAlert = await this.adminRepository.lockAlert(alertId, adminId);
        
        if (lockedAlert) {
            await AuditLogModel.create({
                eventType: "ALERT_LOCKED",
                severity: "INFO",
                userId: adminId,
                metadata: { alertId }
            });

            const { broadcastThreatAlert } = require("../../../infrastructure/websocket/socket");
            broadcastThreatAlert({
                alertId,
                type: 'LOCK',
                userId: adminId,
                message: `Alert locked by admin ${adminId}`,
            } as any);
            return true;
        }
        return false;
    }

    public getUsers(page: number, limit: number, status?: string) {
        return this.adminRepository.findAllUsers(page, limit, status);
    }

    public updateUserStatus(userId: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED") {
        return this.adminRepository.updateUserStatus(userId, status);
    }

    public getUserStats() {
        return this.adminRepository.getUserStats();
    }

    private resolveSeverity(
        riskScore: number,
        action: string
    ): IAdminAlert["severity"] {
        if (action === "BLOCK" || riskScore >= 80) return "CRITICAL";
        if (action === "SHADOW" || riskScore >= 50) return "HIGH";
        if (action === "MONITOR") return "MEDIUM";
        return "LOW";
    }

    private resolveAlertType(action: string): IAdminAlert["type"] {
        if (action === "BLOCK") return "BLOCK";
        if (action === "SHADOW") return "SHADOW";
        return "AI_THREAT";
    }

    private broadcastAlert(alert: IAdminAlert): void {
        const payload: ThreatAlertPayload = {
            alertId: alert.alertId,
            eventId: alert.eventId,
            correlationId: alert.correlationId,
            type: alert.type,
            severity: alert.severity,
            userId: alert.userId,
            email: alert.email,
            ipAddress: alert.ipAddress,
            riskScore: alert.riskScore,
            action: alert.action,
            message: alert.message,
            metadata: alert.metadata,
            timestamp: alert.createdAt.toISOString(),
        };

        broadcastThreatAlert(payload);
    }
}
