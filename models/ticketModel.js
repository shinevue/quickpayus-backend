const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
    },
    description: {
      type: String,
    },
    uploadedUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "RESOLVED"],
    }
  },
  { timestamps: true }
);

ticketSchema.pre("save", async function (next) {
  try {
    next();
  } catch (error) {
    // Handle any errors that might occur during the pre-save operation
    next(error);
  }
});

const Ticket = mongoose.model("ticket", ticketSchema);
module.exports = Ticket;
