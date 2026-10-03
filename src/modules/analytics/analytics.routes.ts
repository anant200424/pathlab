import { Router } from "express";
import { AnalyticsController } from "./analytics.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

router.get(
  "/dashboard",
  requirePermissions(PERMISSIONS.ANALYTICS_READ),
  AnalyticsController.getDashboard,
);

export const analyticsRoutes = router;
