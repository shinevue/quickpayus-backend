import mongoose, { Document, Schema } from "mongoose";

// Define an interface for the Feedback document
interface IFeedback extends Document {
  userId: mongoose.Types.ObjectId; // Use ObjectId type for userId
  fbCnt?: string; // Optional field
  uploadedUrl?: string; // Optional field
  rating: number; // Required field
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the feedback schema
const feedbackSchema: Schema = new Schema<IFeedback>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fbCnt: {
      type: String,
    },
    uploadedUrl: {
      type: String,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      required: true, // Fixed the typo from 'require' to 'required'
    },
  },
  { timestamps: true }
);

// Pre-save middleware
feedbackSchema.pre<IFeedback>("save", async function (next) {
  try {
    next();
  } catch (error: any) {
    // Handle any errors that might occur during the pre-save operation
    next(error);
  }
});

// Create the Feedback model
const FeedBack = mongoose.model<IFeedback>("Feedback", feedbackSchema);

// Export the Feedback model
export default FeedBack;