import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPatient extends Document {
  patientId: string;
  registrationNumber: string;
  fullName: string;
  dateOfBirth?: Date;
  ageYears?: number;
  ageMonths?: number;
  gender: "male" | "female" | "other";
  phone: string;
  email?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  clinicId: Types.ObjectId;
  defaultReferringDoctorId?: Types.ObjectId;
  consentAcknowledged: boolean;
  consentDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
    },
    ageYears: {
      type: Number,
      min: 0,
      max: 150,
    },
    ageMonths: {
      type: Number,
      min: 0,
      max: 11,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      line1: { type: String, default: "" },
      line2: { type: String },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String },
      country: { type: String, default: "India" },
    },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    defaultReferringDoctorId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorProfile",
    },
    consentAcknowledged: {
      type: Boolean,
      default: true,
    },
    consentDate: {
      type: Date,
      default: Date.now,
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

patientSchema.index({ phone: 1, clinicId: 1 });
patientSchema.index({ fullName: 1, phone: 1 });
patientSchema.index({ clinicId: 1, createdAt: -1 });

export const Patient = mongoose.model<IPatient>("Patient", patientSchema);
