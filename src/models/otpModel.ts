import mongoose, { Document, Schema } from "mongoose";
import crypto from "crypto";

// Define an interface for the OTP document
interface IOTP extends Document {
  userId: mongoose.Types.ObjectId; // Use ObjectId type for userId
  code?: string; // Optional field
  createdAt?: Date; // Optional field
  ip: string; // Required field
}

// Define the OTP schema
const otpSchema: Schema<IOTP> = new Schema<IOTP>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: {
    type: String,
  },
  createdAt: {
    type: Date,
    expires: 60, // Automatically delete after 60 seconds
  },
  ip: {
    type: String,
    required: true,
  },
});

// Pre-save middleware
otpSchema.pre<IOTP>("save", async function (next) {
  try {
    // Check if a record with the same userId exists and delete it
    await OTP.findOneAndDelete({ userId: this.userId });

    // Generate a new OTP code
    let otp = "";
    let isUnique = false;

    do {
      const min = Math.pow(10, 5);
      const max = Math.pow(10, 6) - 1;
      const randomBytes = crypto.randomBytes(2);
      const randomNumber = parseInt(randomBytes.toString('hex'), 16);
      const otpCandidate = min + (randomNumber % (max - min + 1));

      // Check if the OTP candidate is unique
      const existingOtp = await OTP.findOne({ code: otpCandidate });
      if (!existingOtp) {
        otp = otpCandidate.toString();
        isUnique = true;
      }
    } while (!isUnique);

    console.log(otp);
    this.code = otp;
    this.createdAt = new Date(); // Set the creation time for the new OTP

    // Continue with the save operation
    next();
  } catch (error: any) {
    // Handle any errors that might occur during the pre-save operation
    next(error);
  }
});

// Create the OTP model
const OTP = mongoose.model<IOTP>("OTP", otpSchema);

// Export the OTP model
export default OTP;