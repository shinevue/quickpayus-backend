const mongoose = require("mongoose");
const { Schema } = mongoose;

const RankSchema = new Schema({
  title: { type: String, required: true },
  rewardFrom: { type: Number, required: true },
  rewardTo: { type: Number, required: true },
  requiredSalesFrom: { type: Number, required: true },
  requiredSalesTo: { type: Number, required: true },
  weeklyMeetings: { type: Number, required: true },
  directReferralsRequired: { type: Number, required: true },
});

const Rank = mongoose.model("rank", RankSchema);

module.exports = Rank;
