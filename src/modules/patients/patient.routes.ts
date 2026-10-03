import { Router } from "express";
import { PatientController } from "./patient.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { validateRequest } from "../../common/middleware/validation.middleware.js";
import { createPatientSchema, updatePatientSchema } from "./patient.schemas.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requirePermissions(PERMISSIONS.PATIENTS_CREATE),
  validateRequest({ body: createPatientSchema }),
  PatientController.registerPatient,
);

router.get(
  "/",
  requirePermissions(PERMISSIONS.PATIENTS_READ),
  PatientController.listPatients,
);
router.get(
  "/:id",
  requirePermissions(PERMISSIONS.PATIENTS_READ),
  PatientController.getPatientById,
);
router.get(
  "/:id/history",
  requirePermissions(PERMISSIONS.PATIENTS_READ),
  PatientController.getPatientHistory,
);

router.patch(
  "/:id",
  requirePermissions(PERMISSIONS.PATIENTS_UPDATE),
  validateRequest({ body: updatePatientSchema }),
  PatientController.updatePatient,
);

export const patientRoutes = router;
