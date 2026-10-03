import { Router } from "express";
import { ResultController } from "./result.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { validateRequest } from "../../common/middleware/validation.middleware.js";
import {
  enterResultSchema,
  verifyResultSchema,
  rejectResultSchema,
  amendResultSchema,
} from "./result.schemas.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

router.get(
  "/order/:orderId",
  requirePermissions(PERMISSIONS.RESULTS_ENTER),
  ResultController.getResultsByOrderId,
);
router.get(
  "/:id",
  requirePermissions(PERMISSIONS.RESULTS_ENTER),
  ResultController.getResultById,
);

router.post(
  "/:id/enter",
  requirePermissions(PERMISSIONS.RESULTS_ENTER),
  validateRequest({ body: enterResultSchema }),
  ResultController.enterResults,
);

router.post(
  "/:id/verify",
  requirePermissions(PERMISSIONS.RESULTS_VERIFY),
  validateRequest({ body: verifyResultSchema }),
  ResultController.verifyResult,
);

router.post(
  "/:id/reject",
  requirePermissions(PERMISSIONS.RESULTS_VERIFY),
  validateRequest({ body: rejectResultSchema }),
  ResultController.rejectResult,
);

router.post(
  "/:id/amend",
  requirePermissions(PERMISSIONS.RESULTS_AMEND),
  validateRequest({ body: amendResultSchema }),
  ResultController.amendResult,
);

export const resultRoutes = router;
