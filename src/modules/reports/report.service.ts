import { Types } from "mongoose";
import {
  Report,
  IReport,
  IBrandingSnapshot,
  ISignerSnapshot,
} from "./report.model.js";
import { TestOrder } from "../orders/order.model.js";
import { TestResult } from "../results/result.model.js";
import { Clinic } from "../clinics/clinic.model.js";
import { DoctorProfile } from "../doctors/doctor.model.js";
import { DoctorAsset } from "../doctors/doctor-asset.model.js";
import { Patient } from "../patients/patient.model.js";
import { PdfService, ReportPdfData } from "../../pdf/pdf.service.js";
import { DocxService } from "../../docx/docx.service.js";
import { getStorageProvider } from "../../storage/storage.factory.js";
import { generateCustomId } from "../../common/utilities/id-generator.util.js";
import { AppError } from "../../common/errors/app-error.js";
import { AuditService } from "../audit/audit.service.js";

export class ReportService {
  /**
   * Deterministic Report Template & Publication Resolution
   */
  static async generateAndPublishReport(
    orderId: string,
    actorId: string,
  ): Promise<IReport> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw AppError.badRequest("Invalid order ID.");
    }

    const order = await TestOrder.findById(orderId);
    if (!order) {
      throw AppError.notFound("Test order not found.");
    }

    // 1. Check order status: must be verified before publishing!
    if (order.status !== "verified" && order.status !== "published") {
      throw AppError.badRequest(
        `Cannot publish report for order with status '${order.status}'. Results must be verified by an authorized verifier first.`,
      );
    }

    // 2. Fetch associated Clinic & Branding configuration
    const clinic = await Clinic.findById(order.clinicId);
    if (!clinic || !clinic.isActive) {
      throw AppError.badRequest("Associated clinic not found or inactive.");
    }

    // 3. Fetch Verifying Professional
    if (!order.verifyingDoctorId) {
      throw AppError.badRequest(
        "No verifying pathologist has been assigned or recorded for this order.",
      );
    }

    const doctor = await DoctorProfile.findById(order.verifyingDoctorId);
    if (!doctor || !doctor.isActive || !doctor.isVerifyingDoctor) {
      throw AppError.forbidden(
        "Assigned verifying professional is not authorized to sign and approve clinical laboratory reports.",
      );
    }

    // 4. Retrieve approved doctor assets (signature & stamp)
    let signatureAsset: typeof DoctorAsset.prototype | null = null;
    let stampAsset: typeof DoctorAsset.prototype | null = null;

    if (doctor.signatureAssetId) {
      signatureAsset = await DoctorAsset.findOne({
        _id: doctor.signatureAssetId,
        isApproved: true,
        isActive: true,
      });
    }

    if (doctor.stampAssetId) {
      stampAsset = await DoctorAsset.findOne({
        _id: doctor.stampAssetId,
        isApproved: true,
        isActive: true,
      });
    }

    // 5. Fetch Patient
    const patient = await Patient.findById(order.patientId);
    if (!patient) {
      throw AppError.notFound("Patient record not found.");
    }

    // 6. Fetch all Results for this order
    const results = await TestResult.find({ orderId: order._id }).populate(
      "testId",
    );
    if (results.length === 0) {
      throw AppError.badRequest("No test results exist for this order.");
    }

    // Check all are verified
    const unverified = results.filter(
      (r) => r.status !== "verified" && r.status !== "amended",
    );
    if (unverified.length > 0) {
      throw AppError.badRequest(
        `Cannot publish report: ${unverified.length} test result(s) are not verified yet.`,
      );
    }

    // 7. Download asset buffers from storage if available
    const storage = getStorageProvider();
    let signatureBuffer: Buffer | undefined;
    let stampBuffer: Buffer | undefined;
    let logoBuffer: Buffer | undefined;

    if (signatureAsset) {
      try {
        signatureBuffer = await storage.getBuffer(signatureAsset.storageKey);
      } catch {
        // Continue if buffer not loadable
      }
    }

    if (stampAsset) {
      try {
        stampBuffer = await storage.getBuffer(stampAsset.storageKey);
      } catch {
        // Continue if buffer not loadable
      }
    }

    if (clinic.logoKey) {
      try {
        logoBuffer = await storage.getBuffer(clinic.logoKey);
      } catch {
        // Continue if buffer not loadable
      }
    }

    // 8. Construct Immutable Branding and Signer Snapshots
    const brandingSnapshot: IBrandingSnapshot = {
      clinicName: clinic.name,
      clinicCode: clinic.clinicCode,
      branchCode: clinic.branchCode,
      addressText: `${clinic.address.line1}, ${clinic.address.city}, ${clinic.address.state} - ${clinic.address.postalCode}`,
      contactText: `${clinic.contact.phone} | ${clinic.contact.email}`,
      logoStorageKey: clinic.logoKey,
      headerHeight: clinic.letterheadConfig.headerHeight,
      footerHeight: clinic.letterheadConfig.footerHeight,
      showLogo: clinic.letterheadConfig.showLogo,
      customHeaderText: clinic.letterheadConfig.customHeaderText,
      customFooterText: clinic.letterheadConfig.customFooterText,
    };

    const signerSnapshot: ISignerSnapshot = {
      doctorId: doctor.doctorId,
      doctorName: doctor.fullName,
      qualification: doctor.qualification,
      specialization: doctor.specialization,
      medicalRegistrationNumber: doctor.medicalRegistrationNumber,
      signatureStorageKey: signatureAsset?.storageKey,
      stampStorageKey: stampAsset?.storageKey,
      reportFooterText: doctor.reportFooterText,
    };

    // Format tests for document rendering
    const testsFormatted = results.map((r) => ({
      testName: (r.testId as any).name || "Test",
      department: (r.testId as any).department || "General",
      parameters: r.parameterResults.map((p) => ({
        name: p.name,
        value: p.value,
        unit: p.unit,
        referenceRangeText: p.referenceRangeText,
        flag: p.flag,
      })),
      remarks: r.remarks,
    }));

    const reportId = generateCustomId("REP", 4);
    const dateFormatted = new Date().toISOString().slice(0, 10);

    const docData: ReportPdfData = {
      reportId,
      orderId: order.orderId,
      orderBarcode: order.orderBarcode,
      patient: {
        fullName: patient.fullName,
        patientId: patient.patientId,
        registrationNumber: patient.registrationNumber,
        age: `${patient.ageYears || 0} Y`,
        gender: patient.gender.toUpperCase(),
        phone: patient.phone,
      },
      sampleDate: order.createdAt.toISOString().slice(0, 10),
      reportDate: dateFormatted,
      branding: brandingSnapshot,
      signer: signerSnapshot,
      tests: testsFormatted,
      logoBuffer,
      signatureBuffer,
      stampBuffer,
    };

    // 9. Generate PDF buffer and DOCX buffer
    const pdfBuffer = await PdfService.generateReportPdf(docData);
    const docxBuffer = await DocxService.generateReportDocx(docData);

    // 10. Store in private object storage
    const storageKeyPdf = `reports/${clinic.clinicCode}/${reportId}/clinical_report_${reportId}_v1.pdf`;
    const storageKeyDocx = `reports/${clinic.clinicCode}/${reportId}/clinical_report_${reportId}_v1.docx`;

    await storage.upload(storageKeyPdf, pdfBuffer, "application/pdf");
    await storage.upload(
      storageKeyDocx,
      docxBuffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    // 11. Create or Update Report record
    let report = await Report.findOne({ orderId: order._id });

    if (!report) {
      report = await Report.create({
        reportId,
        orderId: order._id,
        patientId: patient._id,
        clinicId: clinic._id,
        verifyingDoctorId: doctor._id,
        status: "published",
        currentVersion: 1,
        storageKeyPdf,
        storageKeyDocx,
        brandingSnapshot,
        signerSnapshot,
        testResultsSnapshot: testsFormatted,
        versions: [
          {
            version: 1,
            storageKeyPdf,
            storageKeyDocx,
            brandingSnapshot,
            signerSnapshot,
            testResultsSnapshot: testsFormatted,
            publishedAt: new Date(),
            publishedBy: new Types.ObjectId(actorId),
            changeReason: "Initial Publication",
          },
        ],
        publishedAt: new Date(),
        publishedBy: new Types.ObjectId(actorId),
      });
    } else {
      // Create new version
      const newVersion = (report.currentVersion || 1) + 1;
      const vPdfKey = `reports/${clinic.clinicCode}/${report.reportId}/clinical_report_${report.reportId}_v${newVersion}.pdf`;
      const vDocxKey = `reports/${clinic.clinicCode}/${report.reportId}/clinical_report_${report.reportId}_v${newVersion}.docx`;

      await storage.upload(vPdfKey, pdfBuffer, "application/pdf");
      await storage.upload(
        vDocxKey,
        docxBuffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );

      report.versions.push({
        version: newVersion,
        storageKeyPdf: vPdfKey,
        storageKeyDocx: vDocxKey,
        brandingSnapshot,
        signerSnapshot,
        testResultsSnapshot: testsFormatted,
        publishedAt: new Date(),
        publishedBy: new Types.ObjectId(actorId),
        changeReason: "Report amendment/update publication",
      });

      report.currentVersion = newVersion;
      report.storageKeyPdf = vPdfKey;
      report.storageKeyDocx = vDocxKey;
      report.brandingSnapshot = brandingSnapshot;
      report.signerSnapshot = signerSnapshot;
      report.testResultsSnapshot = testsFormatted;
      report.status = "amended";
      report.publishedAt = new Date();
      report.publishedBy = new Types.ObjectId(actorId);
      await report.save();
    }

    // 12. Advance order status to published
    order.status = "published";
    order.statusHistory.push({
      status: "published",
      changedBy: new Types.ObjectId(actorId),
      changedAt: new Date(),
      note: `Clinical report ${report.reportId} published (v${report.currentVersion}).`,
    });
    await order.save();

    await AuditService.log({
      actorId: new Types.ObjectId(actorId),
      action: "reports:publish",
      entityType: "Report",
      entityId: report._id.toString(),
      clinicId: clinic._id,
      details: {
        reportId: report.reportId,
        orderId: order.orderId,
        version: report.currentVersion,
        signer: doctor.fullName,
      },
    });

    return report;
  }

  static async getReportById(reportId: string): Promise<IReport> {
    const report = Types.ObjectId.isValid(reportId)
      ? await Report.findById(reportId)
      : await Report.findOne({ reportId });

    if (!report) {
      throw AppError.notFound("Report record not found.");
    }
    return report;
  }

  static async getReportDownloadBuffer(
    reportId: string,
    format: "pdf" | "docx" = "pdf",
    version?: number,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const report = await this.getReportById(reportId);

    let storageKey =
      format === "docx" ? report.storageKeyDocx : report.storageKeyPdf;

    // Check if specific version requested
    if (version && version !== report.currentVersion) {
      const v = report.versions.find((item) => item.version === version);
      if (!v) {
        throw AppError.notFound(`Report version ${version} not found.`);
      }
      storageKey = format === "docx" ? v.storageKeyDocx : v.storageKeyPdf;
    }

    if (!storageKey) {
      throw AppError.notFound(
        `File format '${format}' not generated for this report.`,
      );
    }

    const storage = getStorageProvider();
    const buffer = await storage.getBuffer(storageKey);
    const contentType =
      format === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf";
    const filename = `Report_${report.reportId}_v${version || report.currentVersion}.${format}`;

    return { buffer, filename, contentType };
  }

  static async getPatientReports(patientId: string) {
    if (!Types.ObjectId.isValid(patientId)) {
      throw AppError.badRequest("Invalid patient ID.");
    }

    return Report.find({
      patientId: new Types.ObjectId(patientId),
      status: { $in: ["published", "amended"] },
    })
      .select(
        "reportId currentVersion status publishedAt brandingSnapshot.clinicName createdAt",
      )
      .sort({ publishedAt: -1 });
  }

  static async getReportVersions(reportId: string) {
    const report = await this.getReportById(reportId);
    return report.versions.map((v) => ({
      version: v.version,
      publishedAt: v.publishedAt,
      publishedBy: v.publishedBy,
      changeReason: v.changeReason,
      signer: v.signerSnapshot.doctorName,
    }));
  }

  static async generateHtmlPrintPreview(reportId: string): Promise<string> {
    const report = await this.getReportById(reportId);
    const order = await TestOrder.findById(report.orderId).populate(
      "patientId",
    );

    const patient = (order?.patientId as any) || {};

    const tableRows = (report.testResultsSnapshot || [])
      .map(
        (t: any) => `
        <tr style="background:#f1f5f9;"><td colspan="5" style="padding:6px;font-weight:bold;color:#1e3a8a;">${t.testName} (${t.department})</td></tr>
        ${(t.parameters || [])
          .map(
            (p: any) => `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:6px 10px;">${p.name}</td>
            <td style="padding:6px 10px;font-weight:bold;color:${p.flag !== "normal" ? "#dc2626" : "#0f172a"};">${p.value}</td>
            <td style="padding:6px 10px;color:${p.flag !== "normal" ? "#dc2626" : "#16a34a"};">${p.flag.toUpperCase()}</td>
            <td style="padding:6px 10px;color:#64748b;">${p.unit || "-"}</td>
            <td style="padding:6px 10px;color:#334155;">${p.referenceRangeText || "Normal"}</td>
          </tr>
        `,
          )
          .join("")}
      `,
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Report Print Preview - ${report.reportId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #1e293b; }
          .header { border-bottom: 2px solid #1e40af; padding-bottom: 12px; margin-bottom: 20px; }
          .patient-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 24px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 30px; }
          th { background: #0f172a; color: white; padding: 8px 10px; text-align: left; }
          .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; display: flex; justify-content: space-between; font-size: 12px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:20px;text-align:right;">
          <button onclick="window.print()" style="padding:8px 16px;background:#1e40af;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:600;">Print Report</button>
        </div>
        <div class="header">
          <h1 style="margin:0;color:#1e3a8a;font-size:24px;">${report.brandingSnapshot.clinicName}</h1>
          <p style="margin:4px 0;color:#64748b;font-size:12px;">${report.brandingSnapshot.addressText} | Phone: ${report.brandingSnapshot.contactText}</p>
        </div>
        <div class="patient-box">
          <div>
            <p><strong>Patient Name:</strong> ${patient.fullName || "N/A"}</p>
            <p><strong>Patient ID:</strong> ${patient.patientId || "N/A"}</p>
            <p><strong>Age / Gender:</strong> ${patient.ageYears || 0} Y / ${(patient.gender || "").toUpperCase()}</p>
          </div>
          <div>
            <p><strong>Report ID:</strong> ${report.reportId}</p>
            <p><strong>Order ID:</strong> ${order?.orderId || "N/A"}</p>
            <p><strong>Report Date:</strong> ${report.publishedAt ? new Date(report.publishedAt).toLocaleDateString() : "N/A"}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>TEST / PARAMETER</th>
              <th>RESULT</th>
              <th>FLAG</th>
              <th>UNITS</th>
              <th>REFERENCE RANGE</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          <div>
            <p style="color:#64748b;font-size:11px;">* End of Report | Generated securely by LabCare Pro Enterprise *</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0;font-weight:bold;">Verified & Approved By:</p>
            <p style="margin:2px 0;">Dr. ${report.signerSnapshot.doctorName}</p>
            <p style="margin:0;color:#64748b;font-size:11px;">${report.signerSnapshot.qualification} | Reg: ${report.signerSnapshot.medicalRegistrationNumber}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
