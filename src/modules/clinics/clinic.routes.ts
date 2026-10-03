import { Router } from "express";
import { ClinicController } from "./clinic.controller.js";
import { DoctorController } from "../doctors/doctor.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { validateRequest } from "../../common/middleware/validation.middleware.js";
import { createClinicSchema, updateClinicSchema } from "./clinic.schemas.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requirePermissions(PERMISSIONS.CLINICS_MANAGE),
  validateRequest({ body: createClinicSchema }),
  ClinicController.createClinic,
);

router.get("/", ClinicController.listClinics);
router.get("/:clinicId/doctors", DoctorController.getClinicDoctorsDropdown);
router.get("/:id", ClinicController.getClinicById);

router.patch(
  "/:id",
  requirePermissions(PERMISSIONS.CLINICS_MANAGE),
  validateRequest({ body: updateClinicSchema }),
  ClinicController.updateClinic,
);

router.delete(
  "/:id",
  requirePermissions(PERMISSIONS.CLINICS_MANAGE),
  ClinicController.deactivateClinic,
);

export const clinicRoutes = router;
