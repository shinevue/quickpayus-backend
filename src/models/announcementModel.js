const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ["URGENT", "WARNING", "GENERAL", "IMPORTANT", "UPDATES"],
      default: "GENERAL",
    },
  },
  { timestamps: true }
);

exports.Announcements = mongoose.model("announcements", announcementSchema);
