"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const router = (0, express_1.Router)();
const webhookController = new webhook_controller_1.WebhookController();
router.post("/webhook/ai-result", webhookController.handleAiResult);
exports.default = router;
//# sourceMappingURL=internal.routes.js.map