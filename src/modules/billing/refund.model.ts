import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRefund extends Document {
  refundNumber: string;
  invoiceId: Types.ObjectId;
  paymentId?: Types.ObjectId;
  orderId: Types.ObjectId;
  patientId: Types.ObjectId;
  clinicId: Types.ObjectId;
  amount: number;
  reason: string;
  refundMethod: string;
  approvedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    refundNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "TestOrder",
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    reason: {
      type: String,
      required: true,
    },
    refundMethod: {
      type: String,
      default: "cash",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Refund = mongoose.model<IRefund>("Refund", refundSchema);
