import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVisit extends Document {
  visitNumber: string;
  patientId: Types.ObjectId;
  clinicId: Types.ObjectId;
  referringDoctorId?: Types.ObjectId;
  visitType: "outpatient" | "inpatient" | "home_collection" | "referral";
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const visitSchema = new Schema<IVisit>(
  {
    visitNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    referringDoctorId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorProfile",
    },
    visitType: {
      type: String,
      enum: ["outpatient", "inpatient", "home_collection", "referral"],
      default: "outpatient",
    },
    notes: {
      type: String,
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

visitSchema.index({ patientId: 1, createdAt: -1 });

export const Visit = mongoose.model<IVisit>("Visit", visitSchema);
