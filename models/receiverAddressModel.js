const mongoose = require("mongoose");
const { STATUS } = require("../config/constants");

const rewardsSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      default: "Updated",
    },
    oldAddress: {
      type: String,
      required: false
    },
    newAddress: {
      type: String,
      required: false
    },
  },

  { timestamps: true }
);

const Reward = mongoose.model("rewards", rewardsSchema);

module.exports = Reward;
