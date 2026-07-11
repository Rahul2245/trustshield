"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const uuid_1 = require("uuid");
const socket_1 = require("../../../infrastructure/websocket/socket");
const admin_repository_1 = require("../repositories/admin.repository");
const post_model_1 = require("../../posts/models/post.model");
class AdminService {
    adminRepository;
    constructor() {
        this.adminRepository = new admin_repository_1.AdminRepository();
    }
    async processAiWebhook(payload) {
        const severity = this.resolveSeverity(payload.risk_score, payload.action);
        const alertType = this.resolveAlertType(payload.action);
        // Update Post or Comment based on event_type
        if (payload.event_type === "new_post") {
            const status = payload.action === "ALLOW" ? "APPROVED" : (payload.action === "BLOCK" ? "REJECTED" : "PENDING");
            await post_model_1.PostModel.findByIdAndUpdate(payload.event_id, {
                status,
                isFlagged: payload.action !== "ALLOW",
                threatScore: payload.risk_score,
                aiVerdict: payload.action === "BLOCK" || payload.action === "SHADOW",
            });
        }
        else if (payload.event_type === "new_comment") {
            // Need to require CommentModel at the top or dynamically import to avoid circular dep if any, but let's assume it's imported
            const { CommentModel } = require("../../comments/models/comment.model");
            const status = payload.action === "ALLOW" ? "APPROVED" : (payload.action === "BLOCK" ? "REJECTED" : "PENDING");
            await CommentModel.findByIdAndUpdate(payload.event_id, {
                status,
                isFlagged: payload.action !== "ALLOW",
                threatScore: payload.risk_score,
                aiVerdict: payload.action === "BLOCK" || payload.action === "SHADOW",
            });
        }
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
            metadata: { source: "ai-worker", event_type: payload.event_type },
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
    getAlertById(alertId) {
        return this.adminRepository.findAlertById(alertId);
    }
    async acknowledgeAlert(alertId, userId, payload) {
        const { AuditLogModel } = require("../../audit/models/audit-log.model");
        const { UserModel } = require("../../users/models/user.model");
        const alert = await this.adminRepository.acknowledgeAlert(alertId, userId, payload);
        if (alert) {
            if (payload.userStatus && alert.userId) {
                await UserModel.findByIdAndUpdate(alert.userId, { status: payload.userStatus });
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
            });
        }
        return alert;
    }
    getUnacknowledgedCount() {
        return this.adminRepository.getUnacknowledgedAlertCount();
    }
    async lockAlert(alertId, adminId) {
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
            });
            return true;
        }
        return false;
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