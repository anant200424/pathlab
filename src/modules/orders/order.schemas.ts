import { z } from "zod";

export const createOrderSchema = z
  .object({
    patientId: z.string().min(1, "patientId is required"),
    visitId: z.string().optional(),
    clinicId: z.string().optional(),
    referringDoctorId: z.string().optional(),
    priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
    testIds: z.array(z.string()).default([]),
    packageIds: z.array(z.string()).default([]),
    discountPercent: z.number().min(0).max(100).default(0),
    discountAmount: z.number().min(0).optional(),
    clinicalNotes: z.string().optional(),
    notes: z.string().optional(),
    idempotencyKey: z.string().optional(),
  })
  .refine((data) => data.testIds.length > 0 || data.packageIds.length > 0, {
    message: "Order must contain at least one test or test package",
    path: ["testIds"],
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "draft",
    "registered",
    "awaiting_sample",
    "sample_collected",
    "processing",
    "awaiting_verification",
    "verified",
    "published",
    "cancelled",
  ]),
  note: z.string().optional(),
});
