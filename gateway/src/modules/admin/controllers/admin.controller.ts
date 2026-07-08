import { Request, Response } from "express";
import { z } from "zod";

import { ApiResponse } from "../../../shared/responses/api-response";
import { AdminService } from "../services/admin.service";

const listQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    action: z.string().optional(),
    minRisk: z.coerce.number().optional(),
    search: z.string().optional(),
    acknowledged: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
    status: z.string().optional(),
    days: z.coerce.number().min(1).max(90).default(7),
});

const updateStatusSchema = z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export class AdminController {
    private adminService: AdminService;

    constructor() {
        this.adminService = new AdminService();
    }

    public getStats = async (_req: Request, res: Response): Promise<void> => {
        try {
            const [threatStats, userStats, unacknowledgedAlerts] = await Promise.all([
                this.adminService.getStats(),
                this.adminService.getUserStats(),
                this.adminService.getUnacknowledgedCount(),
            ]);

            ApiResponse.success(res, "Dashboard stats retrieved", {
                threats: threatStats,
                users: userStats,
                unacknowledgedAlerts,
            });
        } catch (error: unknown) {
            ApiResponse.error(res, 500, "Failed to fetch stats", error);
        }
    };

    public getTrend = async (req: Request, res: Response): Promise<void> => {
        try {
            const { days } = listQuerySchema.parse(req.query);
            const trend = await this.adminService.getTrend(days);
            ApiResponse.success(res, "Threat trend retrieved", trend);
        } catch (error: unknown) {
            ApiResponse.error(res, 500, "Failed to fetch trend", error);
        }
    };

    public getThreats = async (req: Request, res: Response): Promise<void> => {
        try {
            const query = listQuerySchema.parse(req.query);
            const result = await this.adminService.getThreats({
                page: query.page,
                limit: query.limit,
                action: query.action,
                minRisk: query.minRisk,
                search: query.search,
            });
            ApiResponse.success(res, "Threats retrieved", result);
        } catch (error: unknown) {
            ApiResponse.error(res, 500, "Failed to fetch threats", error);
        }
    };

    public getThreatById = async (req: Request, res: Response): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const threat = await this.adminService.getThreatByEventId(eventId);
            if (!threat) {
                ApiResponse.error(res, 404, "Threat not found");
                return;
            }
            ApiResponse.success(res, "Threat retrieved", threat);
        } catch (error: unknown) {
            ApiResponse.error(res, 500, "Failed to fetch threat", error);
        }
    };

    public getAlerts = async (req: Request, res: Response): Promise<void> => {
        try {
            const query = listQuerySchema.parse(req.query);
            const result = await this.adminService.getAlerts(
                query.page,
                query.limit,
                query.acknowledged
            );
            ApiResponse.success(res, "Alerts retrieved", result);
        } catch (error: unknown) {
            ApiResponse.error(res, 500, "Failed to fetch alerts", error);
        }
    };

    public acknowledgeAlert = async (req: Request, res: Response): Promise<void> => {
        try {
            const alert = await this.adminService.acknowledgeAlert(
                String(req.params.alertId),
                req.user!.id
            );
            if (!alert) {
                ApiResponse.error(res, 404, "Alert not found");
                return;
            }
            ApiResponse.success(res, "Alert acknowledged", alert);
        } catch (error: unknown) {
            ApiResponse.error(res, 500, "Failed to acknowledge alert", error);
        }
    };

    public getUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const query = listQuerySchema.parse(req.query);
            const result = await this.adminService.getUsers(
                query.page,
                query.limit,
                query.status
            );
            ApiResponse.success(res, "Users retrieved", result);
        } catch (error: unknown) {
            ApiResponse.error(res, 500, "Failed to fetch users", error);
        }
    };

    public updateUserStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { status } = updateStatusSchema.parse(req.body);
            const user = await this.adminService.updateUserStatus(String(req.params.userId), status);
            if (!user) {
                ApiResponse.error(res, 404, "User not found");
                return;
            }
            ApiResponse.success(res, "User status updated", user);
        } catch (error: unknown) {
            ApiResponse.error(res, 500, "Failed to update user", error);
        }
    };
}
