const mongoose = require("mongoose");
const { STATUS } = require("../config/constants");

const receiverSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      default: "Updated",
    },
    oldAddress: {
      type: String,
    },
    newAddress: {
      type: String,
      required: true,
    },
  },

  { timestamps: true }
);

const Receiver = mongoose.model("receiver", receiverSchema);

module.exports = Receiver;
