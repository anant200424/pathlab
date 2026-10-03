import { Types } from "mongoose";
import { Sample, ISample } from "./sample.model.js";
import { TestOrder } from "../orders/order.model.js";
import { AppError } from "../../common/errors/app-error.js";
import { AuditService } from "../audit/audit.service.js";

export class SampleService {
  static async listSamples(query: {
    orderId?: string;
    clinicId?: string;
    status?: string;
    specimenType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.orderId) filter.orderId = new Types.ObjectId(query.orderId);
    if (query.clinicId) filter.clinicId = new Types.ObjectId(query.clinicId);
    if (query.status) filter.status = query.status;
    if (query.specimenType) filter.specimenType = query.specimenType;

    const [items, total] = await Promise.all([
      Sample.find(filter)
        .populate(
          "patientId",
          "fullName patientId phone gender ageYears ageMonths",
        )
        .populate("orderId", "orderId priority status")
        .populate("collectedBy", "firstName lastName")
        .populate("receivedBy", "firstName lastName")
        .populate("rejectedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Sample.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getSampleByBarcode(barcode: string): Promise<ISample> {
    const sample = await Sample.findOne({ sampleBarcode: barcode })
      .populate(
        "patientId",
        "fullName patientId phone gender ageYears ageMonths",
      )
      .populate("orderId", "orderId priority status tests")
      .populate("collectedBy", "firstName lastName")
      .populate("receivedBy", "firstName lastName");

    if (!sample) {
      throw AppError.notFound(`Sample with barcode '${barcode}' not found.`);
    }
    return sample;
  }

  static async recordCollection(
    sampleId: string,
    notes?: string,
    actorId?: string,
  ): Promise<ISample> {
    if (!Types.ObjectId.isValid(sampleId)) {
      throw AppError.badRequest("Invalid sample ID.");
    }
    const sample = await Sample.findById(sampleId);
    if (!sample) {
      throw AppError.notFound("Sample not found.");
    }

    sample.status = "collected";
    sample.collectedBy = actorId ? new Types.ObjectId(actorId) : undefined;
    sample.collectedAt = new Date();
    if (notes) sample.notes = notes;
    await sample.save();

    // Check if order can be advanced to sample_collected
    const order = await TestOrder.findById(sample.orderId);
    if (order && order.status === "awaiting_sample") {
      order.status = "sample_collected";
      order.statusHistory.push({
        status: "sample_collected",
        changedBy: actorId ? new Types.ObjectId(actorId) : undefined,
        changedAt: new Date(),
        note: `Sample ${sample.sampleBarcode} collected.`,
      });
      await order.save();
    }

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "samples:collect",
      entityType: "Sample",
      entityId: sample._id.toString(),
      clinicId: sample.clinicId,
      details: {
        barcode: sample.sampleBarcode,
        specimenType: sample.specimenType,
      },
    });

    return sample;
  }

  static async acceptSample(
    sampleId: string,
    notes?: string,
    actorId?: string,
  ): Promise<ISample> {
    if (!Types.ObjectId.isValid(sampleId)) {
      throw AppError.badRequest("Invalid sample ID.");
    }
    const sample = await Sample.findById(sampleId);
    if (!sample) {
      throw AppError.notFound("Sample not found.");
    }

    sample.status = "accepted";
    sample.receivedBy = actorId ? new Types.ObjectId(actorId) : undefined;
    sample.receivedAt = new Date();
    if (notes) sample.notes = notes;
    await sample.save();

    // Advance order to processing if not already
    const order = await TestOrder.findById(sample.orderId);
    if (
      order &&
      (order.status === "sample_collected" ||
        order.status === "awaiting_sample")
    ) {
      order.status = "processing";
      order.statusHistory.push({
        status: "processing",
        changedBy: actorId ? new Types.ObjectId(actorId) : undefined,
        changedAt: new Date(),
        note: `Sample ${sample.sampleBarcode} received in lab.`,
      });
      await order.save();
    }

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "samples:accept",
      entityType: "Sample",
      entityId: sample._id.toString(),
      clinicId: sample.clinicId,
      details: { barcode: sample.sampleBarcode },
    });

    return sample;
  }

  static async rejectSample(
    sampleId: string,
    rejectionReason: string,
    actorId?: string,
  ): Promise<ISample> {
    if (!Types.ObjectId.isValid(sampleId)) {
      throw AppError.badRequest("Invalid sample ID.");
    }
    const sample = await Sample.findById(sampleId);
    if (!sample) {
      throw AppError.notFound("Sample not found.");
    }

    sample.status = "rejected";
    sample.rejectionReason = rejectionReason;
    sample.rejectedBy = actorId ? new Types.ObjectId(actorId) : undefined;
    sample.rejectedAt = new Date();
    await sample.save();

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "samples:reject",
      entityType: "Sample",
      entityId: sample._id.toString(),
      clinicId: sample.clinicId,
      details: { barcode: sample.sampleBarcode, rejectionReason },
    });

    return sample;
  }

  static async recollectSample(
    sampleId: string,
    recollectionReason: string,
    actorId?: string,
  ): Promise<ISample> {
    if (!Types.ObjectId.isValid(sampleId)) {
      throw AppError.badRequest("Invalid sample ID.");
    }
    const sample = await Sample.findById(sampleId);
    if (!sample) {
      throw AppError.notFound("Sample not found.");
    }

    sample.status = "recollected";
    sample.recollectionReason = recollectionReason;
    await sample.save();

    // Reopen sample awaiting status on order
    const order = await TestOrder.findById(sample.orderId);
    if (order && order.status !== "cancelled" && order.status !== "published") {
      order.status = "awaiting_sample";
      order.statusHistory.push({
        status: "awaiting_sample",
        changedBy: actorId ? new Types.ObjectId(actorId) : undefined,
        changedAt: new Date(),
        note: `Recollection requested for specimen ${sample.specimenType}: ${recollectionReason}`,
      });
      await order.save();
    }

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "samples:recollect",
      entityType: "Sample",
      entityId: sample._id.toString(),
      clinicId: sample.clinicId,
      details: { barcode: sample.sampleBarcode, recollectionReason },
    });

    return sample;
  }
}
