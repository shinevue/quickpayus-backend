const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, minlength: 1 },
    title: { type: String, required: true, minlength: 1 },
    message: { type: String, required: true, minlength: 1 },
    isRead: { type: Boolean, default: false },
    adminCreated: { type: Boolean, default: false },
    type: { type: String, default: "GERNERAL" },
    link: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1 }, { expireAfterSeconds: 259200 });

exports.Notification = mongoose.model("Notification", notificationSchema);
