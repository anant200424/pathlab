import { z } from "zod";

export const createInventoryItemSchema = z.object({
  itemCode: z.string().min(1).toUpperCase(),
  name: z.string().min(2),
  category: z.string().min(2),
  unit: z.string().min(1),
  minimumThreshold: z.number().min(0).default(10),
  clinicId: z.string().min(1),
  supplierName: z.string().optional(),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const recordMovementSchema = z.object({
  movementType: z.enum(["receipt", "consumption", "adjustment", "disposal"]),
  quantity: z.number().min(0.01),
  lotNumber: z.string().optional(),
  reason: z.string().optional(),
});
