import mongoose, { Schema, Document } from "mongoose";
import { Permission, SystemRole } from "./role.constants.js";

export interface IRole extends Document {
  name: SystemRole | string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: [
      {
        type: String,
        required: true,
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Role = mongoose.model<IRole>("Role", roleSchema);
