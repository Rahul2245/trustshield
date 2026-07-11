import { AdminAlertModel, IAdminAlert } from "../models/admin-alert.model";
import { SecurityEventLogModel } from "../models/security-event-log.model";
import { UserModel, IUser } from "../../users/models/user.model";
import { UserRole } from "../../../core/enums/user-role.enum";

export interface ThreatListQuery {
    page: number;
    limit: number;
    action?: string;
    minRisk?: number;
    search?: string;
}

export class AdminRepository {
    public async findThreats(query: ThreatListQuery) {
        const filter: Record<string, unknown> = {};

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
            SecurityEventLogModel.find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(query.limit)
                .lean()
                .exec(),
            SecurityEventLogModel.countDocuments(filter).exec(),
        ]);

        return { items, total, page: query.page, limit: query.limit };
    }

    public async findThreatByEventId(eventId: string) {
        return SecurityEventLogModel.findOne({
            "threat_matrix.event_id": eventId,
        })
            .lean()
            .exec();
    }

    public async getThreatStats() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalThreats,
            todayThreats,
            weekThreats,
            actionBreakdown,
            avgRisk,
            highRiskCount,
        ] = await Promise.all([
            SecurityEventLogModel.countDocuments().exec(),
            SecurityEventLogModel.countDocuments({ created_at: { $gte: dayAgo } }).exec(),
            SecurityEventLogModel.countDocuments({ created_at: { $gte: weekAgo } }).exec(),
            SecurityEventLogModel.aggregate([
                { $group: { _id: "$threat_matrix.action_taken", count: { $sum: 1 } } },
            ]).exec(),
            SecurityEventLogModel.aggregate([
                { $group: { _id: null, avg: { $avg: "$threat_matrix.final_fusion_score" } } },
            ]).exec(),
            SecurityEventLogModel.countDocuments({
                "threat_matrix.final_fusion_score": { $gte: 80 },
            }).exec(),
        ]);

        const actions: Record<string, number> = {};
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

    public async getDailyThreatTrend(days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);

        return SecurityEventLogModel.aggregate([
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

    public async createAlert(data: Partial<IAdminAlert>): Promise<IAdminAlert> {
        const alert = new AdminAlertModel(data);
        return alert.save();
    }

    public async findAlerts(page: number, limit: number, acknowledged?: boolean) {
        const filter: Record<string, unknown> = {};
        if (acknowledged !== undefined) {
            filter.acknowledged = acknowledged;
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            AdminAlertModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            AdminAlertModel.countDocuments(filter).exec(),
        ]);

        return { items, total, page, limit };
    }

    public async findAlertById(alertId: string) {
        const { AuditLogModel } = require("../../audit/models/audit-log.model");
        const alert = await AdminAlertModel.findOne({ alertId }).lean().exec();
        if (!alert) return null;

        const auditLogs = await AuditLogModel.find({ "metadata.alertId": alertId })
            .sort({ createdAt: 1 })
            .lean()
            .exec();

        let targetUser = null;
        if (alert.userId) {
            targetUser = await UserModel.findById(alert.userId).select("-password").lean().exec();
        } else if (alert.email) {
            targetUser = await UserModel.findOne({ email: alert.email }).select("-password").lean().exec();
        }

        return { ...alert, auditLogs, targetUser };
    }

    public async acknowledgeAlert(alertId: string, userId: string, payload: { decision: string, resolution: string, userStatus?: string, remarks: string }) {
        return AdminAlertModel.findOneAndUpdate(
            { alertId, $or: [{ lockedByAdminId: userId }, { lockedByAdminId: { $exists: false } }, { lockedByAdminId: null }] },
            {
                acknowledged: true,
                acknowledgedBy: userId,
                acknowledgedAt: new Date(),
                decision: payload.decision,
                resolution: payload.resolution,
                userStatus: payload.userStatus,
                remarks: payload.remarks,
                lastUpdatedBy: userId,
                lastUpdatedAt: new Date()
            },
            { new: true }
        ).exec();
    }

    public async lockAlert(alertId: string, adminId: string) {
        return AdminAlertModel.findOneAndUpdate(
            { 
                alertId, 
                acknowledged: false,
                $or: [{ lockedByAdminId: { $exists: false } }, { lockedByAdminId: null }, { lockedByAdminId: adminId }] 
            },
            {
                lockedByAdminId: adminId,
                lockedAt: new Date(),
                lastUpdatedBy: adminId,
                lastUpdatedAt: new Date()
            },
            { new: true }
        ).exec();
    }

    public async getUnacknowledgedAlertCount() {
        return AdminAlertModel.countDocuments({ acknowledged: false }).exec();
    }

    public async findAllUsers(page: number, limit: number, status?: string) {
        const filter: Record<string, unknown> = {};
        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            UserModel.find(filter)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            UserModel.countDocuments(filter).exec(),
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

    public async updateUserStatus(userId: string, status: IUser["status"]) {
        const user = await UserModel.findByIdAndUpdate(userId, { status }, { new: true })
            .select("-password")
            .lean()
            .exec();

        if (!user) return null;

        return {
            id: String(user._id),
            email: user.email,
            role: user.role,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
        };
    }

    public async getUserStats() {
        const [total, active, inactive, suspended, admins] = await Promise.all([
            UserModel.countDocuments().exec(),
            UserModel.countDocuments({ status: "ACTIVE" }).exec(),
            UserModel.countDocuments({ status: "INACTIVE" }).exec(),
            UserModel.countDocuments({ status: "SUSPENDED" }).exec(),
            UserModel.countDocuments({ role: { $in: [UserRole.ADMIN, UserRole.ANALYST] } }).exec(),
        ]);

        return { total, active, inactive, suspended, admins };
    }
}
