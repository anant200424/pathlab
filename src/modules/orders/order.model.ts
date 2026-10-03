import mongoose, { Schema, Document, Types } from "mongoose";

export type OrderStatus =
  | "draft"
  | "registered"
  | "awaiting_sample"
  | "sample_collected"
  | "processing"
  | "awaiting_verification"
  | "verified"
  | "published"
  | "cancelled";

export interface IOrderedTestItem {
  testId: Types.ObjectId;
  testCode: string;
  name: string;
  price: number;
  specimenType: string;
  status: "pending" | "processing" | "completed" | "cancelled";
}

export interface IOrderedPackageItem {
  packageId: Types.ObjectId;
  packageCode: string;
  name: string;
  price: number;
}

export interface ITestOrder extends Document {
  orderId: string;
  orderBarcode: string;
  patientId: Types.ObjectId;
  visitId: Types.ObjectId;
  clinicId: Types.ObjectId;
  referringDoctorId: Types.ObjectId;
  verifyingDoctorId?: Types.ObjectId;
  status: OrderStatus;
  priority: "routine" | "urgent" | "stat";
  tests: IOrderedTestItem[];
  packages: IOrderedPackageItem[];
  pricing: {
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    netTotal: number;
    paidAmount: number;
    balanceDue: number;
    invoiceId?: Types.ObjectId;
  };
  clinicalNotes?: string;
  idempotencyKey?: string;
  statusHistory: Array<{
    status: OrderStatus;
    changedBy?: Types.ObjectId;
    changedAt: Date;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const orderedTestItemSchema = new Schema<IOrderedTestItem>(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: "TestDefinition",
      required: true,
    },
    testCode: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    specimenType: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    },
  },
  { _id: false },
);

const orderedPackageItemSchema = new Schema<IOrderedPackageItem>(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "TestPackage",
      required: true,
    },
    packageCode: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false },
);

const testOrderSchema = new Schema<ITestOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    orderBarcode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    visitId: {
      type: Schema.Types.ObjectId,
      ref: "Visit",
      required: true,
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
      required: true,
      index: true,
    },
    verifyingDoctorId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorProfile",
    },
    status: {
      type: String,
      enum: [
        "draft",
        "registered",
        "awaiting_sample",
        "sample_collected",
        "processing",
        "awaiting_verification",
        "verified",
        "published",
        "cancelled",
      ],
      default: "awaiting_sample",
      index: true,
    },
    priority: {
      type: String,
      enum: ["routine", "urgent", "stat"],
      default: "routine",
    },
    tests: [orderedTestItemSchema],
    packages: [orderedPackageItemSchema],
    pricing: {
      subtotal: { type: Number, required: true },
      discountPercent: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      netTotal: { type: Number, required: true },
      paidAmount: { type: Number, default: 0 },
      balanceDue: { type: Number, required: true },
      invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    },
    clinicalNotes: { type: String },
    idempotencyKey: { type: String, unique: true, sparse: true },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  },
);

testOrderSchema.index({ clinicId: 1, status: 1, createdAt: -1 });
testOrderSchema.index({ patientId: 1, createdAt: -1 });

export const TestOrder = mongoose.model<ITestOrder>(
  "TestOrder",
  testOrderSchema,
);
