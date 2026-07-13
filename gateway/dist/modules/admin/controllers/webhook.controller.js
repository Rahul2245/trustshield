"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const zod_1 = require("zod");
const env_1 = require("../../../config/env");
const api_response_1 = require("../../../shared/responses/api-response");
const admin_service_1 = require("../services/admin.service");
const webhookSchema = zod_1.z.object({
    event_id: zod_1.z.string(),
    event_type: zod_1.z.string().default("auth_login"),
    correlation_id: zod_1.z.string(),
    user_id: zod_1.z.string(),
    risk_score: zod_1.z.number(),
    action: zod_1.z.enum(["ALLOW", "MONITOR", "SHADOW", "BLOCK"]),
    timestamp: zod_1.z.string(),
    // Full threat document from AI worker — used for guaranteed fallback
    // persistence into security_event_logs if the AI worker's own
    // MongoDB write failed silently.
    threat_document: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
class WebhookController {
    adminService;
    constructor() {
        this.adminService = new admin_service_1.AdminService();
    }
    handleAiResult = async (req, res) => {
        try {
            if (env_1.env.WEBHOOK_SECRET) {
                const secret = req.headers["x-webhook-secret"];
                if (secret !== env_1.env.WEBHOOK_SECRET) {
                    api_response_1.ApiResponse.error(res, 401, "Invalid webhook secret");
                    return;
                }
            }
            const payload = webhookSchema.parse(req.body);
            const alert = await this.adminService.processAiWebhook(payload);
            api_response_1.ApiResponse.success(res, "Webhook processed", { alertId: alert.alertId });
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 400, "Webhook processing failed", error);
        }
    };
}
exports.WebhookController = WebhookController;
//# sourceMappingURL=webhook.controller.js.map