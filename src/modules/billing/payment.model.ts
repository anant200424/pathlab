import mongoose, { Schema, Document, Types } from "mongoose";

export type PaymentMethod = "cash" | "card" | "upi" | "net_banking" | "wallet";

export interface IPayment extends Document {
  receiptNumber: string;
  invoiceId: Types.ObjectId;
  orderId: Types.ObjectId;
  patientId: Types.ObjectId;
  clinicId: Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  notes?: string;
  receivedBy: Types.ObjectId;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    receiptNumber: {
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
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "net_banking", "wallet"],
      required: true,
    },
    transactionReference: { type: String },
    notes: { type: String },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ clinicId: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
