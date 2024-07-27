const mongoose = require("mongoose");
const { STATUS } = require("../config/constants");

const rewardsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.PENDING,
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
      min: 0
    },
    indirectCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isClaimed: {
      type: Boolean,
      default: false,
      require: false,
    },
    reason: { type: String, required: false },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    }
  },

  { timestamps: true }
);

const Reward = mongoose.model("rewards", rewardsSchema);

module.exports = Reward;
