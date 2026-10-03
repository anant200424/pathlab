import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  clinics: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  roles: z.array(z.string()).optional(),
  clinics: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});
