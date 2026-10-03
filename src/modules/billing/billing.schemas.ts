import { z } from "zod";

export const createInvoiceSchema = z.object({
  orderId: z.string().min(1, "orderId is required"),
  notes: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, "invoiceId is required"),
  amount: z.number().min(0.01, "Payment amount must be greater than zero"),
  paymentMethod: z.enum(["cash", "card", "upi", "net_banking", "wallet"]),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const issueRefundSchema = z.object({
  invoiceId: z.string().min(1, "invoiceId is required"),
  paymentId: z.string().optional(),
  amount: z.number().min(0.01, "Refund amount must be greater than zero"),
  reason: z.string().min(5, "Detailed reason for refund is required"),
  refundMethod: z.string().default("cash"),
});
