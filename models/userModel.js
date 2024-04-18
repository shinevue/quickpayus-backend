const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { STATUS, DOCUMENT_TYPES } = require("../config/constants");
const HELPER = require("../helpers");

const kycSchema = new mongoose.Schema(
  {
    identification: [
      {
        documentType: {
          type: String,
          enum: Object.values(DOCUMENT_TYPES),
          required: true,
        },
        documentName: { type: String, required: true },
      },
    ],
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    addressLine: {
      type: String,
      required: true,
    },
    // addressLine2: {
    //   type: String,
    // },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: { type: String },
    occupation: { type: String },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.PENDING,
    },
    reason: { type: String, trim: true, minlength: 5, maxlength: 500 },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
const userSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      trim: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
    },
    countryCode: {
      type: String,
      required: [true, "Country Code is required."],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone Number is required."],
    },
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      select: false,
    },
    termsAndConditions: {
      type: Boolean,
      required: [true, "Please Accept Our Terms And Conditions."],
    },
    investmentLevel: {
      type: String,
      required: false,
      default: null,
    },
    investmentSubLevel: {
      type: String,
      required: false,
      default: null,
    },
    kyc: { type: kycSchema },
    profitBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    referralCreditBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    depositBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardBalance: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    isActive: { type: Boolean, default: true },
    alertNotifications: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: false },
    role: { type: String, default: "user" },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

const virtual = userSchema.virtual("id");
virtual.get(function () {
  return this._id;
});
userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.uuid = HELPER.randomUUID();
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};
userSchema.methods.setResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

userSchema.index({ referralId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ uuid: 1 });
userSchema.index({ username: 1 });


const User = mongoose.model('User', userSchema);

module.exports = User;
