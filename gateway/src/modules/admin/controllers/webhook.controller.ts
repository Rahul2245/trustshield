import { Request, Response } from "express";
import { z } from "zod";

import { env } from "../../../config/env";
import { ApiResponse } from "../../../shared/responses/api-response";
import { AdminService } from "../services/admin.service";

const webhookSchema = z.object({
    event_id: z.string(),
    correlation_id: z.string(),
    user_id: z.string(),
    risk_score: z.number(),
    action: z.enum(["ALLOW", "MONITOR", "SHADOW", "BLOCK"]),
    timestamp: z.string(),
});

export class WebhookController {
    private adminService: AdminService;

    constructor() {
        this.adminService = new AdminService();
    }

    public handleAiResult = async (req: Request, res: Response): Promise<void> => {
        try {
            if (env.WEBHOOK_SECRET) {
                const secret = req.headers["x-webhook-secret"];
                if (secret !== env.WEBHOOK_SECRET) {
                    ApiResponse.error(res, 401, "Invalid webhook secret");
                    return;
                }
            }

            const payload = webhookSchema.parse(req.body);
            const alert = await this.adminService.processAiWebhook(payload);
            ApiResponse.success(res, "Webhook processed", { alertId: alert.alertId });
        } catch (error: unknown) {
            ApiResponse.error(res, 400, "Webhook processing failed", error);
        }
    };
}
