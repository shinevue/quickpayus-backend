import mongoose from "mongoose";
import config from "../config/constants";

import HELPER from "../helpers";

// Define a base transaction schema
const transactionsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    reason: { type: String, trim: true, required: false },
    status: {
      type: String,
      enum: Object.values(config.STATUS),
      default: config.STATUS.PENDING,
    },
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    originalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    feesAmount: {
      type: Number,
      min: 0,
      default: 0,
      required: false,
    },
    transactionType: {
      type: String,
      enum: Object.values(config.TRANSACTION_TYPES),
      required: true,
    },
    withdrawalType: {
      type: String,
      enum: Object.values(config.WITHDRAWAL_TYPES),
      default: null,
      required: false,
    },
    receiverAddress: {
      type: String,
      default: null,
      required: false,
    },
    senderAddress: {
      type: String,
      default: null,
      required: false,
    },
    uuid: {
      type: String,
      //required: true,
    },
    profit: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
  },
  { timestamps: true }
);

transactionsSchema.methods.detuctFees = function () {
  // Deduct 5% fees
  this.feesAmount = config.DEFAULT_FEE_AMOUNT * this.amount;
  this.originalAmount = this.amount;
  this.amount -= this.feesAmount;
};

// Middleware to deduct fees before saving
transactionsSchema.pre("save", function (next) {
  // Deduct 5% fees
  if (!this.amount) return next();

  this.uuid = HELPER.uuid();

  if (
    [config.TRANSACTION_TYPES.WITHDRAWAL, config.TRANSACTION_TYPES.DEPOSIT].includes(
      this.transactionType
    )
  ) {
    this.feesAmount = config.DEFAULT_FEE_AMOUNT * this.amount;
    this.originalAmount = this.amount;
    this.amount -= this.feesAmount;
  }
  next();
});

transactionsSchema.index({ userId: 1 });
transactionsSchema.index({ status: 1 });
transactionsSchema.index({ transactionType: 1 });
transactionsSchema.index({ uuid: 1 });

const Transaction = mongoose.model<ITransaction>("transactions", transactionsSchema);

export interface ITransaction extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId;
  adminId?: mongoose.Schema.Types.ObjectId;
  reason?: string;
  status: string;
  amount: number;
  originalAmount: number;
  feesAmount?: number;
  transactionType: string;
  withdrawalType?: string;
  receiverAddress?: string;
  senderAddress?: string;
  uuid?: string;
  profit?: mongoose.Schema.Types.Mixed;
  createdAt: string;
  updatedAt: string;
  detuctFees: () => void;
}

export default Transaction;