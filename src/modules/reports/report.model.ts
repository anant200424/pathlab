import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBrandingSnapshot {
  clinicName: string;
  clinicCode: string;
  branchCode: string;
  addressText: string;
  contactText: string;
  logoStorageKey?: string;
  letterheadBgStorageKey?: string;
  headerHeight: number;
  footerHeight: number;
  showLogo: boolean;
  customHeaderText?: string;
  customFooterText?: string;
}

export interface ISignerSnapshot {
  doctorId: string;
  doctorName: string;
  qualification: string;
  specialization?: string;
  medicalRegistrationNumber: string;
  signatureStorageKey?: string;
  stampStorageKey?: string;
  reportFooterText?: string;
}

export interface IReportVersion {
  version: number;
  storageKeyPdf: string;
  storageKeyDocx?: string;
  brandingSnapshot: IBrandingSnapshot;
  signerSnapshot: ISignerSnapshot;
  testResultsSnapshot: any[];
  publishedAt: Date;
  publishedBy: Types.ObjectId;
  changeReason?: string;
}

export interface IReport extends Document {
  reportId: string;
  orderId: Types.ObjectId;
  patientId: Types.ObjectId;
  clinicId: Types.ObjectId;
  verifyingDoctorId: Types.ObjectId;
  status: "draft" | "published" | "amended";
  currentVersion: number;
  storageKeyPdf: string;
  storageKeyDocx?: string;
  brandingSnapshot: IBrandingSnapshot;
  signerSnapshot: ISignerSnapshot;
  testResultsSnapshot: any[];
  versions: IReportVersion[];
  publishedAt?: Date;
  publishedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const brandingSnapshotSchema = new Schema<IBrandingSnapshot>(
  {
    clinicName: { type: String, required: true },
    clinicCode: { type: String, required: true },
    branchCode: { type: String, required: true },
    addressText: { type: String, required: true },
    contactText: { type: String, required: true },
    logoStorageKey: { type: String },
    letterheadBgStorageKey: { type: String },
    headerHeight: { type: Number, default: 80 },
    footerHeight: { type: Number, default: 50 },
    showLogo: { type: Boolean, default: true },
    customHeaderText: { type: String },
    customFooterText: { type: String },
  },
  { _id: false },
);

const signerSnapshotSchema = new Schema<ISignerSnapshot>(
  {
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    qualification: { type: String, required: true },
    specialization: { type: String },
    medicalRegistrationNumber: { type: String, required: true },
    signatureStorageKey: { type: String },
    stampStorageKey: { type: String },
    reportFooterText: { type: String },
  },
  { _id: false },
);

const reportVersionSchema = new Schema<IReportVersion>(
  {
    version: { type: Number, required: true },
    storageKeyPdf: { type: String, required: true },
    storageKeyDocx: { type: String },
    brandingSnapshot: brandingSnapshotSchema,
    signerSnapshot: signerSnapshotSchema,
    testResultsSnapshot: [{ type: Schema.Types.Mixed }],
    publishedAt: { type: Date, default: Date.now },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changeReason: { type: String },
  },
  { _id: false },
);

const reportSchema = new Schema<IReport>(
  {
    reportId: {
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
      unique: true,
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
    verifyingDoctorId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorProfile",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "amended"],
      default: "draft",
      index: true,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    storageKeyPdf: {
      type: String,
      required: true,
    },
    storageKeyDocx: {
      type: String,
    },
    brandingSnapshot: brandingSnapshotSchema,
    signerSnapshot: signerSnapshotSchema,
    testResultsSnapshot: [{ type: Schema.Types.Mixed }],
    versions: [reportVersionSchema],
    publishedAt: {
      type: Date,
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

reportSchema.index({ patientId: 1, status: 1 });
reportSchema.index({ clinicId: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>("Report", reportSchema);
