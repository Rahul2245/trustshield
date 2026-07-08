"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const uuid_1 = require("uuid");
const socket_1 = require("../../../infrastructure/websocket/socket");
const admin_repository_1 = require("../repositories/admin.repository");
class AdminService {
    adminRepository;
    constructor() {
        this.adminRepository = new admin_repository_1.AdminRepository();
    }
    async processAiWebhook(payload) {
        const severity = this.resolveSeverity(payload.risk_score, payload.action);
        const alertType = this.resolveAlertType(payload.action);
        const alert = await this.adminRepository.createAlert({
            alertId: (0, uuid_1.v4)(),
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
    async createRateLimitAlert(params) {
        const alert = await this.adminRepository.createAlert({
            alertId: (0, uuid_1.v4)(),
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
    getThreats(query) {
        return this.adminRepository.findThreats(query);
    }
    getThreatByEventId(eventId) {
        return this.adminRepository.findThreatByEventId(eventId);
    }
    getStats() {
        return this.adminRepository.getThreatStats();
    }
    getTrend(days) {
        return this.adminRepository.getDailyThreatTrend(days);
    }
    getAlerts(page, limit, acknowledged) {
        return this.adminRepository.findAlerts(page, limit, acknowledged);
    }
    acknowledgeAlert(alertId, userId) {
        return this.adminRepository.acknowledgeAlert(alertId, userId);
    }
    getUnacknowledgedCount() {
        return this.adminRepository.getUnacknowledgedAlertCount();
    }
    getUsers(page, limit, status) {
        return this.adminRepository.findAllUsers(page, limit, status);
    }
    updateUserStatus(userId, status) {
        return this.adminRepository.updateUserStatus(userId, status);
    }
    getUserStats() {
        return this.adminRepository.getUserStats();
    }
    resolveSeverity(riskScore, action) {
        if (action === "BLOCK" || riskScore >= 80)
            return "CRITICAL";
        if (action === "SHADOW" || riskScore >= 50)
            return "HIGH";
        if (action === "MONITOR")
            return "MEDIUM";
        return "LOW";
    }
    resolveAlertType(action) {
        if (action === "BLOCK")
            return "BLOCK";
        if (action === "SHADOW")
            return "SHADOW";
        return "AI_THREAT";
    }
    broadcastAlert(alert) {
        const payload = {
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
        (0, socket_1.broadcastThreatAlert)(payload);
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map