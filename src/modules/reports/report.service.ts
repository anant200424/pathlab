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

  static async listReports(options: {
    page?: number;
    limit?: number;
    patientId?: string;
    clinicId?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (options.patientId && Types.ObjectId.isValid(options.patientId)) {
      filter.patientId = new Types.ObjectId(options.patientId);
    }
    if (options.clinicId && Types.ObjectId.isValid(options.clinicId)) {
      filter.clinicId = new Types.ObjectId(options.clinicId);
    }
    if (options.status) {
      filter.status = options.status;
    }

    const [items, total] = await Promise.all([
      Report.find(filter)
        .populate("patientId", "patientId fullName firstName lastName phone")
        .populate("orderId", "orderId orderBarcode priority status")
        .populate("clinicId", "name clinicCode")
        .populate("verifyingDoctorId", "fullName doctorId qualification")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
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
    const order = await TestOrder.findById(report.orderId)
      .populate("patientId")
      .populate("referringDoctorId")
      .populate("verifyingDoctorId");

    const patient = (order?.patientId as any) || {};
    const refDoctor = (order?.referringDoctorId as any) || {};
    const doctorName =
      report.signerSnapshot?.doctorName ||
      refDoctor?.fullName ||
      "DR N UPADHYAY";
    const doctorQual =
      report.signerSnapshot?.qualification ||
      refDoctor?.qualification ||
      "M. B. B. S  M.D";
    const doctorSpec =
      (report.signerSnapshot as any)?.specialization ||
      refDoctor?.specialization ||
      "MICROBIOLOGIST";
    const doctorReg =
      report.signerSnapshot?.medicalRegistrationNumber ||
      refDoctor?.medicalRegistrationNumber ||
      "41175";

    const tableRows = (report.testResultsSnapshot || [])
      .map(
        (t: any) => `
        <tr><td colspan="4" style="padding:10px 4px 4px;font-weight:900;font-size:12px;text-transform:uppercase;color:#09090b;border-bottom:1px solid #e4e4e7;">${t.testName} ${t.department ? `<span style="font-size:10px;color:#71717a;font-weight:normal;">(${t.department})</span>` : ""}</td></tr>
        ${(t.parameters || [])
          .map(
            (p: any) => `
          <tr style="border-bottom:1px solid #f4f4f5;font-size:11.5px;">
            <td style="padding:6px 8px;color:#18181b;">${p.name}</td>
            <td style="padding:6px 8px;text-align:center;font-weight:bold;font-family:monospace;color:${p.flag !== "normal" ? "#dc2626" : "#09090b"};">${p.value}</td>
            <td style="padding:6px 8px;text-align:center;color:#3f3f46;font-family:monospace;">${p.referenceRangeText || "Normal"}</td>
            <td style="padding:6px 8px;text-align:center;color:#71717a;font-family:monospace;">${p.unit || "-"}</td>
          </tr>
        `,
          )
          .join("")}
      `,
      )
      .join("");

    const sampleDate = (report as any).createdAt
      ? new Date((report as any).createdAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleString("en-GB");

    const releasedDate = report.publishedAt
      ? new Date(report.publishedAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : sampleDate;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Report - ${report.reportId}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 25px; color: #09090b; background: #fff; }
          .container { max-width: 820px; margin: 0 auto; }
          .header-box { border-top: 2px solid #18181b; border-bottom: 2px solid #18181b; padding: 10px 0; margin-bottom: 20px; font-family: monospace; font-size: 11px; display: grid; grid-template-columns: 7fr 5fr; gap: 15px; }
          .pt-row { display: flex; margin-bottom: 4px; }
          .pt-lbl { width: 95px; font-weight: bold; color: #27272a; }
          .pt-val { font-weight: bold; text-transform: uppercase; color: #09090b; }
          .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .inv-th { border-bottom: 2px solid #27272a; padding: 6px 8px; text-transform: uppercase; font-size: 11px; font-weight: bold; }
          .end-rpt { text-align: center; font-weight: bold; font-family: monospace; margin: 30px 0; font-size: 12px; color: #3f3f46; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; padding-top: 15px; border-top: 1px solid #d4d4d8; font-size: 11px; }
          .action-bar { margin-bottom: 20px; display: flex; gap: 15px; font-weight: bold; font-size: 13px; color: #2563eb; }
          .action-bar a, .action-bar button { color: #2563eb; text-decoration: none; background: none; border: none; cursor: pointer; font-weight: bold; padding: 0; }
          @media print { .no-print { display: none !important; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="no-print action-bar">
            <button onclick="window.print()">Print</button>
            <span>|</span>
            <button onclick="window.print()">Download</button>
            <span>|</span>
            <a href="mailto:">Mail</a>
            <span>|</span>
            <a href="https://wa.me/">Whats</a>
          </div>

          <div class="header-box">
            <div>
              <div class="pt-row"><span class="pt-lbl">PT NAME</span><span style="margin-right:6px;">:</span><span class="pt-val">${patient.fullName || "MR. ANANT KUMAR SINGH"}</span></div>
              <div class="pt-row"><span class="pt-lbl">PT. AGE/SEX</span><span style="margin-right:6px;">:</span><span class="pt-val">${patient.ageYears ? patient.ageYears + "Y" : "28Y"} / ${(patient.gender || "MALE").toUpperCase()}</span></div>
              <div class="pt-row"><span class="pt-lbl">MOBILE NO</span><span style="margin-right:6px;">:</span><span class="pt-val">${patient.phone || "-"}</span></div>
              <div class="pt-row"><span class="pt-lbl">REF. BY</span><span style="margin-right:6px;">:</span><span class="pt-val">${refDoctor.fullName || "DR N UPADHYAY"}</span></div>
            </div>
            <div style="border-left: 1px solid #e4e4e7; padding-left: 12px;">
              <div class="pt-row"><span class="pt-lbl" style="width:125px;">SAMPLE REGD. AT</span><span style="margin-right:4px;">:</span><span>${sampleDate}</span></div>
              <div class="pt-row"><span class="pt-lbl" style="width:125px;">REPORT RELEASED ON</span><span style="margin-right:4px;">:</span><span>${releasedDate}</span></div>
              <div class="pt-row"><span class="pt-lbl" style="width:125px;">PATIENT UNIQUE ID NO</span><span style="margin-right:4px;">:</span><span>${patient.patientId || "SH-1000000000"}</span></div>
              <div class="pt-row"><span class="pt-lbl" style="width:125px;">REPORT STAT.</span><span style="margin-right:4px;">:</span><span style="font-weight:bold;color:${report.status === "published" ? "#15803d" : "#09090b"};">${report.status === "published" ? "Verified" : "Under Process"}</span></div>
            </div>
          </div>

          <table class="inv-table">
            <thead>
              <tr>
                <th class="inv-th" style="text-align:left;width:50%;">TEST / INVESTIGATION</th>
                <th class="inv-th" style="text-align:center;width:18%;">OBSERVED VALUE</th>
                <th class="inv-th" style="text-align:center;width:20%;">REFERENCE INTERVAL</th>
                <th class="inv-th" style="text-align:center;width:12%;">UNIT</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="end-rpt">--End Of Report--</div>

          <div class="footer">
            <div style="text-align:left;">
              <p style="margin:0;font-weight:bold;">Prashant Kumar</p>
              <p style="margin:2px 0;color:#52525b;font-size:10.5px;">Medical Microbiologist</p>
              <p style="margin:0;color:#a1a1aa;font-size:9px;">Lab Technician & Quality Incharge</p>
            </div>
            <div style="text-align:right;">
              <p style="margin:0;font-family:'Brush Script MT', cursive;font-size:22px;color:#18181b;">Nishant Upadhyay</p>
              <p style="margin:2px 0 0;font-weight:900;text-transform:uppercase;">${doctorName}</p>
              <p style="margin:1px 0;font-size:10.5px;color:#3f3f46;">${doctorQual}</p>
              <p style="margin:1px 0;font-size:9.5px;font-weight:bold;text-transform:uppercase;color:#52525b;">${doctorSpec}</p>
              <p style="margin:0;font-size:9.5px;font-family:monospace;color:#71717a;">Reg No-${doctorReg}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
