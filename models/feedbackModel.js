const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fbCnt: {
            type: String,
        },
        uploadedUrl: {
            type: String,
        }     
    },
    { timestamps: true }
);

feedbackSchema.pre("save", async function (next) {
  try {
    next();
  } catch (error) {
    // Handle any errors that might occur during the pre-save operation
    next(error);
  }
});

const FeedBack = mongoose.model("feedback", feedbackSchema);
module.exports = FeedBack;
