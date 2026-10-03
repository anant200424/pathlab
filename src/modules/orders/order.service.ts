import { Types } from "mongoose";
import {
  TestOrder,
  ITestOrder,
  OrderStatus,
  IOrderedTestItem,
  IOrderedPackageItem,
} from "./order.model.js";
import { Sample } from "../samples/sample.model.js";
import { TestResult } from "../results/result.model.js";
import { Patient } from "../patients/patient.model.js";
import { Visit } from "../patients/visit.model.js";
import { Clinic } from "../clinics/clinic.model.js";
import { DoctorProfile } from "../doctors/doctor.model.js";
import {
  TestDefinition,
  ITestDefinition,
} from "../tests/test-definition.model.js";
import { TestPackage } from "../tests/test-package.model.js";
import { AppError } from "../../common/errors/app-error.js";
import {
  generateCustomId,
  generateBarcodeNumber,
} from "../../common/utilities/id-generator.util.js";
import {
  toUnits,
  toCents,
  calculateDiscount,
  subtractCurrency,
} from "../../common/utilities/currency.util.js";
import { AuditService } from "../audit/audit.service.js";

// Status transition state machine
const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["registered", "cancelled"],
  registered: ["awaiting_sample", "cancelled"],
  awaiting_sample: ["sample_collected", "cancelled"],
  sample_collected: ["processing", "cancelled"],
  processing: ["awaiting_verification", "cancelled"],
  awaiting_verification: ["processing", "verified", "cancelled"],
  verified: ["published", "processing", "cancelled"],
  published: ["cancelled"], // Published reports cannot simply be flipped back; revisions/amendments are handled in results/reports
  cancelled: [],
};

