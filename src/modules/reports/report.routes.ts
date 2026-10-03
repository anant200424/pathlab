import { Router } from "express";
import { ReportController } from "./report.controller.js";
import {
  authenticate,
  requirePermissions,
  requireAnyPermission,
} from "../../common/middleware/auth.middleware.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

// List reports
router.get(
  "/",
  requireAnyPermission(PERMISSIONS.REPORTS_DOWNLOAD, PERMISSIONS.REPORTS_PRINT, PERMISSIONS.REPORTS_PUBLISH),
  ReportController.listReports,
);

// Generate report (publish)
router.post(
  "/:orderId/generate",
  requirePermissions(PERMISSIONS.REPORTS_PUBLISH),
  ReportController.generateReport,
);

// Patient portal list reports
router.get(
  "/patient/:patientId",
  requireAnyPermission(PERMISSIONS.REPORTS_DOWNLOAD, PERMISSIONS.PATIENTS_READ),
  ReportController.getPatientReports,
);

// Print HTML view
router.get(
  "/:id/print",
  requireAnyPermission(PERMISSIONS.REPORTS_PRINT, PERMISSIONS.REPORTS_DOWNLOAD),
  ReportController.printReportHtml,
);

// Versions history
router.get(
  "/:id/versions",
  requirePermissions(PERMISSIONS.REPORTS_DOWNLOAD),
  ReportController.getReportVersions,
);

// Download file (PDF / DOCX)
router.get(
  "/:id/download",
  requirePermissions(PERMISSIONS.REPORTS_DOWNLOAD),
  ReportController.downloadReport,
);

// Single report metadata
router.get(
  "/:id",
  requirePermissions(PERMISSIONS.REPORTS_DOWNLOAD),
  ReportController.getReportById,
);

export const reportRoutes = router;
