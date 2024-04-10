const mongoose = require("mongoose");
const {
  STATUS,
  TRANSACTION_TYPES,
  WITHDRAWAL_TYPES,
  DEFAULT_FEE_AMOUNT,
} = require("../config/constants");

const HELPER = require("../helpers");

// Define a base transaction schema
const transactionsSchema = mongoose.Schema(
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
      enum: Object.values(STATUS),
      default: STATUS.PENDING,
      required: true,
    },
    amount: {
      required: true,
      type: Number,
      min: 0,
      default: 0,
    },
    originalAmount: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },
    feesAmount: {
      type: Number,
      min: 0,
      default: 0,
      required: false,
    },
    transactionType: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },
    withdrawalType: {
      type: String,
      enum: Object.values(WITHDRAWAL_TYPES),
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
  this.feesAmount = DEFAULT_FEE_AMOUNT * this.amount;
  this.originalAmount = this.amount;
  this.amount -= this.feesAmount;
};

// Middleware to deduct fees before saving
transactionsSchema.pre("save", function (next) {
  // Deduct 5% fees
  if (!this.amount) return next();

  this.uuid = HELPER.uuid();

  if (
    [TRANSACTION_TYPES.WITHDRAWAL, TRANSACTION_TYPES.DEPOSIT].includes(
      this.transactionType
    )
  ) {
    this.feesAmount = DEFAULT_FEE_AMOUNT * this.amount;
    this.originalAmount = this.amount;
    this.amount -= this.feesAmount;
  }
  next();
});

transactionsSchema.index({ userId: 1 });
transactionsSchema.index({ status: 1 });
transactionsSchema.index({ transactionType: 1 });
transactionsSchema.index({ uuid: 1 });

const Transaction = mongoose.model("transactions", transactionsSchema);

module.exports = Transaction;
