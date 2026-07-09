import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  isVerified: boolean;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isVerified: { type: Boolean, default: false },
  memberCount: { type: Number, default: 1 },
}, { timestamps: true });

OrganizationSchema.index({ name: 'text', description: 'text' });

export const OrganizationModel = mongoose.model<IOrganization>('Organization', OrganizationSchema);
