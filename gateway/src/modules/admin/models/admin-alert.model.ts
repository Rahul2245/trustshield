import mongoose, { Schema, Document } from "mongoose";

export interface IAdminAlert extends Document {
    alertId: string;
    eventId?: string;
    correlationId: string;
    type: "RATE_LIMIT" | "AI_THREAT" | "BLOCK" | "SHADOW";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    userId?: string;
    email?: string;
    ipAddress?: string;
    riskScore?: number;
    action?: string;
    message: string;
    metadata?: Record<string, unknown>;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    lockedByAdminId?: string;
    lockedAt?: Date;
    decision?: string;
    resolution?: string;
    userStatus?: string;
    remarks?: string;
    lastUpdatedBy?: string;
    lastUpdatedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AdminAlertSchema = new Schema<IAdminAlert>(
    {
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
        metadata: { type: Schema.Types.Mixed },
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
    },
    { timestamps: true }
);

AdminAlertSchema.index({ createdAt: -1 });
AdminAlertSchema.index({ acknowledged: 1, createdAt: -1 });

export const AdminAlertModel = mongoose.model<IAdminAlert>("AdminAlert", AdminAlertSchema);
