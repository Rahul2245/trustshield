"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAlertModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AdminAlertSchema = new mongoose_1.Schema({
    alertId: { type: String, required: true, unique: true, index: true },
    eventId: { type: String, index: true },
    correlationId: { type: String, required: true, index: true },
    type: {
        type: String,
        enum: ["RATE_LIMIT", "AI_THREAT", "BLOCK", "SHADOW"],
        required: true,
    },
    severity: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        required: true,
    },
    userId: { type: String },
    email: { type: String },
    ipAddress: { type: String },
    riskScore: { type: Number },
    action: { type: String },
    message: { type: String, required: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: String },
    acknowledgedAt: { type: Date },
    lockedByAdminId: { type: String },
    lockedAt: { type: Date },
    decision: { type: String },
    resolution: { type: String },
    userStatus: { type: String },
    remarks: { type: String },
    lastUpdatedBy: { type: String },
    lastUpdatedAt: { type: Date },
}, { timestamps: true });
AdminAlertSchema.index({ createdAt: -1 });
AdminAlertSchema.index({ acknowledged: 1, createdAt: -1 });
exports.AdminAlertModel = mongoose_1.default.model("AdminAlert", AdminAlertSchema);
//# sourceMappingURL=admin-alert.model.js.map