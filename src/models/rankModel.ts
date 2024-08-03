import mongoose, { Schema, Document } from "mongoose";

interface RankInterface extends Document {
  title: string;
  rewardFrom: number;
  rewardTo: number;
  requiredSalesFrom: number;
  requiredSalesTo: number;
  weeklyMeetings: number;
  directReferralsRequired: number;
}

const RankSchema: Schema<RankInterface> = new Schema({
  title: { type: String, required: true },
  rewardFrom: { type: Number, required: true },
  rewardTo: { type: Number, required: true },
  requiredSalesFrom: { type: Number, required: true },
  requiredSalesTo: { type: Number, required: true },
  weeklyMeetings: { type: Number, required: true },
  directReferralsRequired: { type: Number, required: true },
});

const Rank = mongoose.model<RankInterface>("rank", RankSchema);

export default Rank;