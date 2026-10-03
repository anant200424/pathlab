import mongoose, { Schema, Document, Types } from "mongoose";

export type SampleStatus =
  "pending" | "collected" | "accepted" | "rejected" | "recollected";

export interface ISample extends Document {
  sampleBarcode: string;
  orderId: Types.ObjectId;
  patientId: Types.ObjectId;
  clinicId: Types.ObjectId;
  specimenType: string;
  status: SampleStatus;
  collectedBy?: Types.ObjectId;
  collectedAt?: Date;
  receivedBy?: Types.ObjectId;
  receivedAt?: Date;
  rejectionReason?: string;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  recollectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sampleSchema = new Schema<ISample>(
  {
    sampleBarcode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "TestOrder",
      required: true,
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
    specimenType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "collected", "accepted", "rejected", "recollected"],
      default: "pending",
      index: true,
    },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    collectedAt: {
      type: Date,
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    receivedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    recollectionReason: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

sampleSchema.index({ orderId: 1, status: 1 });
sampleSchema.index({ clinicId: 1, status: 1 });

export const Sample = mongoose.model<ISample>("Sample", sampleSchema);
