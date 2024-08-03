import mongoose, { Document, Schema } from "mongoose";

// Define an interface for the Notification document
interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  isRead?: boolean;
  adminCreated?: boolean;
  type?: string;
  link?: string;
}

// Define the notification schema
const notificationSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, minlength: 1 },
    title: { type: String, required: true, minlength: 1 },
    message: { type: String, required: true, minlength: 1 },
    isRead: { type: Boolean, default: false },
    adminCreated: { type: Boolean, default: false },
    type: { type: String, default: "GENERAL" }, // Corrected "GERNERAL" to "GENERAL"
    link: { type: String },
  },
  { timestamps: true }
);

// Create an index to automatically delete documents after 259200 seconds (3 days)
notificationSchema.index({ userId: 1 }, { expireAfterSeconds: 259200 });

// Export the Notification model
export const Notification = mongoose.model<INotification>("Notification", notificationSchema);