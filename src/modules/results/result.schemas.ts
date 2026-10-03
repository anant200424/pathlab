import { z } from "zod";

const parameterValueSchema = z.object({
  parameterCode: z.string().min(1),
  value: z.string(),
});

export const enterResultSchema = z.object({
  parameterValues: z
    .array(parameterValueSchema)
    .min(1, "At least one parameter value is required"),
  remarks: z.string().optional(),
});

export const verifyResultSchema = z.object({
  verifyingDoctorId: z.string().min(1, "verifyingDoctorId is required"),
});

export const rejectResultSchema = z.object({
  rejectionReason: z.string().min(3, "Rejection reason is required"),
});

export const amendResultSchema = z.object({
  parameterValues: z.array(parameterValueSchema).min(1),
  remarks: z.string().optional(),
  reason: z
    .string()
    .min(5, "Detailed reason for clinical amendment is required"),
});
