"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const zod_1 = require("zod");
const api_response_1 = require("../../../shared/responses/api-response");
const admin_service_1 = require("../services/admin.service");
const listQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    action: zod_1.z.string().optional(),
    minRisk: zod_1.z.coerce.number().optional(),
    search: zod_1.z.string().optional(),
    acknowledged: zod_1.z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
    status: zod_1.z.string().optional(),
    days: zod_1.z.coerce.number().min(1).max(90).default(7),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});
class AdminController {
    adminService;
    constructor() {
        this.adminService = new admin_service_1.AdminService();
    }
    getStats = async (_req, res) => {
        try {
            const [threatStats, userStats, unacknowledgedAlerts] = await Promise.all([
                this.adminService.getStats(),
                this.adminService.getUserStats(),
                this.adminService.getUnacknowledgedCount(),
            ]);
            api_response_1.ApiResponse.success(res, "Dashboard stats retrieved", {
                threats: threatStats,
                users: userStats,
                unacknowledgedAlerts,
            });
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, "Failed to fetch stats", error);
        }
    };
    getTrend = async (req, res) => {
        try {
            const { days } = listQuerySchema.parse(req.query);
            const trend = await this.adminService.getTrend(days);
            api_response_1.ApiResponse.success(res, "Threat trend retrieved", trend);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, "Failed to fetch trend", error);
        }
    };
    getThreats = async (req, res) => {
        try {
            const query = listQuerySchema.parse(req.query);
            const result = await this.adminService.getThreats({
                page: query.page,
                limit: query.limit,
                action: query.action,
                minRisk: query.minRisk,
                search: query.search,
            });
            api_response_1.ApiResponse.success(res, "Threats retrieved", result);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, "Failed to fetch threats", error);
        }
    };
    getThreatById = async (req, res) => {
        try {
            const eventId = String(req.params.eventId);
            const threat = await this.adminService.getThreatByEventId(eventId);
            if (!threat) {
                api_response_1.ApiResponse.error(res, 404, "Threat not found");
                return;
            }
            api_response_1.ApiResponse.success(res, "Threat retrieved", threat);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, "Failed to fetch threat", error);
        }
    };
    getAlerts = async (req, res) => {
        try {
            const query = listQuerySchema.parse(req.query);
            const result = await this.adminService.getAlerts(query.page, query.limit, query.acknowledged);
            api_response_1.ApiResponse.success(res, "Alerts retrieved", result);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, "Failed to fetch alerts", error);
        }
    };
    getAlertById = async (req, res) => {
        try {
            const alertId = String(req.params.alertId);
            const alert = await this.adminService.getAlertById(alertId);
            if (!alert) {
                api_response_1.ApiResponse.error(res, 404, "Alert not found");
                return;
            }
            api_response_1.ApiResponse.success(res, "Alert retrieved", alert);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, "Failed to fetch alert", error);
        }
    };
    acknowledgeAlert = async (req, res) => {
        try {
            const acknowledgeSchema = zod_1.z.object({
                decision: zod_1.z.string().optional().default("Handled"),
                resolution: zod_1.z.string().optional().default("Completed"),
                userStatus: zod_1.z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
                remarks: zod_1.z.string().optional().default("")
            });
            const payload = acknowledgeSchema.parse(req.body);
            const alert = await this.adminService.acknowledgeAlert(String(req.params.alertId), req.user.id, payload);
            if (!alert) {
                api_response_1.ApiResponse.error(res, 404, "Alert not found");
                return;
            }
            api_response_1.ApiResponse.success(res, "Alert acknowledged", alert);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, "Failed to acknowledge alert", error);
        }
    };
    lockAlert = async (req, res) => {
        try {
            const locked = await this.adminService.lockAlert(String(req.params.alertId), req.user.id);
            if (locked) {
                api_response_1.ApiResponse.success(res, "Alert locked successfully", { locked: true });
            }
            else {
                api_response_1.ApiResponse.error(res, 409, "Alert is already locked by another admin");
            }
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, "Failed to lock alert", error);
        }
    };
    getUsers = async (req, res) => {
        try {
            const query = listQuerySchema.parse(req.query);
            const result = await this.adminService.getUsers(query.page, query.limit, query.status);
            api_response_1.ApiResponse.success(res, "Users retrieved", result);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, "Failed to fetch users", error);
        }
    };
    updateUserStatus = async (req, res) => {
        try {
            const { status } = updateStatusSchema.parse(req.body);
            const user = await this.adminService.updateUserStatus(String(req.params.userId), status);
            if (!user) {
                api_response_1.ApiResponse.error(res, 404, "User not found");
                return;
            }
            api_response_1.ApiResponse.success(res, "User status updated", user);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, "Failed to update user", error);
        }
    };
}
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map