import mongoose from "mongoose";
import config from "../config/constants";

export interface IReward extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId;
  status: string;
  rankId: mongoose.Schema.Types.ObjectId | null;
  amount: number;
  sales: number;
  directCount: number;
  indirectCount: number;
  isClaimed: boolean;
  reason: string | null;
  adminId: mongoose.Schema.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const rewardsSchema = new mongoose.Schema<IReward>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(config.STATUS),
      default: config.STATUS.PENDING,
    },
    rankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rank",
    },
    amount: {
      required: false,
      type: Number,
      default: 0,
      min: 0,
    },
    sales: {
      required: false,
      type: Number,
      default: 0,
      min: 0,
    },
    directCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    indirectCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isClaimed: {
      type: Boolean,
      default: false,
      required: false,
    },
    reason: { type: String, required: false },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

const Reward = mongoose.model<IReward>("rewards", rewardsSchema);

export default Reward;