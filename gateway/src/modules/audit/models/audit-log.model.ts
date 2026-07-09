import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  userId?: mongoose.Types.ObjectId;
  ipAddress?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  eventType: { type: String, required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  ipAddress: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Indexes for high-performance querying by Admin Dashboard
AuditLogSchema.index({ eventType: 1 });
AuditLogSchema.index({ severity: 1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
