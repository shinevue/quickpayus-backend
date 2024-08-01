const mongoose = require("mongoose");
const crypto = require("crypto");

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
  ip: {
    type: String,
    require: true,
  }

});

otpSchema.pre("save", async function (next) {
  try {
    // Check if a record with the same userId exists and delete it
    await OTP.findOneAndDelete({ userId: this.userId });
    const allOtp = await OTP.find({});
    // Generate a new OTP code
    const isUnique = true;
    let otp = "";
    do {
      const min = Math.pow(10, 5);
      const max = Math.pow(10, 6) - 1;
      const randomBytes = crypto.randomBytes(2);
      const randomNumber = parseInt(randomBytes.toString('hex'), 16);
      const otpCandidate = min + (randomNumber % (max - min + 1));

      allOtp.forEach(otpDoc => {
        if (otpDoc.code === otpCandidate) {
          isUnique = false;
          return;
        }
      })
      if (isUnique) otp = otpCandidate;
    } while (!isUnique)
    console.log(otp)
    this.code = otp;
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
