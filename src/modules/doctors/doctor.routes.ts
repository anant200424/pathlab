import { Router } from "express";
import multer from "multer";
import { DoctorController } from "./doctor.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { validateRequest } from "../../common/middleware/validation.middleware.js";
import { createDoctorSchema, approveAssetSchema } from "./doctor.schemas.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requirePermissions(PERMISSIONS.DOCTORS_MANAGE),
  validateRequest({ body: createDoctorSchema }),
  DoctorController.createDoctor,
);

router.get("/", DoctorController.listDoctors);
router.get("/:id", DoctorController.getDoctorById);

// Asset upload
router.post(
  "/:id/assets",
  requirePermissions(PERMISSIONS.DOCTOR_ASSETS_MANAGE),
  upload.single("file"),
  DoctorController.uploadAsset,
);

// Asset approval
router.post(
  "/assets/:assetId/approve",
  requirePermissions(PERMISSIONS.DOCTOR_ASSETS_MANAGE),
  validateRequest({ body: approveAssetSchema }),
  DoctorController.approveAsset,
);

// Asset preview / signed URL download
router.get("/assets/:assetId/download-url", DoctorController.getAssetSignedUrl);

export const doctorRoutes = router;
