import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDoctorProfile extends Document {
  doctorId: string;
  userId?: Types.ObjectId;
  fullName: string;
  qualification: string;
  specialization?: string;
  medicalRegistrationNumber: string;
  contact: {
    phone: string;
    email?: string;
  };
  associatedClinics: Types.ObjectId[];
  isReferringDoctor: boolean;
  isVerifyingDoctor: boolean;
  signatureAssetId?: Types.ObjectId;
  stampAssetId?: Types.ObjectId;
  logoAssetId?: Types.ObjectId;
  letterheadAssetId?: Types.ObjectId;
  parchiAssetId?: Types.ObjectId;
  reportFooterText?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorProfileSchema = new Schema<IDoctorProfile>(
  {
    doctorId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    medicalRegistrationNumber: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String },
    },
    associatedClinics: [
      {
        type: Schema.Types.ObjectId,
        ref: "Clinic",
        required: true,
        index: true,
      },
    ],
    isReferringDoctor: {
      type: Boolean,
      default: true,
    },
    isVerifyingDoctor: {
      type: Boolean,
      default: false,
      index: true,
    },
    signatureAssetId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorAsset",
    },
    stampAssetId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorAsset",
    },
    logoAssetId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorAsset",
    },
    letterheadAssetId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorAsset",
    },
    parchiAssetId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorAsset",
    },
    reportFooterText: {
      type: String,
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

doctorProfileSchema.index({ associatedClinics: 1, isActive: 1 });
doctorProfileSchema.index({ isVerifyingDoctor: 1, isActive: 1 });

export const DoctorProfile = mongoose.model<IDoctorProfile>(
  "DoctorProfile",
  doctorProfileSchema,
);
