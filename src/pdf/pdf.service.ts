import PDFDocument from "pdfkit";
import {
  IBrandingSnapshot,
  ISignerSnapshot,
} from "../modules/reports/report.model.js";

export interface ReportPdfData {
  reportId: string;
  orderId: string;
  orderBarcode: string;
  patient: {
    fullName: string;
    patientId: string;
    registrationNumber: string;
    age: string;
    gender: string;
    phone: string;
  };
  sampleDate: string;
  reportDate: string;
  branding: IBrandingSnapshot;
  signer: ISignerSnapshot;
  tests: Array<{
    testName: string;
    department: string;
    parameters: Array<{
      name: string;
      value: string;
      unit?: string;
      referenceRangeText: string;
      flag: string;
    }>;
    remarks?: string;
  }>;
  logoBuffer?: Buffer;
  signatureBuffer?: Buffer;
  stampBuffer?: Buffer;
}

export class PdfService {
  static async generateReportPdf(data: ReportPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // 1. Header & Clinic Branding
      doc.save();

      // Top color accent bar
      doc.rect(40, 20, 515, 6).fill("#1E40AF");

      // Logo or Clinic Title
      if (data.logoBuffer) {
        try {
          doc.image(data.logoBuffer, 40, 35, {
            width: 60,
            height: 60,
            fit: [60, 60],
          });
          doc
            .fontSize(18)
            .fillColor("#1E3A8A")
            .font("Helvetica-Bold")
            .text(data.branding.clinicName, 110, 38);
          doc
            .fontSize(9)
            .fillColor("#4B5563")
            .font("Helvetica")
            .text(data.branding.addressText, 110, 60);
          doc.text(
            `Phone: ${data.branding.contactText} | Branch: ${data.branding.branchCode}`,
            110,
            73,
          );
        } catch {
          // Fallback if image buffer corrupt
          doc
            .fontSize(18)
            .fillColor("#1E3A8A")
            .font("Helvetica-Bold")
            .text(data.branding.clinicName, 40, 38);
          doc
            .fontSize(9)
            .fillColor("#4B5563")
            .font("Helvetica")
            .text(data.branding.addressText, 40, 60);
          doc.text(
            `Phone: ${data.branding.contactText} | Branch: ${data.branding.branchCode}`,
            40,
            73,
          );
        }
      } else {
        doc
          .fontSize(18)
          .fillColor("#1E3A8A")
          .font("Helvetica-Bold")
          .text(data.branding.clinicName, 40, 38);
        doc
          .fontSize(9)
          .fillColor("#4B5563")
          .font("Helvetica")
          .text(data.branding.addressText, 40, 60);
        doc.text(
          `Phone: ${data.branding.contactText} | Branch: ${data.branding.branchCode}`,
          40,
          73,
        );
      }

      // Divider
      doc
        .strokeColor("#CBD5E1")
        .lineWidth(1)
        .moveTo(40, 105)
        .lineTo(555, 105)
        .stroke();

      // 2. Patient & Order Metadata Box
      doc.roundedRect(40, 112, 515, 65, 4).fillAndStroke("#F8FAFC", "#E2E8F0");
      doc.fillColor("#1E293B").fontSize(9);

      // Col 1
      doc.font("Helvetica-Bold").text("Patient Name:", 50, 120);
      doc.font("Helvetica").text(data.patient.fullName, 130, 120);
      doc.font("Helvetica-Bold").text("Patient ID:", 50, 135);
      doc.font("Helvetica").text(data.patient.patientId, 130, 135);
      doc.font("Helvetica-Bold").text("Age / Gender:", 50, 150);
      doc
        .font("Helvetica")
        .text(`${data.patient.age} / ${data.patient.gender}`, 130, 150);

      // Col 2
      doc.font("Helvetica-Bold").text("Order ID:", 340, 120);
      doc.font("Helvetica").text(data.orderId, 415, 120);
      doc.font("Helvetica-Bold").text("Sample Date:", 340, 135);
      doc.font("Helvetica").text(data.sampleDate, 415, 135);
      doc.font("Helvetica-Bold").text("Report Date:", 340, 150);
      doc.font("Helvetica").text(data.reportDate, 415, 150);

      let currentY = 190;

      // 3. Clinical Test Results Table Header
      const renderTableHeader = (y: number) => {
        doc.rect(40, y, 515, 20).fill("#0F172A");
        doc.fillColor("#FFFFFF").fontSize(8.5).font("Helvetica-Bold");
        doc.text("TEST / PARAMETER", 50, y + 6);
        doc.text("RESULT", 240, y + 6);
        doc.text("FLAG", 320, y + 6);
        doc.text("UNITS", 370, y + 6);
        doc.text("REFERENCE INTERVAL", 440, y + 6);
      };

      renderTableHeader(currentY);
      currentY += 24;

      // 4. Render Tests and Parameters
      for (const test of data.tests) {
        // Check page overflow
        if (currentY > 670) {
          doc.addPage();
          currentY = 40;
          renderTableHeader(currentY);
          currentY += 24;
        }

        // Test category banner
        doc.rect(40, currentY, 515, 16).fill("#F1F5F9");
        doc.fillColor("#1E3A8A").fontSize(9).font("Helvetica-Bold");
        doc.text(`${test.testName} (${test.department})`, 48, currentY + 4);
        currentY += 20;

        for (const p of test.parameters) {
          if (currentY > 680) {
            doc.addPage();
            currentY = 40;
            renderTableHeader(currentY);
            currentY += 24;
          }

          doc.fillColor("#1E293B").fontSize(8.5).font("Helvetica");
          doc.text(p.name, 50, currentY);

          // Result Value
          const isAbnormal = p.flag !== "normal";
          if (isAbnormal) {
            doc.font("Helvetica-Bold").fillColor("#DC2626");
          } else {
            doc.font("Helvetica-Bold").fillColor("#0F172A");
          }
          doc.text(p.value, 240, currentY);

          // Flag
          if (p.flag === "critical_high" || p.flag === "critical_low") {
            doc.fillColor("#991B1B").text(p.flag.toUpperCase(), 320, currentY);
          } else if (p.flag === "abnormal_high") {
            doc.fillColor("#D97706").text("HIGH", 320, currentY);
          } else if (p.flag === "abnormal_low") {
            doc.fillColor("#D97706").text("LOW", 320, currentY);
          } else {
            doc.fillColor("#16A34A").text("NORMAL", 320, currentY);
          }

          // Unit
          doc
            .fillColor("#64748B")
            .font("Helvetica")
            .text(p.unit || "-", 370, currentY);

          // Reference Range
          doc
            .fillColor("#334155")
            .text(p.referenceRangeText || "Normal", 440, currentY);

          // Light separator line
          doc
            .strokeColor("#F1F5F9")
            .lineWidth(0.5)
            .moveTo(40, currentY + 14)
            .lineTo(555, currentY + 14)
            .stroke();

          currentY += 18;
        }

        if (test.remarks) {
          doc.fillColor("#475569").fontSize(8).font("Helvetica-Oblique");
          doc.text(`Note: ${test.remarks}`, 50, currentY + 2);
          currentY += 16;
        }

        currentY += 8;
      }

      // 5. Signer, Stamp, and Footer Section
      if (currentY > 640) {
        doc.addPage();
        currentY = 50;
      } else {
        currentY = Math.max(currentY + 20, 660);
      }

      doc
        .strokeColor("#E2E8F0")
        .lineWidth(1)
        .moveTo(40, currentY)
        .lineTo(555, currentY)
        .stroke();

      // Signer Details
      const signerY = currentY + 10;
      doc
        .fillColor("#0F172A")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(`Verified & Approved by:`, 330, signerY);
      doc
        .fontSize(9.5)
        .text(`Dr. ${data.signer.doctorName}`, 330, signerY + 14);
      doc.font("Helvetica").fontSize(8).fillColor("#475569");
      doc.text(data.signer.qualification, 330, signerY + 26);
      doc.text(
        `Reg. No: ${data.signer.medicalRegistrationNumber}`,
        330,
        signerY + 38,
      );

      // Embedded Stamp and Signature if provided
      if (data.stampBuffer) {
        try {
          doc.image(data.stampBuffer, 240, signerY - 5, {
            width: 50,
            height: 50,
            fit: [50, 50],
          });
        } catch {
          // ignore error
        }
      }

      if (data.signatureBuffer) {
        try {
          doc.image(data.signatureBuffer, 440, signerY - 5, {
            width: 70,
            height: 35,
            fit: [70, 35],
          });
        } catch {
          // ignore error
        }
      }

      // Barcode text and disclaimer
      doc.fontSize(7.5).fillColor("#94A3B8").font("Helvetica");
      doc.text(
        `* End of Report | Report ID: ${data.reportId} | Barcode: ${data.orderBarcode} *`,
        40,
        770,
        {
          align: "center",
          width: 515,
        },
      );
      doc.text(
        "Note: Test results relate only to the items tested. Please correlate clinically with patient symptoms.",
        40,
        782,
        { align: "center", width: 515 },
      );

      // 6. Add Page Numbers across all buffered pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor("#64748B").fontSize(7.5).font("Helvetica");
        doc.text(`Page ${i + 1} of ${range.count}`, 40, 800, {
          align: "right",
          width: 515,
        });
      }

      doc.end();
    });
  }
}
