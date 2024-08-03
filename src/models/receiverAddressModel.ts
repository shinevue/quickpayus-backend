import mongoose, { Document, Schema } from "mongoose";

// Define an interface for the Receiver document
interface IReceiver extends Document {
  adminId: string;
  action?: string; // Optional since it has a default value
  oldAddress?: string; // Optional since it can be undefined
  newAddress: string;
}

// Define the receiver schema
const receiverSchema: Schema = new Schema(
  {
    adminId: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      default: "Updated",
    },
    oldAddress: {
      type: String,
    },
    newAddress: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Create the Receiver model
const Receiver = mongoose.model<IReceiver>("Receiver", receiverSchema);

// Export the Receiver model
export default Receiver;