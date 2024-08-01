const mongoose = require("mongoose");

// Define the schema
const ProfitConfig = new mongoose.Schema(
  {
    userId: {type: String},
    profit: {
      type: mongoose.Schema.Types.Mixed,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("profitconfig", ProfitConfig);
