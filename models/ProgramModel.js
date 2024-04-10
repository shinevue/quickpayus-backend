const mongoose = require("mongoose");

const { Schema } = mongoose;

// Child schema for the fields below
const ChildSchema = new Schema({
  level: { type: String, required: true },
  investment: { type: Number },
  profitPercentFrom: { type: Number },
  profitPercentTo: { type: Number },
  creditPercentage: { type: Number },
  directReferralsRequired: { type: Number },
});

// Parent schema with a name and an array of child fields
const ProgramSchema = new Schema({
  level: { type: String, required: true },
  data: [ChildSchema], // Array of child fields
});

const Program = mongoose.model("Program", ProgramSchema);

module.exports = Program;
