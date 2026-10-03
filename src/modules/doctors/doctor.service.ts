import { Types } from "mongoose";
import { DoctorProfile, IDoctorProfile } from "./doctor.model.js";
import {
  DoctorAsset,
  DoctorAssetType,
  IDoctorAsset,
} from "./doctor-asset.model.js";
import { Clinic } from "../clinics/clinic.model.js";
import { AppError } from "../../common/errors/app-error.js";
import { generateCustomId } from "../../common/utilities/id-generator.util.js";
import { getStorageProvider } from "../../storage/storage.factory.js";
import { AuditService } from "../audit/audit.service.js";

export class DoctorService {
  static async createDoctor(
    data: {
      fullName: string;
      qualification: string;
      specialization?: string;
      medicalRegistrationNumber: string;
      contact: { phone: string; email?: string };
      associatedClinics: string[];
      isReferringDoctor?: boolean;
      isVerifyingDoctor?: boolean;
      reportFooterText?: string;
    },
    actorId?: string,
  ): Promise<IDoctorProfile> {
    // Validate clinics exist
    const clinicObjectIds: Types.ObjectId[] = [];
    for (const cId of data.associatedClinics) {
      if (!Types.ObjectId.isValid(cId)) {
        throw AppError.badRequest(`Invalid clinic ID: ${cId}`);
      }
      const clinic = await Clinic.findById(cId);
      if (!clinic || !clinic.isActive) {
        throw AppError.badRequest(`Clinic not found or inactive: ${cId}`);
      }
      clinicObjectIds.push(clinic._id as Types.ObjectId);
    }

    const doctorId = generateCustomId("DOC", 4);

    const doctor = await DoctorProfile.create({
      doctorId,
      fullName: data.fullName,
      qualification: data.qualification,
      specialization: data.specialization,
      medicalRegistrationNumber: data.medicalRegistrationNumber,
      contact: data.contact,
      associatedClinics: clinicObjectIds,
      isReferringDoctor: data.isReferringDoctor ?? true,
      isVerifyingDoctor: data.isVerifyingDoctor ?? false,
      reportFooterText: data.reportFooterText,
      isActive: true,
    });

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "doctors:create",
      entityType: "DoctorProfile",
      entityId: doctor._id.toString(),
      details: { doctorId: doctor.doctorId, fullName: doctor.fullName },
    });

    return doctor;
  }

  static async listDoctors(query: {
    clinicId?: string;
    isVerifying?: boolean;
    isReferring?: boolean;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.clinicId) {
      filter.associatedClinics = new Types.ObjectId(query.clinicId);
    }
    if (query.isVerifying !== undefined) {
      filter.isVerifyingDoctor = query.isVerifying;
    }
    if (query.isReferring !== undefined) {
      filter.isReferringDoctor = query.isReferring;
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }
    if (query.search) {
      filter.$or = [
        { fullName: { $regex: query.search, $options: "i" } },
        { doctorId: { $regex: query.search, $options: "i" } },
        { medicalRegistrationNumber: { $regex: query.search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      DoctorProfile.find(filter)
        .populate("associatedClinics", "name clinicCode branchCode")
        .populate(
          "signatureAssetId stampAssetId logoAssetId letterheadAssetId parchiAssetId",
        )
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit),
      DoctorProfile.countDocuments(filter),
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

  static async getDoctorsForClinicDropdown(clinicId: string) {
    if (!Types.ObjectId.isValid(clinicId)) {
      throw AppError.badRequest("Invalid clinic ID.");
    }

    // Return only active doctors associated with this clinic, with minimal necessary fields
    const doctors = await DoctorProfile.find({
      associatedClinics: new Types.ObjectId(clinicId),
      isActive: true,
    })
      .select(
        "doctorId fullName qualification specialization isReferringDoctor isVerifyingDoctor",
      )
      .sort({ fullName: 1 })
      .lean();

    return doctors.map((doc) => ({
      id: doc._id.toString(),
      doctorId: doc.doctorId,
      displayName: `Dr. ${doc.fullName}`,
      qualification: doc.qualification,
      specialization: doc.specialization || "General",
      isReferring: doc.isReferringDoctor,
      isVerifying: doc.isVerifyingDoctor,
    }));
  }

  static async getDoctorById(id: string): Promise<IDoctorProfile> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid doctor profile ID.");
    }
    const doctor = await DoctorProfile.findById(id)
      .populate("associatedClinics", "name clinicCode branchCode")
      .populate(
        "signatureAssetId stampAssetId logoAssetId letterheadAssetId parchiAssetId",
      );

    if (!doctor) {
      throw AppError.notFound("Doctor profile not found.");
    }
    return doctor;
  }

  static async uploadDoctorAsset(
    doctorId: string,
    assetType: DoctorAssetType,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    actorId?: string,
  ): Promise<IDoctorAsset> {
    const doctor = await this.getDoctorById(doctorId);

    // Validate mime type: only images allowed
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      throw AppError.badRequest(
        "Invalid asset format. Only PNG, JPEG, and WEBP image files are allowed.",
      );
    }

    // Validate size: max 5MB
    if (fileBuffer.length > 5 * 1024 * 1024) {
      throw AppError.badRequest(
        "Asset file exceeds maximum allowed size of 5MB.",
      );
    }

    const storage = getStorageProvider();
    const ext = originalFilename.split(".").pop() || "png";
    const storageKey = `doctors/${doctor.doctorId}/${assetType}-${Date.now()}.${ext}`;

    await storage.upload(storageKey, fileBuffer, mimeType, {
      doctorId: doctor._id.toString(),
      assetType,
    });

    const asset = await DoctorAsset.create({
      doctorId: doctor._id,
      assetType,
      storageKey,
      originalFilename,
      mimeType,
      fileSizeBytes: fileBuffer.length,
      isApproved: false, // Requires explicit admin approval
      isActive: true,
    });

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "doctor_assets:upload",
      entityType: "DoctorAsset",
      entityId: asset._id.toString(),
      details: { doctorId: doctor._id, assetType, storageKey },
    });

    return asset;
  }

  static async approveDoctorAsset(
    assetId: string,
    approved: boolean,
    actorId: string,
  ): Promise<IDoctorAsset> {
    if (!Types.ObjectId.isValid(assetId)) {
      throw AppError.badRequest("Invalid asset ID.");
    }

    const asset = await DoctorAsset.findById(assetId);
    if (!asset) {
      throw AppError.notFound("Doctor asset not found.");
    }

    asset.isApproved = approved;
    asset.approvedBy = new Types.ObjectId(actorId);
    asset.approvedAt = new Date();
    await asset.save();

    const doctor = await DoctorProfile.findById(asset.doctorId);
    if (doctor) {
      if (approved) {
        if (asset.assetType === "signature")
          doctor.signatureAssetId = asset._id as Types.ObjectId;
        if (asset.assetType === "stamp")
          doctor.stampAssetId = asset._id as Types.ObjectId;
        if (asset.assetType === "logo")
          doctor.logoAssetId = asset._id as Types.ObjectId;
        if (asset.assetType === "letterhead")
          doctor.letterheadAssetId = asset._id as Types.ObjectId;
        if (asset.assetType === "parchi")
          doctor.parchiAssetId = asset._id as Types.ObjectId;
      } else {
        // Disassociate if revoked
        if (
          asset.assetType === "signature" &&
          doctor.signatureAssetId?.equals(asset._id as Types.ObjectId)
        ) {
          doctor.signatureAssetId = undefined;
        }
        if (
          asset.assetType === "stamp" &&
          doctor.stampAssetId?.equals(asset._id as Types.ObjectId)
        ) {
          doctor.stampAssetId = undefined;
        }
      }
      await doctor.save();
    }

    await AuditService.log({
      actorId: new Types.ObjectId(actorId),
      action: approved ? "doctor_assets:approved" : "doctor_assets:rejected",
      entityType: "DoctorAsset",
      entityId: asset._id.toString(),
      details: { approved, assetType: asset.assetType },
    });

    return asset;
  }

  static async getAssetSignedUrl(
    assetId: string,
  ): Promise<{ url: string; asset: IDoctorAsset }> {
    if (!Types.ObjectId.isValid(assetId)) {
      throw AppError.badRequest("Invalid asset ID.");
    }

    const asset = await DoctorAsset.findById(assetId);
    if (!asset) {
      throw AppError.notFound("Doctor asset not found.");
    }

    const storage = getStorageProvider();
    const url = await storage.getSignedUrl(asset.storageKey, 900); // 15 mins expiry

    return { url, asset };
  }
}
