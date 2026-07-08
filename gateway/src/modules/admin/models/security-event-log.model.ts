import mongoose, { Schema } from "mongoose";

const SecurityEventLogSchema = new Schema(
    {
        input: { type: Schema.Types.Mixed, required: true },
        prediction: { type: Schema.Types.Mixed, required: true },
        threat_matrix: { type: Schema.Types.Mixed, required: true },
        created_at: { type: Date, required: true },
    },
    {
        collection: "security_event_logs",
        strict: false,
    }
);

SecurityEventLogSchema.index({ "threat_matrix.event_id": 1 });
SecurityEventLogSchema.index({ "threat_matrix.correlation_id": 1, created_at: -1 });
SecurityEventLogSchema.index({ created_at: -1 });

export const SecurityEventLogModel = mongoose.model(
    "SecurityEventLog",
    SecurityEventLogSchema
);
