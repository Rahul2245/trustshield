"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRepository = void 0;
const admin_alert_model_1 = require("../models/admin-alert.model");
const security_event_log_model_1 = require("../models/security-event-log.model");
const user_model_1 = require("../../users/models/user.model");
const user_role_enum_1 = require("../../../core/enums/user-role.enum");
class AdminRepository {
    async findThreats(query) {
        const filter = {};
        if (query.action) {
            filter["threat_matrix.action_taken"] = query.action;
        }
        if (query.minRisk !== undefined) {
            filter["threat_matrix.final_fusion_score"] = { $gte: query.minRisk };
        }
        if (query.search) {
            filter.$or = [
                { "threat_matrix.event_id": { $regex: query.search, $options: "i" } },
                { "threat_matrix.correlation_id": { $regex: query.search, $options: "i" } },
                { "threat_matrix.user_id": { $regex: query.search, $options: "i" } },
                { "input.origin_ip": { $regex: query.search, $options: "i" } },
            ];
        }
        const skip = (query.page - 1) * query.limit;
        const [items, total] = await Promise.all([
            security_event_log_model_1.SecurityEventLogModel.find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(query.limit)
                .lean()
                .exec(),
            security_event_log_model_1.SecurityEventLogModel.countDocuments(filter).exec(),
        ]);
        return { items, total, page: query.page, limit: query.limit };
    }
    async findThreatByEventId(eventId) {
        return security_event_log_model_1.SecurityEventLogModel.findOne({
            "threat_matrix.event_id": eventId,
        })
            .lean()
            .exec();
    }
    async getThreatStats() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalThreats, todayThreats, weekThreats, actionBreakdown, avgRisk, highRiskCount,] = await Promise.all([
            security_event_log_model_1.SecurityEventLogModel.countDocuments().exec(),
            security_event_log_model_1.SecurityEventLogModel.countDocuments({ created_at: { $gte: dayAgo } }).exec(),
            security_event_log_model_1.SecurityEventLogModel.countDocuments({ created_at: { $gte: weekAgo } }).exec(),
            security_event_log_model_1.SecurityEventLogModel.aggregate([
                { $group: { _id: "$threat_matrix.action_taken", count: { $sum: 1 } } },
            ]).exec(),
            security_event_log_model_1.SecurityEventLogModel.aggregate([
                { $group: { _id: null, avg: { $avg: "$threat_matrix.final_fusion_score" } } },
            ]).exec(),
            security_event_log_model_1.SecurityEventLogModel.countDocuments({
                "threat_matrix.final_fusion_score": { $gte: 80 },
            }).exec(),
        ]);
        const actions = {};
        for (const item of actionBreakdown) {
            actions[item._id || "UNKNOWN"] = item.count;
        }
        return {
            totalThreats,
            todayThreats,
            weekThreats,
            highRiskCount,
            averageRiskScore: avgRisk[0]?.avg ?? 0,
            actionBreakdown: actions,
        };
    }
    async getDailyThreatTrend(days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);
        return security_event_log_model_1.SecurityEventLogModel.aggregate([
            { $match: { created_at: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$created_at" },
                    },
                    count: { $sum: 1 },
                    avgRisk: { $avg: "$threat_matrix.final_fusion_score" },
                    blocked: {
                        $sum: {
                            $cond: [{ $eq: ["$threat_matrix.action_taken", "BLOCK"] }, 1, 0],
                        },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]).exec();
    }
    async createAlert(data) {
        const alert = new admin_alert_model_1.AdminAlertModel(data);
        return alert.save();
    }
    async findAlerts(page, limit, acknowledged) {
        const filter = {};
        if (acknowledged !== undefined) {
            filter.acknowledged = acknowledged;
        }
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            admin_alert_model_1.AdminAlertModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            admin_alert_model_1.AdminAlertModel.countDocuments(filter).exec(),
        ]);
        return { items, total, page, limit };
    }
    async findAlertById(alertId) {
        const { AuditLogModel } = require("../../audit/models/audit-log.model");
        const alert = await admin_alert_model_1.AdminAlertModel.findOne({ alertId }).lean().exec();
        if (!alert)
            return null;
        const auditLogs = await AuditLogModel.find({ "metadata.alertId": alertId })
            .sort({ createdAt: 1 })
            .lean()
            .exec();
        let targetUser = null;
        if (alert.userId) {
            targetUser = await user_model_1.UserModel.findById(alert.userId).select("-password").lean().exec();
        }
        else if (alert.email) {
            targetUser = await user_model_1.UserModel.findOne({ email: alert.email }).select("-password").lean().exec();
        }
        let targetPost = null;
        let reporterUser = null;
        if (alert.eventId) {
            const { PostModel } = require("../../posts/models/post.model");
            targetPost = await PostModel.findById(alert.eventId).populate('author', 'email avatar').lean().exec();
            if (!targetPost) {
                const { CommentModel } = require("../../comments/models/comment.model");
                targetPost = await CommentModel.findById(alert.eventId).populate('author', 'email avatar').lean().exec();
            }
        }
        if (alert.type === "USER_REPORT" && alert.metadata && alert.metadata.reporterId) {
            reporterUser = await user_model_1.UserModel.findById(alert.metadata.reporterId).select("email avatar").lean().exec();
        }
        return { ...alert, auditLogs, targetUser, targetPost, reporterUser };
    }
    async acknowledgeAlert(alertId, userId, payload) {
        return admin_alert_model_1.AdminAlertModel.findOneAndUpdate({ alertId, $or: [{ lockedByAdminId: userId }, { lockedByAdminId: { $exists: false } }, { lockedByAdminId: null }] }, {
            acknowledged: true,
            acknowledgedBy: userId,
            acknowledgedAt: new Date(),
            decision: payload.decision,
            resolution: payload.resolution,
            userStatus: payload.userStatus,
            remarks: payload.remarks,
            lastUpdatedBy: userId,
            lastUpdatedAt: new Date()
        }, { new: true }).exec();
    }
    async lockAlert(alertId, adminId) {
        return admin_alert_model_1.AdminAlertModel.findOneAndUpdate({
            alertId,
            acknowledged: false,
            $or: [{ lockedByAdminId: { $exists: false } }, { lockedByAdminId: null }, { lockedByAdminId: adminId }]
        }, {
            lockedByAdminId: adminId,
            lockedAt: new Date(),
            lastUpdatedBy: adminId,
            lastUpdatedAt: new Date()
        }, { new: true }).exec();
    }
    async getUnacknowledgedAlertCount() {
        return admin_alert_model_1.AdminAlertModel.countDocuments({ acknowledged: false }).exec();
    }
    async findAllUsers(page, limit, status) {
        const filter = {};
        if (status) {
            filter.status = status;
        }
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            user_model_1.UserModel.find(filter)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            user_model_1.UserModel.countDocuments(filter).exec(),
        ]);
        const mappedItems = items.map((user) => ({
            id: String(user._id),
            email: user.email,
            role: user.role,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
        return { items: mappedItems, total, page, limit };
    }
    async updateUserStatus(userId, status) {
        const updateQuery = { status };
        if (status === "ACTIVE") {
            updateQuery.isUnderInvestigation = false;
        }
        const user = await user_model_1.UserModel.findByIdAndUpdate(userId, updateQuery, { new: true })
            .select("-password")
            .lean()
            .exec();
        if (!user)
            return null;
        return {
            id: String(user._id),
            email: user.email,
            role: user.role,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
        };
    }
    async getUserStats() {
        const [total, active, inactive, suspended, admins] = await Promise.all([
            user_model_1.UserModel.countDocuments().exec(),
            user_model_1.UserModel.countDocuments({ status: "ACTIVE" }).exec(),
            user_model_1.UserModel.countDocuments({ status: "INACTIVE" }).exec(),
            user_model_1.UserModel.countDocuments({ status: "SUSPENDED" }).exec(),
            user_model_1.UserModel.countDocuments({ role: { $in: [user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ANALYST] } }).exec(),
        ]);
        return { total, active, inactive, suspended, admins };
    }
}
exports.AdminRepository = AdminRepository;
//# sourceMappingURL=admin.repository.js.map