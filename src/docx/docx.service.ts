import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
} from "docx";
import { ReportPdfData } from "../pdf/pdf.service.js";

export class DocxService {
  static async generateReportDocx(data: ReportPdfData): Promise<Buffer> {
    const tableRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Test / Parameter", bold: true }),
                ],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Result", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Flag", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Units", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Reference Range", bold: true }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    for (const test of data.tests) {
      // Test Category header row
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 5,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${test.testName} (${test.department})`,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      );

      for (const p of test.parameters) {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(p.name)] }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: p.value, bold: p.flag !== "normal" }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [new Paragraph(p.flag.toUpperCase())],
              }),
              new TableCell({ children: [new Paragraph(p.unit || "-")] }),
              new TableCell({
                children: [new Paragraph(p.referenceRangeText || "Normal")],
              }),
            ],
          }),
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: data.branding.clinicName,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `${data.branding.addressText} | Phone: ${data.branding.contactText}`,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: "LABORATORY INVESTIGATION REPORT (EDITABLE EXPORT)",
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              children: [
                new TextRun({ text: "Patient Name: ", bold: true }),
                new TextRun(data.patient.fullName),
                new TextRun({ text: "\tOrder ID: ", bold: true }),
                new TextRun(data.orderId),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Patient ID: ", bold: true }),
                new TextRun(data.patient.patientId),
                new TextRun({ text: "\tSample Date: ", bold: true }),
                new TextRun(data.sampleDate),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Age/Gender: ", bold: true }),
                new TextRun(`${data.patient.age} / ${data.patient.gender}`),
                new TextRun({ text: "\tReport Date: ", bold: true }),
                new TextRun(data.reportDate),
              ],
            }),
            new Paragraph({ text: "" }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: `Verified by: Dr. ${data.signer.doctorName} (${data.signer.qualification}) - Reg No: ${data.signer.medicalRegistrationNumber}`,
              alignment: AlignmentType.RIGHT,
            }),
            new Paragraph({
              text: "* DISCLAIMER: This editable export is provided for authorized medical editing purposes only. It is not an official signed clinical document. *",
              alignment: AlignmentType.CENTER,
            }),
          ],
        },
      ],
    });

    return Packer.toBuffer(doc);
  }
}
