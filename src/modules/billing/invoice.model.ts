import mongoose, { Schema, Document, Types } from "mongoose";

export type InvoiceStatus =
  "unpaid" | "partially_paid" | "paid" | "cancelled" | "refunded";

export interface IInvoiceItem {
  description: string;
  itemType: "test" | "package" | "other";
  itemId?: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  orderId: Types.ObjectId;
  patientId: Types.ObjectId;
  clinicId: Types.ObjectId;
  items: IInvoiceItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  netTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    itemType: {
      type: String,
      enum: ["test", "package", "other"],
      required: true,
    },
    itemId: { type: Schema.Types.ObjectId },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false },
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
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
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    netTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, required: true },
    status: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid", "cancelled", "refunded"],
      default: "unpaid",
      index: true,
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

invoiceSchema.index({ clinicId: 1, createdAt: -1 });
invoiceSchema.index({ patientId: 1, createdAt: -1 });

export const Invoice = mongoose.model<IInvoice>("Invoice", invoiceSchema);
