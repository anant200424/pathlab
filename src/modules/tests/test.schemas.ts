import { z } from "zod";

const referenceRangeSchema = z.object({
  gender: z.enum(["male", "female", "both"]).default("both"),
  minAgeYears: z.number().optional(),
  maxAgeYears: z.number().optional(),
  normalMin: z.number().optional(),
  normalMax: z.number().optional(),
  criticalLow: z.number().optional(),
  criticalHigh: z.number().optional(),
  textRange: z.string().optional(),
});

const testParameterSchema = z.object({
  parameterCode: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().optional(),
  dataType: z.enum(["numeric", "text", "options"]).default("numeric"),
  options: z.array(z.string()).optional(),
  referenceRanges: z.array(referenceRangeSchema).default([]),
  method: z.string().optional(),
  displayOrder: z.number().default(0),
});

export const createTestDefinitionSchema = z.object({
  testCode: z.string().min(1).toUpperCase(),
  name: z.string().min(1),
  department: z.string().min(1),
  category: z.string().min(1),
  specimenType: z.string().min(1),
  collectionInstructions: z.string().optional(),
  processingRequirements: z.string().optional(),
  turnaroundTimeHours: z.number().min(1).default(24),
  price: z.number().min(0),
  parameters: z
    .array(testParameterSchema)
    .min(1, "At least one parameter is required"),
});

export const updateTestDefinitionSchema = createTestDefinitionSchema.partial();

export const createTestPackageSchema = z.object({
  packageCode: z.string().min(1).toUpperCase(),
  name: z.string().min(1),
  description: z.string().optional(),
  tests: z.array(z.string()).min(1, "At least one test is required in package"),
  price: z.number().min(0),
});

export const updateTestPackageSchema = createTestPackageSchema.partial();
