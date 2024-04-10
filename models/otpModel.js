const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
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
    expires: 60,
  },
});

otpSchema.pre("save", async function (next) {
  try {
    // Check if a record with the same userId exists and delete it
    await OTP.findOneAndDelete({ userId: this.userId });

    // Generate a new OTP code
    this.code = Math.floor(100000 + Math.random() * 900000); // 6 digits
    this.createdAt = new Date().toISOString(); // Set the creation time for the new OTP

    // Continue with the save operation
    next();
  } catch (error) {
    // Handle any errors that might occur during the pre-save operation
    next(error);
  }
});

const OTP = mongoose.model("otp", otpSchema);
module.exports = OTP;
