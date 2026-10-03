import mongoose, { Schema, Document } from "mongoose";

export interface ILetterheadConfig {
  headerHeight: number;
  footerHeight: number;
  showLogo: boolean;
  showLetterheadBg: boolean;
  letterheadBgKey?: string;
  customHeaderText?: string;
  customFooterText?: string;
}

export interface IClinic extends Document {
  clinicCode: string;
  name: string;
  branchCode: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  logoKey?: string;
  logoUrl?: string;
  letterheadConfig: ILetterheadConfig;
  reportTemplateId: string;
  timeZone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clinicSchema = new Schema<IClinic>(
  {
    clinicCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    branchCode: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      website: { type: String },
    },
    logoKey: { type: String },
    logoUrl: { type: String },
    letterheadConfig: {
      headerHeight: { type: Number, default: 80 },
      footerHeight: { type: Number, default: 50 },
      showLogo: { type: Boolean, default: true },
      showLetterheadBg: { type: Boolean, default: false },
      letterheadBgKey: { type: String },
      customHeaderText: { type: String },
      customFooterText: { type: String },
    },
    reportTemplateId: {
      type: String,
      default: "standard_v1",
    },
    timeZone: {
      type: String,
      default: "Asia/Kolkata",
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

clinicSchema.index({ clinicCode: 1 });
clinicSchema.index({ isActive: 1 });

export const Clinic = mongoose.model<IClinic>("Clinic", clinicSchema);
