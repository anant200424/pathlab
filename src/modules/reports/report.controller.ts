import { Request, Response, NextFunction } from "express";
import { ReportService } from "./report.service.js";
import { AppError } from "../../common/errors/app-error.js";
import { SYSTEM_ROLES } from "../roles/role.constants.js";

export class ReportController {
  static async generateReport(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const report = await ReportService.generateAndPublishReport(
        req.params["orderId"] as string,
        req.user!._id.toString(),
      );
      res.status(201).json({
        success: true,
        data: report,
        message:
          "Clinical report published and immutable version saved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReportById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const report = await ReportService.getReportById(
        req.params["id"] as string,
      );

      // Patient access control check: if user is patient, verify patient match
      const isPatient = req.user?.roles.some(
        (r: any) => r.name === SYSTEM_ROLES.PATIENT,
      );
      if (isPatient && !report.patientId.equals(req.user!._id)) {
        throw AppError.forbidden(
          "Access denied to reports belonging to another patient.",
        );
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  static async downloadReport(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const reportId = req.params["id"] as string;
      const format = (req.query["format"] as "pdf" | "docx") || "pdf";
      const version = req.query["version"]
        ? Number(req.query["version"])
        : undefined;

      const report = await ReportService.getReportById(reportId);

      // Verify patient isolation
      const isPatient = req.user?.roles.some(
        (r: any) => r.name === SYSTEM_ROLES.PATIENT,
      );
      if (isPatient && !report.patientId.equals(req.user!._id)) {
        throw AppError.forbidden(
          "Access denied to reports belonging to another patient.",
        );
      }

      const { buffer, filename, contentType } =
        await ReportService.getReportDownloadBuffer(reportId, format, version);

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async printReportHtml(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const reportId = req.params["id"] as string;
      const html = await ReportService.generateHtmlPrintPreview(reportId);
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      next(error);
    }
  }

  static async getReportVersions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const versions = await ReportService.getReportVersions(
        req.params["id"] as string,
      );
      res.status(200).json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPatientReports(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const patientId = req.params["patientId"] as string;

      // Patient isolation check
      const isPatient = req.user?.roles.some(
        (r: any) => r.name === SYSTEM_ROLES.PATIENT,
      );
      if (isPatient && req.user!._id.toString() !== patientId) {
        throw AppError.forbidden(
          "Access denied to reports belonging to another patient.",
        );
      }

      const reports = await ReportService.getPatientReports(patientId);
      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listReports(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = Number(req.query["page"]) || 1;
      const limit = Number(req.query["limit"]) || 20;
      const patientId = req.query["patientId"] as string;
      const clinicId = req.query["clinicId"] as string;
      const status = req.query["status"] as string;

      const result = await ReportService.listReports({
        page,
        limit,
        patientId,
        clinicId,
        status,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
