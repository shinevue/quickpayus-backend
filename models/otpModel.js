const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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
    
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    bcrypt.hash(result, bcrypt.genSaltSync(10), (err, hash) => {
      this.code = hash.toString().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    })

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
