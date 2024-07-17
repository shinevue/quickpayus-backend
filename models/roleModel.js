const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      unique: true,
      trim: true,
    },
    permission: {
      type: [String],
      enum: [
        "Create User",
        "Edit User",
        "Delete User",
        "View Dashboard",
        "Manage Content",
      ],
    },
  },
  { timestamps: true }
);

const Role = mongoose.model("role", roleSchema);

module.exports = Role;
