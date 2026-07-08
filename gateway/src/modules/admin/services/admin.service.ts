import { v4 as uuidv4 } from "uuid";

import { broadcastThreatAlert, ThreatAlertPayload } from "../../../infrastructure/websocket/socket";
import { AdminRepository } from "../repositories/admin.repository";
import { IAdminAlert } from "../models/admin-alert.model";

export interface WebhookPayload {
    event_id: string;
    correlation_id: string;
    user_id: string;
    risk_score: number;
    action: "ALLOW" | "MONITOR" | "SHADOW" | "BLOCK";
    timestamp: string;
}

export class AdminService {
    private adminRepository: AdminRepository;

    constructor() {
        this.adminRepository = new AdminRepository();
    }

    public async processAiWebhook(payload: WebhookPayload) {
        const severity = this.resolveSeverity(payload.risk_score, payload.action);
        const alertType = this.resolveAlertType(payload.action);

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
            metadata: { source: "ai-worker" },
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

    public acknowledgeAlert(alertId: string, userId: string) {
        return this.adminRepository.acknowledgeAlert(alertId, userId);
    }

    public getUnacknowledgedCount() {
        return this.adminRepository.getUnacknowledgedAlertCount();
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
