import { z } from "zod";

export const createClinicSchema = z.object({
  clinicCode: z.string().min(2).max(10).toUpperCase(),
  name: z.string().min(2),
  branchCode: z.string().min(1),
  address: z.object({
    line1: z.string().min(2),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(4),
    country: z.string().default("India"),
  }),
  contact: z.object({
    phone: z.string().min(7),
    email: z.string().email(),
    website: z.string().url().optional(),
  }),
  letterheadConfig: z
    .object({
      headerHeight: z.number().min(0).max(300).default(80),
      footerHeight: z.number().min(0).max(200).default(50),
      showLogo: z.boolean().default(true),
      showLetterheadBg: z.boolean().default(false),
      customHeaderText: z.string().optional(),
      customFooterText: z.string().optional(),
    })
    .optional(),
  reportTemplateId: z.string().default("standard_v1"),
  timeZone: z.string().default("Asia/Kolkata"),
});

export const updateClinicSchema = createClinicSchema.partial().extend({
  isActive: z.boolean().optional(),
});
