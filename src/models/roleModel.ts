import mongoose from "mongoose";

interface IRole extends mongoose.Document {
  roleName: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new mongoose.Schema<IRole>(
  {
    roleName: {
      type: String,
      unique: true,
      trim: true,
    },
    permissions: {
      type: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IRole>("roles", roleSchema);