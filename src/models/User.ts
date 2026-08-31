import mongoose, { Schema, Document as MongooseDocument, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

export type UserRole =
  | 'Requester'
  | 'Reviewer'
  | 'Approver'
  | 'Document Controller'
  | 'Administrator'
  // Legacy compatibility
  | 'User'
  | 'Legal Officer'
  | 'Legal Manager'
  | 'Department Manager'
  | 'Director / BOD'

export interface IUser extends MongooseDocument {
  employeeName: string
  email: string
  passwordHash: string
  position: string
  division: string
  role: UserRole
  phone?: string
  avatarUrl?: string
  twoFactorEnabled: boolean
  twoFactorCode?: string | null
  twoFactorExpires?: Date | null
  createdAt: Date
  updatedAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    employeeName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    position: { type: String, default: 'Reviewer' },
    division: { type: String, default: 'Direktorat Umum' },
    role: {
      type: String,
      enum: [
        'Requester',
        'Reviewer',
        'Approver',
        'Document Controller',
        'Administrator',
        // Legacy
        'User',
        'Legal Officer',
        'Legal Manager',
        'Department Manager',
        'Director / BOD',
      ],
      default: 'Requester',
    },
    phone: { type: String, default: '+62 812-9876-5432' },
    avatarUrl: { type: String, default: '' },
    twoFactorEnabled: { type: Boolean, default: true },
    twoFactorCode: { type: String, default: null },
    twoFactorExpires: { type: Date, default: null },
  },
  { timestamps: true }
)

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash)
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
