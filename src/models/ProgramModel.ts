import mongoose, { Document, Schema } from "mongoose";

// Define an interface for the Child schema
interface IChild extends Document {
  level: string; // Required field
  investment?: number; // Optional field
  profitPercentFrom?: number; // Optional field
  profitPercentTo?: number; // Optional field
  creditPercentage?: number; // Optional field
  directReferralsRequired?: number; // Optional field
}

// Define an interface for the Program schema
interface IProgram extends Document {
  level: string; // Required field
  data: IChild[]; // Array of child fields
}

// Child schema for the fields below
const ChildSchema: Schema<IChild> = new Schema<IChild>({
  level: { type: String, required: true },
  investment: { type: Number },
  profitPercentFrom: { type: Number },
  profitPercentTo: { type: Number },
  creditPercentage: { type: Number },
  directReferralsRequired: { type: Number },
});

// Parent schema with a name and an array of child fields
const ProgramSchema: Schema<IProgram> = new Schema<IProgram>({
  level: { type: String, required: true },
  data: [ChildSchema], // Array of child fields
});

// Create and export the Program model
const Program = mongoose.model<IProgram>("Program", ProgramSchema);
export default Program;