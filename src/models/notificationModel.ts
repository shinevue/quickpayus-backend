import mongoose, { Document, Schema } from 'mongoose';

export interface ActionType {
  username: string;
  isDelete?: boolean;
  isRead?: boolean;
  update?: Date;
}

export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  adminCreated?: boolean;
  type?: string;
  link?: string;
  action?: ActionType[];
}

export const actionSchema: Schema = new Schema({
  username: { type: String, require: true },
  isDelete: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  update: { type: Date, default: Date.now() },
});

// Define the notification schema
const notificationSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, minlength: 1 },
    title: { type: String, required: true, minlength: 1 },
    message: { type: String, required: true, minlength: 1 },
    type: { type: String, default: 'GENERAL' }, // Corrected "GERNERAL" to "GENERAL"
    link: { type: String },
    adminCreated: { type: Boolean, default: false },
    action: [{ type: actionSchema }],
  },
  { timestamps: true },
);

// Create an index to automatically delete documents after 259200 seconds (3 days)
notificationSchema.index({ userId: 1 }, { expireAfterSeconds: 259200 });

// Export the Notification model
export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema,
);
