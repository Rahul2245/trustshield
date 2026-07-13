import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  moderators: mongoose.Types.ObjectId[];
  bannerImage?: string;
  avatarImage?: string;
  rules: string[];
  isVerified: boolean;
  isPrivate: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  moderators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  bannerImage: { type: String, default: null },
  avatarImage: { type: String, default: null },
  rules: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  tags: [{ type: String }],
}, { timestamps: true });

OrganizationSchema.index({ name: 'text', description: 'text' });
OrganizationSchema.index({ slug: 1 }, { unique: true });

export const OrganizationModel = mongoose.model<IOrganization>('Organization', OrganizationSchema);

