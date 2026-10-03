import mongoose, { Schema, Document, Types } from "mongoose";

export type ResultFlag =
  | "normal"
  | "abnormal_low"
  | "abnormal_high"
  | "critical_low"
  | "critical_high";
export type ResultStatus =
  "draft" | "pending_verification" | "verified" | "rejected" | "amended";

export interface IParameterResult {
  parameterCode: string;
  name: string;
  value: string;
  numericValue?: number;
  unit?: string;
  referenceRangeText: string;
  flag: ResultFlag;
  method?: string;
}

export interface IResultRevision {
  version: number;
  parameterResults: IParameterResult[];
  remarks?: string;
  amendedBy: Types.ObjectId;
  amendedAt: Date;
  reason: string;
}

export interface ITestResult extends Document {
  orderId: Types.ObjectId;
  testId: Types.ObjectId;
  patientId: Types.ObjectId;
  clinicId: Types.ObjectId;
  status: ResultStatus;
  parameterResults: IParameterResult[];
  remarks?: string;
  enteredBy?: Types.ObjectId;
  enteredAt?: Date;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  revisions: IResultRevision[];
  createdAt: Date;
  updatedAt: Date;
}

const parameterResultSchema = new Schema<IParameterResult>(
  {
    parameterCode: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: String, default: "" },
    numericValue: { type: Number },
    unit: { type: String },
    referenceRangeText: { type: String, default: "" },
    flag: {
      type: String,
      enum: [
        "normal",
        "abnormal_low",
        "abnormal_high",
        "critical_low",
        "critical_high",
      ],
      default: "normal",
    },
    method: { type: String },
  },
  { _id: false },
);

const resultRevisionSchema = new Schema<IResultRevision>(
  {
    version: { type: Number, required: true },
    parameterResults: [parameterResultSchema],
    remarks: { type: String },
    amendedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amendedAt: { type: Date, default: Date.now },
    reason: { type: String, required: true },
  },
  { _id: false },
);

const testResultSchema = new Schema<ITestResult>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "TestOrder",
      required: true,
      index: true,
    },
    testId: {
      type: Schema.Types.ObjectId,
      ref: "TestDefinition",
      required: true,
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
    },
    status: {
      type: String,
      enum: [
        "draft",
        "pending_verification",
        "verified",
        "rejected",
        "amended",
      ],
      default: "draft",
      index: true,
    },
    parameterResults: [parameterResultSchema],
    remarks: { type: String },
    enteredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    enteredAt: { type: Date },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "DoctorProfile",
    },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    revisions: [resultRevisionSchema],
  },
  {
    timestamps: true,
  },
);

testResultSchema.index({ orderId: 1, testId: 1 }, { unique: true });

export const TestResult = mongoose.model<ITestResult>(
  "TestResult",
  testResultSchema,
);
