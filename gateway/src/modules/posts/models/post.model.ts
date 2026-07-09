import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  tags: string[];
  media: string[];
  threatScore: number;
  isFlagged: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  aiVerdict?: boolean;
  aiConfidence?: number;
  aiReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  content: { type: String, required: true, maxlength: 5000 },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  community: { type: Schema.Types.ObjectId, ref: 'Community' },
  tags: [{ type: String }],
  media: [{ type: String }], // URLs to images/videos
  threatScore: { type: Number, default: 0 },
  isFlagged: { type: Boolean, default: false },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  aiVerdict: { type: Boolean, default: false },
  aiConfidence: { type: Number, default: 0.0 },
  aiReason: { type: String, default: '' },
}, {
  timestamps: true
});

PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ status: 1 });

export const PostModel = mongoose.model<IPost>('Post', PostSchema);
