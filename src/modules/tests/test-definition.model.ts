import mongoose, { Schema, Document } from "mongoose";

export interface IReferenceRange {
  gender: "male" | "female" | "both";
  minAgeYears?: number;
  maxAgeYears?: number;
  normalMin?: number;
  normalMax?: number;
  criticalLow?: number;
  criticalHigh?: number;
  textRange?: string; // e.g. "Negative", "< 1.0 Normal", "Non-Reactive"
}

export interface ITestParameter {
  parameterCode: string;
  name: string;
  unit?: string;
  dataType: "numeric" | "text" | "options";
  options?: string[]; // e.g. ["Negative", "Positive", "Equivocal"]
  referenceRanges: IReferenceRange[];
  method?: string;
  displayOrder: number;
}

export interface ITestDefinition extends Document {
  testCode: string;
  name: string;
  department: string; // e.g. Hematology, Biochemistry, Serology, Microbiology
  category: string;
  specimenType: string; // e.g. EDTA Whole Blood, Serum, Plasma, Urine
  collectionInstructions?: string;
  processingRequirements?: string;
  turnaroundTimeHours: number;
  price: number;
  parameters: ITestParameter[];
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const referenceRangeSchema = new Schema<IReferenceRange>(
  {
    gender: {
      type: String,
      enum: ["male", "female", "both"],
      default: "both",
    },
    minAgeYears: { type: Number },
    maxAgeYears: { type: Number },
    normalMin: { type: Number },
    normalMax: { type: Number },
    criticalLow: { type: Number },
    criticalHigh: { type: Number },
    textRange: { type: String },
  },
  { _id: false },
);

const testParameterSchema = new Schema<ITestParameter>(
  {
    parameterCode: { type: String, required: true },
    name: { type: String, required: true },
    unit: { type: String },
    dataType: {
      type: String,
      enum: ["numeric", "text", "options"],
      default: "numeric",
    },
    options: [{ type: String }],
    referenceRanges: [referenceRangeSchema],
    method: { type: String },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const testDefinitionSchema = new Schema<ITestDefinition>(
  {
    testCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    specimenType: {
      type: String,
      required: true,
      trim: true,
    },
    collectionInstructions: { type: String },
    processingRequirements: { type: String },
    turnaroundTimeHours: {
      type: Number,
      required: true,
      default: 24,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    parameters: [testParameterSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

testDefinitionSchema.index({ department: 1, isActive: 1 });
testDefinitionSchema.index({ testCode: 1 });

export const TestDefinition = mongoose.model<ITestDefinition>(
  "TestDefinition",
  testDefinitionSchema,
);
