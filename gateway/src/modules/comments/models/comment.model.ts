import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  parentComment?: mongoose.Types.ObjectId;
  depth: number;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  score: number;
  isEdited: boolean;
  threatScore: number;
  isFlagged: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  aiVerdict?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
  content: { type: String, required: true, maxlength: 2000 },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  parentComment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  depth: { type: Number, default: 0, max: 5 },
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  score: { type: Number, default: 0 },
  isEdited: { type: Boolean, default: false },
  threatScore: { type: Number, default: 0 },
  isFlagged: { type: Boolean, default: false },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  aiVerdict: { type: Boolean, default: false },
}, {
  timestamps: true
});

CommentSchema.index({ post: 1, createdAt: 1 });
CommentSchema.index({ post: 1, parentComment: 1 });
CommentSchema.index({ status: 1 });
CommentSchema.index({ score: -1, createdAt: -1 });

export const CommentModel = mongoose.model<IComment>('Comment', CommentSchema);

