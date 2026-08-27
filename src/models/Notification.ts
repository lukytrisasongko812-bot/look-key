import mongoose, { Schema, Document as MongooseDocument, Model } from 'mongoose'

export interface INotification extends MongooseDocument {
  userId?: mongoose.Types.ObjectId
  type: 'approved' | 'revision' | 'signed' | 'reminder' | 'email_sent' | 'whatsapp_sent' | 'decision'
  title: string
  description: string
  isRead: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['approved', 'revision', 'signed', 'reminder', 'email_sent', 'whatsapp_sent', 'decision'],
      default: 'reminder',
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const NotificationModel: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema)
