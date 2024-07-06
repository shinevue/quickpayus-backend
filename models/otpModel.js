const mongoose = require("mongoose");
const crypto = require('crypto');

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
    const min = Math.pow(10, 5);
    const max = Math.pow(10, 6) - 1;
    // this.code = await randomNumber(min, max) // 6 digits
    const randomBytes = crypto.randomBytes(3);
    this.code = parseInt(randomBytes.toString('hex'), 16).toString().slice(0, 6);
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
