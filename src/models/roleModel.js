const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      unique: true,
      trim: true,
    },
    permissions: {
      type: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("roles", roleSchema)