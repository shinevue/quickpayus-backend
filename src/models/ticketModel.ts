import mongoose, { Schema, Document } from "mongoose";

interface ITicket extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  subject: string;
  description: string;
  uploadedUrl: string;
  status: "PENDING" | "RESOLVED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt?: Date;
  updatedAt?: Date;
}

const ticketSchema: Schema<ITicket> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
    },
    description: {
      type: String,
    },
    uploadedUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "RESOLVED"],
      default: "PENDING",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
  },
  { timestamps: true }
);

ticketSchema.pre<ITicket>("save", async function (next) {
  try {
    next();
  } catch (error: any) {
    // Handle any errors that might occur during the pre-save operation
    next(error);
  }
});

const Ticket = mongoose.model<ITicket>("Ticket", ticketSchema);
export default Ticket;