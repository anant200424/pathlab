import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITestPackage extends Document {
  packageCode: string;
  name: string;
  description?: string;
  tests: Types.ObjectId[];
  price: number;
  originalPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const testPackageSchema = new Schema<ITestPackage>(
  {
    packageCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
    },
    tests: [
      {
        type: Schema.Types.ObjectId,
        ref: "TestDefinition",
        required: true,
      },
    ],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const TestPackage = mongoose.model<ITestPackage>(
  "TestPackage",
  testPackageSchema,
);
