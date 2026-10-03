import { Router } from "express";
import { SettingsController } from "./settings.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermissions(PERMISSIONS.SETTINGS_MANAGE),
  SettingsController.getAllSettings,
);
router.post(
  "/",
  requirePermissions(PERMISSIONS.SETTINGS_MANAGE),
  SettingsController.setSetting,
);

export const settingsRoutes = router;
