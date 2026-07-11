import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserRole } from '../../../core/enums/user-role.enum';

export interface IUser extends Document {
  email: string;
  password?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isUnderInvestigation: boolean;
  lastLoginAt?: Date;
  
  // Social Platform Fields
  avatar?: string;
  coverImage?: string;
  bio?: string;
  socialLinks?: Record<string, string>;
  followers?: mongoose.Types.ObjectId[];
  following?: mongoose.Types.ObjectId[];
  badges?: string[];
  
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  isUnderInvestigation: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  
  // Social Platform Fields
  avatar: { type: String, default: null },
  coverImage: { type: String, default: null },
  bio: { type: String, default: '', maxlength: 500 },
  socialLinks: { type: Map, of: String, default: {} },
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  badges: [{ type: String }]
}, {
  timestamps: true
});

UserSchema.index({ status: 1, lastLoginAt: -1 });
UserSchema.index({ email: 1 }, { unique: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password as string, salt);
    this.password = hash;
  } catch (err) {
    throw err;
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);