export class OrderService {
  static async createOrder(
    data: {
      patientId: string;
      visitId?: string;
      clinicId?: string;
      referringDoctorId?: string;
      priority?: "routine" | "urgent" | "stat";
      testIds: string[];
      packageIds?: string[];
      discountPercent?: number;
      discountAmount?: number;
      clinicalNotes?: string;
      notes?: string;
      idempotencyKey?: string;
    },
    actorId?: string,
  ): Promise<ITestOrder> {
    if (data.notes && !data.clinicalNotes) {
      data.clinicalNotes = data.notes;
    }
    if (!data.packageIds) {
      data.packageIds = [];
    }

    // 1. Idempotency Check
    if (data.idempotencyKey) {
      const existing = await TestOrder.findOne({
        idempotencyKey: data.idempotencyKey,
      });
      if (existing) {
        return existing;
      }
    }

    // 2. Resolve Clinic
    let clinic = null;
    if (data.clinicId && Types.ObjectId.isValid(data.clinicId)) {
      clinic = await Clinic.findById(data.clinicId);
    }
    if (!clinic || !clinic.isActive) {
      clinic = await Clinic.findOne({ isActive: true });
    }
    if (!clinic || !clinic.isActive) {
      throw AppError.badRequest("No active clinic found.");
    }
    data.clinicId = clinic._id.toString();

    // 3. Validate Patient and Visit
    if (!Types.ObjectId.isValid(data.patientId)) {
      throw AppError.badRequest("Invalid patient ID.");
    }
    const patient = await Patient.findById(data.patientId);
    if (!patient || !patient.isActive) {
      throw AppError.badRequest("Patient not found or inactive.");
    }

    let visit = null;
    if (data.visitId && Types.ObjectId.isValid(data.visitId)) {
      visit = await Visit.findById(data.visitId);
    }
    if (!visit || !visit.isActive) {
      visit = await Visit.findOne({ patientId: patient._id, isActive: true }).sort({ createdAt: -1 });
    }
    if (!visit) {
      const visitNumber = generateCustomId("VIS", 4);
      visit = await Visit.create({
        visitNumber,
        patientId: patient._id,
        clinicId: clinic._id,
        visitType: "outpatient",
        isActive: true,
      });
    }
    data.visitId = visit._id.toString();

    // 4. Validate or Fallback Doctor
    let doctor = null;
    if (data.referringDoctorId && Types.ObjectId.isValid(data.referringDoctorId)) {
      doctor = await DoctorProfile.findById(data.referringDoctorId);
    }
    if (!doctor || !doctor.isActive) {
      doctor = await DoctorProfile.findOne({ associatedClinics: clinic._id, isActive: true });
    }
    if (!doctor || !doctor.isActive) {
      doctor = await DoctorProfile.findOne({ isActive: true });
    }
    if (!doctor) {
      throw AppError.badRequest("No active doctor profile found in the system.");
    }
    data.referringDoctorId = doctor._id.toString();

    // 5. Gather all tests (individual tests + package tests)
    const testDocsMap = new Map<string, ITestDefinition>();
    const orderedTestsList: IOrderedTestItem[] = [];
    const orderedPackagesList: IOrderedPackageItem[] = [];
    let subtotalCents = 0;

    // Direct tests
    if (data.testIds.length > 0) {
      const tests = await TestDefinition.find({
        _id: { $in: data.testIds.map((id) => new Types.ObjectId(id)) },
        isActive: true,
      });
      if (tests.length !== data.testIds.length) {
        throw AppError.badRequest(
          "One or more selected tests were not found or are inactive.",
        );
      }
      for (const t of tests) {
        testDocsMap.set(t._id.toString(), t);
        orderedTestsList.push({
          testId: t._id as Types.ObjectId,
          testCode: t.testCode,
          name: t.name,
          price: t.price,
          specimenType: t.specimenType,
          status: "pending",
        });
        subtotalCents += toCents(t.price);
      }
    }

    // Package tests
    if (data.packageIds.length > 0) {
      const packages = await TestPackage.find({
        _id: { $in: data.packageIds.map((id) => new Types.ObjectId(id)) },
        isActive: true,
      }).populate<{ tests: ITestDefinition[] }>("tests");

      if (packages.length !== data.packageIds.length) {
        throw AppError.badRequest(
          "One or more selected packages were not found or are inactive.",
        );
      }

      for (const pkg of packages) {
        orderedPackagesList.push({
          packageId: pkg._id as Types.ObjectId,
          packageCode: pkg.packageCode,
          name: pkg.name,
          price: pkg.price,
        });
        subtotalCents += toCents(pkg.price);

        // Include package tests if not already added
        for (const t of pkg.tests) {
          if (!testDocsMap.has(t._id.toString())) {
            testDocsMap.set(t._id.toString(), t);
            orderedTestsList.push({
              testId: t._id as Types.ObjectId,
              testCode: t.testCode,
              name: t.name,
              price: 0, // Bundled inside package
              specimenType: t.specimenType,
              status: "pending",
            });
          }
        }
      }
    }

    if (orderedTestsList.length === 0) {
      throw AppError.badRequest("Order must contain at least one valid test.");
    }

    // 6. Decimal-safe pricing calculation on backend
    const subtotal = toUnits(subtotalCents);
    let discount = 0;
    const discountPercent = data.discountPercent || 0;

    if (discountPercent > 0) {
      discount = calculateDiscount(subtotal, discountPercent);
    } else if (data.discountAmount && data.discountAmount > 0) {
      discount = Math.min(subtotal, data.discountAmount);
    }

    const netTotal = subtractCurrency(subtotal, discount);
    const balanceDue = netTotal;

    // 7. Generate collision-safe identifiers
    const orderId = generateCustomId("ORD", 4);
    const orderBarcode = generateBarcodeNumber();

    // 8. Create TestOrder
    const order = await TestOrder.create({
      orderId,
      orderBarcode,
      patientId: patient._id,
      visitId: visit._id,
      clinicId: clinic._id,
      referringDoctorId: doctor._id,
      status: "awaiting_sample",
      priority: data.priority || "routine",
      tests: orderedTestsList,
      packages: orderedPackagesList,
      pricing: {
        subtotal,
        discountPercent,
        discountAmount: discount,
        netTotal,
        paidAmount: 0,
        balanceDue,
      },
      clinicalNotes: data.clinicalNotes,
      idempotencyKey: data.idempotencyKey,
      statusHistory: [
        {
          status: "awaiting_sample",
          changedBy: actorId ? new Types.ObjectId(actorId) : undefined,
          changedAt: new Date(),
          note: "Order created.",
        },
      ],
    });

    // 9. Automatically create Sample records grouped by specimen type
    const uniqueSpecimenTypes = new Set<string>();
    for (const test of orderedTestsList) {
      uniqueSpecimenTypes.add(test.specimenType);
    }

    for (const specimen of uniqueSpecimenTypes) {
      const sampleBarcode = generateBarcodeNumber();
      await Sample.create({
        sampleBarcode,
        orderId: order._id,
        patientId: patient._id,
        clinicId: clinic._id,
        specimenType: specimen,
        status: "pending",
      });
    }

    // 10. Automatically create TestResult draft records for each ordered test
    for (const test of orderedTestsList) {
      const testDef = testDocsMap.get(test.testId.toString());
      if (testDef) {
        await TestResult.create({
          orderId: order._id,
          testId: testDef._id,
          patientId: patient._id,
          clinicId: clinic._id,
          status: "draft",
          parameterResults: testDef.parameters.map((p) => ({
            parameterCode: p.parameterCode,
            name: p.name,
            value: "",
            unit: p.unit,
            referenceRangeText: p.referenceRanges[0]?.textRange || "",
            flag: "normal",
            method: p.method,
          })),
        });
      }
    }

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "orders:create",
      entityType: "TestOrder",
      entityId: order._id.toString(),
      clinicId: clinic._id,
      details: {
        orderId: order.orderId,
        patientId: patient.patientId,
        testCount: orderedTestsList.length,
        netTotal,
      },
    });

    return order;
  }

  static async listOrders(query: {
    clinicId?: string;
    patientId?: string;
    status?: OrderStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.clinicId) filter.clinicId = new Types.ObjectId(query.clinicId);
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId);
    if (query.status) filter.status = query.status;

    if (query.search) {
      filter.$or = [
        { orderId: { $regex: query.search, $options: "i" } },
        { orderBarcode: { $regex: query.search, $options: "i" } },
      ];
    }

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) dateFilter.$gte = new Date(query.startDate);
      if (query.endDate) dateFilter.$lte = new Date(query.endDate);
      filter.createdAt = dateFilter;
    }

    const [items, total] = await Promise.all([
      TestOrder.find(filter)
        .populate(
          "patientId",
          "patientId registrationNumber fullName phone gender ageYears ageMonths",
        )
        .populate("clinicId", "name clinicCode branchCode")
        .populate("referringDoctorId", "fullName qualification specialization doctorId medicalRegistrationNumber")
        .populate("verifyingDoctorId", "fullName qualification specialization doctorId medicalRegistrationNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TestOrder.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getOrderById(id: string): Promise<ITestOrder> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid order ID.");
    }
    const order = await TestOrder.findById(id)
      .populate(
        "patientId",
        "patientId registrationNumber fullName phone gender ageYears ageMonths address",
      )
      .populate(
        "clinicId",
        "name clinicCode branchCode address contact letterheadConfig",
      )
      .populate(
        "referringDoctorId",
        "fullName qualification specialization doctorId medicalRegistrationNumber reportFooterText",
      )
      .populate(
        "verifyingDoctorId",
        "fullName qualification specialization doctorId medicalRegistrationNumber reportFooterText",
      );

    if (!order) {
      throw AppError.notFound("Test order not found.");
    }
    return order;
  }

  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    actorId?: string,
  ): Promise<ITestOrder> {
    const order = await this.getOrderById(orderId);

    const allowed = ALLOWED_STATUS_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw AppError.badRequest(
        `Invalid status transition from '${order.status}' to '${newStatus}'. Allowed transitions: ${allowed ? allowed.join(", ") : "none"}`,
      );
    }

    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      changedBy: actorId ? new Types.ObjectId(actorId) : undefined,
      changedAt: new Date(),
      note,
    });

    await order.save();

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "orders:status_change",
      entityType: "TestOrder",
      entityId: order._id.toString(),
      clinicId: order.clinicId,
      details: { newStatus, previousStatus: order.status, note },
    });

    return order;
  }
}
