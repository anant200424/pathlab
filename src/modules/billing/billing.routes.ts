import { Router } from "express";
import { BillingController } from "./billing.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { validateRequest } from "../../common/middleware/validation.middleware.js";
import {
  createInvoiceSchema,
  recordPaymentSchema,
  issueRefundSchema,
} from "./billing.schemas.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

router.post(
  "/invoices",
  requirePermissions(PERMISSIONS.BILLING_MANAGE),
  validateRequest({ body: createInvoiceSchema }),
  BillingController.createInvoiceForOrder,
);

router.get(
  "/invoices/:id",
  requirePermissions(PERMISSIONS.BILLING_READ),
  BillingController.getInvoiceById,
);
router.get(
  "/invoices/:invoiceId/payments",
  requirePermissions(PERMISSIONS.BILLING_READ),
  BillingController.getPaymentsForInvoice,
);

router.post(
  "/payments",
  requirePermissions(PERMISSIONS.BILLING_MANAGE),
  validateRequest({ body: recordPaymentSchema }),
  BillingController.recordPayment,
);

router.post(
  "/refunds",
  requirePermissions(PERMISSIONS.REFUNDS_ISSUE),
  validateRequest({ body: issueRefundSchema }),
  BillingController.issueRefund,
);

router.get(
  "/daily-collections",
  requirePermissions(PERMISSIONS.BILLING_READ),
  BillingController.getDailyCollections,
);

export const billingRoutes = router;
