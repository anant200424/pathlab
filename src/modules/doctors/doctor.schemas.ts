import { z } from "zod";

export const createDoctorSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  qualification: z
    .string()
    .min(2, "Qualification is required (e.g. MBBS, MD Path)"),
  specialization: z.string().optional(),
  medicalRegistrationNumber: z
    .string()
    .min(3, "Medical registration number is required"),
  contact: z.object({
    phone: z.string().min(7),
    email: z.string().email().optional(),
  }),
  associatedClinics: z
    .array(z.string())
    .min(1, "Doctor must be associated with at least one clinic"),
  isReferringDoctor: z.boolean().default(true),
  isVerifyingDoctor: z.boolean().default(false),
  reportFooterText: z.string().optional(),
});

export const updateDoctorSchema = createDoctorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const approveAssetSchema = z.object({
  approved: z.boolean(),
});
