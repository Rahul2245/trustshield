import { Router } from "express";

import { WebhookController } from "../controllers/webhook.controller";

const router = Router();
const webhookController = new WebhookController();

router.post("/webhook/ai-result", webhookController.handleAiResult);

export default router;
