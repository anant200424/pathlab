import mongoose, { Schema, Document, Types } from "mongoose";

export type DoctorAssetType =
  "parchi" | "letterhead" | "logo" | "signature" | "stamp" | "report_bg";

export interface IDoctorAsset extends Document {
  doctorId: Types.ObjectId;
  assetType: DoctorAssetType;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  isApproved: boolean;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorAssetSchema = new Schema<IDoctorAsset>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorProfile",
      required: true,
      index: true,
    },
    assetType: {
      type: String,
      enum: ["parchi", "letterhead", "logo", "signature", "stamp", "report_bg"],
      required: true,
      index: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSizeBytes: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

doctorAssetSchema.index({ doctorId: 1, assetType: 1, isActive: 1 });

export const DoctorAsset = mongoose.model<IDoctorAsset>(
  "DoctorAsset",
  doctorAssetSchema,
);
