import mongoose, { Document, Schema } from 'mongoose';
import { actionSchema, ActionType } from './notificationModel';

// Define an interface for the Announcement document
interface IAnnouncement extends Document {
  title: string;
  description: string;
  userId: string;
  type?: 'URGENT' | 'WARNING' | 'GENERAL' | 'IMPORTANT' | 'UPDATES'; // Optional with specific string literals
  action?: ActionType[];
}

// Define the announcement schema
const announcementSchema: Schema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ['URGENT', 'WARNING', 'GENERAL', 'IMPORTANT', 'UPDATES'],
      default: 'GENERAL',
    },
    action: [{ type: actionSchema }],
  },
  { timestamps: true },
);

// Create the Announcement model
export const Announcements = mongoose.model<IAnnouncement>(
  'Announcement',
  announcementSchema,
);
