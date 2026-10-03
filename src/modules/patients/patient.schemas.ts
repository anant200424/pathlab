import { z } from "zod";

export const basePatientSchema = z.object({
  fullName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
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
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""])
    .optional(),
  address: z
    .object({
      line1: z.string().default(""),
      street: z.string().optional(),
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
  clinicId: z.string().optional(),
  defaultReferringDoctorId: z.string().optional(),
  createInitialVisit: z.boolean().default(true),
  visitType: z
    .enum(["outpatient", "inpatient", "home_collection", "referral"])
    .default("outpatient"),
  visitNotes: z.string().optional(),
});

export const createPatientSchema = z.preprocess((val: any) => {
  if (typeof val === "object" && val !== null) {
    const raw = { ...val };
    if (!raw.fullName && (raw.firstName || raw.lastName)) {
      raw.fullName = `${raw.firstName || ""} ${raw.lastName || ""}`.trim();
    }
    if (raw.address && typeof raw.address === "object") {
      raw.address = {
        ...raw.address,
        line1: raw.address.line1 || raw.address.street || "",
      };
    }
    return raw;
  }
  return val;
}, basePatientSchema.superRefine((data, ctx) => {
  if (!data.fullName || data.fullName.trim().length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Full name is required and must be at least 2 characters",
      path: ["fullName"],
    });
  }
}));

export const updatePatientSchema = z.preprocess((val: any) => {
  if (typeof val === "object" && val !== null) {
    const raw = { ...val };
    if (!raw.fullName && (raw.firstName || raw.lastName)) {
      raw.fullName = `${raw.firstName || ""} ${raw.lastName || ""}`.trim();
    }
    if (raw.address && typeof raw.address === "object") {
      raw.address = {
        ...raw.address,
        line1: raw.address.line1 || raw.address.street || "",
      };
    }
    return raw;
  }
  return val;
}, basePatientSchema.partial().omit({ clinicId: true }));
