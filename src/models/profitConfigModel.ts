import mongoose, { Document, Schema } from "mongoose";

// Define an interface for the ProfitConfig document
interface IProfitConfig extends Document {
  userId: string; // String type for userId
  profit: mongoose.Schema.Types.Mixed; // Mixed type for profit
}

// Define the ProfitConfig schema
const ProfitConfigSchema: Schema<IProfitConfig> = new Schema<IProfitConfig>(
  {
    userId: { type: String, required: true }, // Optional: add required if needed
    profit: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Create and export the ProfitConfig model
const ProfitConfig = mongoose.model<IProfitConfig>("ProfitConfig", ProfitConfigSchema);
export default ProfitConfig;