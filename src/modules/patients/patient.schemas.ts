import { z } from "zod";

export const createPatientSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  dateOfBirth: z
    .string()
    .datetime()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  ageYears: z.number().min(0).max(150).optional(),
  ageMonths: z.number().min(0).max(11).optional(),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().min(7, "Phone number must be at least 7 digits"),
  email: z.string().email().optional().or(z.literal("")),
  address: z
    .object({
      line1: z.string().default(""),
      line2: z.string().optional(),
      city: z.string().default(""),
      state: z.string().default(""),
      postalCode: z.string().optional(),
      country: z.string().default("India"),
    })
    .default({
      line1: "",
      city: "",
      state: "",
      country: "India",
    }),
  emergencyContact: z
    .object({
      name: z.string(),
      relationship: z.string(),
      phone: z.string(),
    })
    .optional(),
  clinicId: z.string().min(1, "clinicId is required"),
  defaultReferringDoctorId: z.string().optional(),
  createInitialVisit: z.boolean().default(true),
  visitType: z
    .enum(["outpatient", "inpatient", "home_collection", "referral"])
    .default("outpatient"),
  visitNotes: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema
  .partial()
  .omit({ clinicId: true });
