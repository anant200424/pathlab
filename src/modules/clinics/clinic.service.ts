import { Types } from "mongoose";
import { Clinic, IClinic } from "./clinic.model.js";
import { AppError } from "../../common/errors/app-error.js";
import { AuditService } from "../audit/audit.service.js";

export class ClinicService {
  static async createClinic(
    data: Partial<IClinic>,
    actorId?: string,
  ): Promise<IClinic> {
    const existing = await Clinic.findOne({
      clinicCode: data.clinicCode?.toUpperCase(),
    });
    if (existing) {
      throw AppError.conflict(
        `Clinic with code '${data.clinicCode}' already exists.`,
      );
    }

    const clinic = await Clinic.create({
      ...data,
      clinicCode: data.clinicCode?.toUpperCase(),
      isActive: true,
    });

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "clinics:create",
      entityType: "Clinic",
      entityId: clinic._id.toString(),
      details: { clinicCode: clinic.clinicCode, name: clinic.name },
    });

    return clinic;
  }

  static async listClinics(query: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { clinicCode: { $regex: query.search, $options: "i" } },
        { branchCode: { $regex: query.search, $options: "i" } },
      ];
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const [items, total] = await Promise.all([
      Clinic.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Clinic.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getClinicById(id: string): Promise<IClinic> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid clinic ID.");
    }
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      throw AppError.notFound("Clinic not found.");
    }
    return clinic;
  }

  static async updateClinic(
    id: string,
    updates: Partial<IClinic>,
    actorId?: string,
  ): Promise<IClinic> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid clinic ID.");
    }
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      throw AppError.notFound("Clinic not found.");
    }

    if (
      updates.clinicCode &&
      updates.clinicCode.toUpperCase() !== clinic.clinicCode
    ) {
      const codeExists = await Clinic.findOne({
        clinicCode: updates.clinicCode.toUpperCase(),
        _id: { $ne: clinic._id },
      });
      if (codeExists) {
        throw AppError.conflict(
          `Clinic code '${updates.clinicCode}' is already in use.`,
        );
      }
      clinic.clinicCode = updates.clinicCode.toUpperCase();
    }

    Object.assign(clinic, updates);
    await clinic.save();

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "clinics:update",
      entityType: "Clinic",
      entityId: clinic._id.toString(),
      details: { updates },
    });

    return clinic;
  }

  static async deactivateClinic(
    id: string,
    actorId?: string,
  ): Promise<IClinic> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid clinic ID.");
    }
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      throw AppError.notFound("Clinic not found.");
    }

    // Archival rather than hard deletion to preserve patient and report integrity
    clinic.isActive = false;
    await clinic.save();

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "clinics:deactivate",
      entityType: "Clinic",
      entityId: clinic._id.toString(),
    });

    return clinic;
  }
}
