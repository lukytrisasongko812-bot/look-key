import mongoose, { Schema, Document as MongooseDocument, Model } from 'mongoose'

export interface ILoginHistory extends MongooseDocument {
  userId?: mongoose.Types.ObjectId
  email: string
  device: string
  ip: string
  status: 'Success' | 'Blocked (unrecognized)'
  createdAt: Date
}

const LoginHistorySchema = new Schema<ILoginHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true },
    device: { type: String, default: 'Chrome / Windows' },
    ip: { type: String, default: '127.0.0.1' },
    status: { type: String, enum: ['Success', 'Blocked (unrecognized)'], default: 'Success' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const LoginHistoryModel: Model<ILoginHistory> =
  mongoose.models.LoginHistory ||
  mongoose.model<ILoginHistory>('LoginHistory', LoginHistorySchema)
