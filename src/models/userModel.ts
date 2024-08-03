import mongoose, { ObjectId, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/constants';
import { randomUUID } from '../helpers';

interface IKyc {
  _id: ObjectId;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  addressLine: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  occupation?: string;
  status?: keyof typeof config.STATUS;
  reason?: string;
  adminId?: mongoose.Schema.Types.ObjectId;
  documentType: keyof typeof config.DOCUMENT_TYPES;
  images?: { name: string }[];
  documents?: { name: string }[];
}

export interface IUser {
  isModified: any;
  uuid?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  countryCode?: string;
  phoneNumber: string;
  referralId?: mongoose.Schema.Types.ObjectId;
  password: string;
  termsAndConditions: boolean;
  investmentLevel?: string;
  investmentSubLevel?: string;
  kyc?: IKyc;
  profitBalance?: number;
  referralCreditBalance?: number;
  depositBalance?: number;
  rewardBalance?: number;
  isActive?: boolean;
  isEnableMFA?: boolean;
  alertNotifications?: boolean;
  emailNotifications?: boolean;
  role?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  isDeleted?: number;
  isDeletedAt?: Date;
  avatarBg?: string;
  browser?: string;
  os?: string;
  backupCodes?: string[];
  securityQuestion: {
    answer: string;
    question: number;
  };
}

const kycSchema = new Schema<IKyc>(
  {
    // identification: [
    //   {
    //     documentType: {
    //       type: String,
    //       enum: Object.values(DOCUMENT_TYPES),
    //       required: true,
    //     },
    //     documentName: { type: String, required: true },
    //   },
    // ],
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    addressLine: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
      // required: true,
    },
    state: {
      type: String,
      // required: true,
    },
    postalCode: {
      type: String,
      // required: true,
    },
    country: { type: String },
    occupation: { type: String },
    status: {
      type: String,
      enum: Object.values(config.STATUS),
      default: config.STATUS.PENDING,
    },
    reason: { type: String, trim: true, minlength: 5, maxlength: 500 },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    documentType: {
      type: String,
      enum: Object.values(config.DOCUMENT_TYPES),
      required: true,
    },
    images: [
      {
        name: { type: String, required: true },
      },
    ],
    documents: [
      {
        name: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

const userSchema = new Schema<IUser>(
  {
    uuid: {
      type: String,
      trim: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: [true, 'Username is required.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    countryCode: {
      type: String,
      // required: [true, "Country Code is required."],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone Number is required.'],
    },
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      select: false,
    },
    termsAndConditions: {
      type: Boolean,
      required: [true, 'Please Accept Our Terms And Conditions.'],
    },
    investmentLevel: {
      type: String,
      required: false,
      default: 'A',
    },
    investmentSubLevel: {
      type: String,
      required: false,
      default: '1',
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
    isEnableMFA: { type: Boolean, default: true },
    alertNotifications: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: false },
    role: { type: String, default: 'user' },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isDeleted: { type: Number, default: 0 },
    isDeletedAt: { type: Date },
    avatarBg: { type: String },
    browser: { type: String },
    os: { type: String },
    backupCodes: {
      type: [String],
      require: true,
    },
    securityQuestion: {
      type: {
        answer: {
          type: String,
          require: true,
        },
        question: {
          type: Number,
          require: true,
        },
      },
      require: true,
    },
  },
  { timestamps: true },
);

const virtual = userSchema.virtual('id');
virtual.get(function () {
  return this._id;
});
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

userSchema.pre<IUser>('save', async function (next) {
  this.isDeletedAt = new Date();
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.uuid = randomUUID();
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  return bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.compareField = async function (fieldData: {
  [key: string]: any;
}) {
  const [key, value] = Object.entries(fieldData)[0];
  return this[key] === value;
};
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};
userSchema.methods.setResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

userSchema.methods.generateBackupCodes = function () {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 15));
    this.backupCodes.push(bcrypt.hashSync(codes[i], 10));
  }
  return codes;
};

userSchema.index({ referralId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ uuid: 1 });
userSchema.index({ username: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
