import { Router } from "express";
import { AuditController } from "./audit.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermissions(PERMISSIONS.AUDIT_READ),
  AuditController.listAuditEvents,
);

export const auditRoutes = router;
