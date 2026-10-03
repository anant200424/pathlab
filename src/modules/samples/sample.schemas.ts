import { z } from "zod";

export const collectSampleSchema = z.object({
  notes: z.string().optional(),
});

export const acceptSampleSchema = z.object({
  notes: z.string().optional(),
});

export const rejectSampleSchema = z.object({
  rejectionReason: z.string().min(3, "Rejection reason is required"),
});

export const recollectSampleSchema = z.object({
  recollectionReason: z.string().min(3, "Recollection reason is required"),
});
