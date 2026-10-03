import { Router } from "express";
import { SampleController } from "./sample.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { validateRequest } from "../../common/middleware/validation.middleware.js";
import {
  collectSampleSchema,
  acceptSampleSchema,
  rejectSampleSchema,
  recollectSampleSchema,
} from "./sample.schemas.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermissions(PERMISSIONS.ORDERS_READ),
  SampleController.listSamples,
);
router.get(
  "/barcode/:barcode",
  requirePermissions(PERMISSIONS.ORDERS_READ),
  SampleController.getSampleByBarcode,
);

router.post(
  "/:id/collect",
  requirePermissions(PERMISSIONS.SAMPLES_COLLECT),
  validateRequest({ body: collectSampleSchema }),
  SampleController.recordCollection,
);

router.post(
  "/:id/accept",
  requirePermissions(PERMISSIONS.SAMPLES_PROCESS),
  validateRequest({ body: acceptSampleSchema }),
  SampleController.acceptSample,
);

router.post(
  "/:id/reject",
  requirePermissions(PERMISSIONS.SAMPLES_PROCESS),
  validateRequest({ body: rejectSampleSchema }),
  SampleController.rejectSample,
);

router.post(
  "/:id/recollect",
  requirePermissions(PERMISSIONS.SAMPLES_PROCESS),
  validateRequest({ body: recollectSampleSchema }),
  SampleController.recollectSample,
);

export const sampleRoutes = router;
