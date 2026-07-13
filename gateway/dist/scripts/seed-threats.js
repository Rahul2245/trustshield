"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Seed script to generate mock threats and alerts for the TrustShield dashboard.
 * Run: npm run seed:threats
 */
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
dotenv_1.default.config();
const security_event_log_model_1 = require("../modules/admin/models/security-event-log.model");
const admin_alert_model_1 = require("../modules/admin/models/admin-alert.model");
const USERS = [
    "alex.chen@reactenthusiasts.com",
    "sarah.jones@trustsafety.org",
    "michael.smith@openaidevs.com",
    "hacker1337@anon.net",
    "bot.crawler@badactor.ru",
    "david.lee@cybersec.group",
    "emma.watson@frontend.io"
];
const IPS = [
    "192.168.1.100",
    "10.0.0.50",
    "45.22.19.88",
    "185.10.20.5",
    "104.28.10.150",
    "203.0.113.42",
    "8.8.8.8"
];
const PAYLOADS = [
    "SELECT * FROM users WHERE 1=1",
    "<script>alert(1)</script>",
    "admin' OR '1'='1",
    "Normal login attempt from recognized device.",
    "Multiple failed attempts detected. Password spraying likely.",
    "Executing /bin/sh -c 'rm -rf /'",
    "Session dwell time normal, navigating to settings."
];
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
async function seedThreats() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is required");
        process.exit(1);
    }
    await mongoose_1.default.connect(mongoUri, {
        dbName: process.env.DATABASE_NAME || "trustshield",
    });
    console.log("Clearing existing threats and alerts...");
    await security_event_log_model_1.SecurityEventLogModel.deleteMany({});
    await admin_alert_model_1.AdminAlertModel.deleteMany({});
    console.log("Generating 250 mock threats...");
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const logsToInsert = [];
    const alertsToInsert = [];
    for (let i = 0; i < 250; i++) {
        const isMalicious = Math.random() > 0.6;
        const isShadow = !isMalicious && Math.random() > 0.8;
        const isMonitor = !isMalicious && !isShadow && Math.random() > 0.7;
        let action = "ALLOW";
        let finalScore = Math.floor(Math.random() * 20); // 0-19
        let nlpLabel = "SAFE";
        if (isMalicious) {
            action = "BLOCK";
            finalScore = Math.floor(Math.random() * 30) + 70; // 70-99
            nlpLabel = "SQL_INJECTION";
        }
        else if (isShadow) {
            action = "SHADOW";
            finalScore = Math.floor(Math.random() * 20) + 50; // 50-69
            nlpLabel = "SUSPICIOUS";
        }
        else if (isMonitor) {
            action = "MONITOR";
            finalScore = Math.floor(Math.random() * 20) + 30; // 30-49
            nlpLabel = "ANOMALY";
        }
        const createdAt = randomDate(thirtyDaysAgo, now);
        const eventId = (0, uuid_1.v4)();
        const correlationId = (0, uuid_1.v4)();
        const userId = USERS[Math.floor(Math.random() * USERS.length)];
        const ip = IPS[Math.floor(Math.random() * IPS.length)];
        logsToInsert.push({
            input: {
                event_id: eventId,
                correlation_id: correlationId,
                user_id: userId,
                origin_ip: ip,
                payload_text: PAYLOADS[Math.floor(Math.random() * PAYLOADS.length)],
                burst_velocity: Math.random() * 100,
                target_recipient_ratio: Math.random(),
                uri_hyperlink_density: Math.random(),
                session_dwell_duration: Math.random() * 500,
            },
            prediction: {
                nlp: {
                    spam_probability: Math.random(),
                    safe_probability: Math.random(),
                    predicted_label: nlpLabel,
                    risk_score: finalScore * 0.8,
                    confidence_score: Math.random() * 0.4 + 0.6,
                },
                isolation_forest: {
                    is_anomaly: isMalicious || isShadow,
                    anomaly_score: Math.random(),
                    risk_score: finalScore * 0.9,
                    features: {},
                },
                fusion: {
                    risk_score: finalScore,
                    confidence: Math.random() * 0.3 + 0.7,
                    decision: action,
                    risk_level: action === "BLOCK" ? "HIGH" : action === "SHADOW" ? "MEDIUM" : "LOW",
                    explanation: "Fused AI signals indicate " + (isMalicious ? "malicious intent" : "safe activity"),
                },
                shadow: {
                    enabled: isShadow,
                    completed: true,
                    is_malicious: Math.random() > 0.5,
                    confidence_score: Math.random() * 0.5 + 0.5,
                    reason: "Secondary AI analysis",
                },
            },
            threat_matrix: {
                event_id: eventId,
                correlation_id: correlationId,
                user_id: userId,
                tier1_nlp_score: finalScore * 0.8,
                tier2_if_score: finalScore * 0.9,
                final_fusion_score: finalScore,
                shadow_queue_verdict: isShadow ? "PENDING" : "N/A",
                shadow_queue_confidence: Math.random() * 0.5 + 0.5,
                action_taken: action,
                processing_time_ms: Math.floor(Math.random() * 200),
                model_versions: {
                    nlp: "v2.1",
                    if: "v1.5",
                    fusion: "v3.0"
                },
            },
            created_at: createdAt,
        });
        if (action === "BLOCK" || action === "SHADOW" || Math.random() > 0.9) {
            alertsToInsert.push({
                alertId: (0, uuid_1.v4)(),
                eventId: eventId,
                correlationId: correlationId,
                type: action === "BLOCK" ? "AI_THREAT" : action === "SHADOW" ? "SHADOW" : "RATE_LIMIT",
                severity: finalScore > 80 ? "CRITICAL" : finalScore > 60 ? "HIGH" : finalScore > 40 ? "MEDIUM" : "LOW",
                userId: userId,
                email: userId,
                ipAddress: ip,
                riskScore: finalScore,
                action: action,
                message: `Automated detection triggered: ${nlpLabel}`,
                acknowledged: Math.random() > 0.7,
                createdAt: createdAt,
                updatedAt: createdAt,
            });
        }
    }
    // Sort by created_at ascending to simulate real data insertion
    logsToInsert.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
    alertsToInsert.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    await security_event_log_model_1.SecurityEventLogModel.insertMany(logsToInsert);
    console.log(`Inserted ${logsToInsert.length} threat logs.`);
    await admin_alert_model_1.AdminAlertModel.insertMany(alertsToInsert);
    console.log(`Inserted ${alertsToInsert.length} admin alerts.`);
    await mongoose_1.default.disconnect();
    console.log("Database seed complete!");
    process.exit(0);
}
seedThreats().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=seed-threats.js.map