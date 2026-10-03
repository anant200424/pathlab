import { Types } from "mongoose";
import { Patient, IPatient } from "./patient.model.js";
import { Visit, IVisit } from "./visit.model.js";
import { Clinic } from "../clinics/clinic.model.js";
import { DoctorProfile } from "../doctors/doctor.model.js";
import { AppError } from "../../common/errors/app-error.js";
import { generateCustomId } from "../../common/utilities/id-generator.util.js";
import { AuditService } from "../audit/audit.service.js";

export interface PatientRegistrationResult {
  patient: IPatient;
  visit?: IVisit;
  warning?: string;
}

export class PatientService {
  static async registerPatient(
    data: {
      fullName?: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      ageYears?: number;
      ageMonths?: number;
      gender: "male" | "female" | "other";
      phone: string;
      email?: string;
      bloodGroup?: string;
      address?: {
        line1?: string;
        street?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
      emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
      };
      clinicId?: string;
      defaultReferringDoctorId?: string;
      createInitialVisit?: boolean;
      visitType?: "outpatient" | "inpatient" | "home_collection" | "referral";
      visitNotes?: string;
    },
    actorId?: string,
  ): Promise<PatientRegistrationResult> {
    let clinic = null;
    if (data.clinicId && Types.ObjectId.isValid(data.clinicId)) {
      clinic = await Clinic.findById(data.clinicId);
    }
    if (!clinic || !clinic.isActive) {
      clinic = await Clinic.findOne({ isActive: true });
    }
    if (!clinic || !clinic.isActive) {
      throw AppError.badRequest("No active clinic found. Please create or activate a clinic first.");
    }

    if (data.defaultReferringDoctorId) {
      if (!Types.ObjectId.isValid(data.defaultReferringDoctorId)) {
        throw AppError.badRequest("Invalid referring doctor ID.");
      }
      const doc = await DoctorProfile.findById(data.defaultReferringDoctorId);
      if (!doc || !doc.isActive) {
        throw AppError.badRequest("Doctor not found or inactive.");
      }
    }

    const fullName =
      data.fullName?.trim() ||
      `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
      "Unknown Patient";

    // Check for duplicate warning (same phone in this clinic)
    let warning: string | undefined;
    const existingSamePhone = await Patient.findOne({
      phone: data.phone,
      clinicId: clinic._id,
      isActive: true,
    });
    if (existingSamePhone) {
      warning = `Warning: A patient (${existingSamePhone.fullName}, ID: ${existingSamePhone.patientId}) is already registered with phone ${data.phone}. A new patient profile has been registered as requested without merging records.`;
    }

    const patientId = generateCustomId("PAT", 4);
    const registrationNumber = generateCustomId("REG", 4);

    const address = {
      line1: data.address?.line1 || data.address?.street || "",
      line2: data.address?.line2,
      city: data.address?.city || "",
      state: data.address?.state || "",
      postalCode: data.address?.postalCode,
      country: data.address?.country || "India",
    };

    const patient = await Patient.create({
      patientId,
      registrationNumber,
      fullName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      ageYears: data.ageYears,
      ageMonths: data.ageMonths,
      gender: data.gender,
      phone: data.phone,
      email: data.email || undefined,
      bloodGroup: data.bloodGroup || undefined,
      address,
      emergencyContact: data.emergencyContact,
      clinicId: clinic._id,
      defaultReferringDoctorId: data.defaultReferringDoctorId
        ? new Types.ObjectId(data.defaultReferringDoctorId)
        : undefined,
      consentAcknowledged: true,
      consentDate: new Date(),
      isActive: true,
    });

    let visit: IVisit | undefined;
    if (data.createInitialVisit) {
      const visitNumber = generateCustomId("VIS", 4);
      visit = await Visit.create({
        visitNumber,
        patientId: patient._id,
        clinicId: clinic._id,
        referringDoctorId: patient.defaultReferringDoctorId,
        visitType: data.visitType || "outpatient",
        notes: data.visitNotes,
        isActive: true,
      });
    }

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "patients:register",
      entityType: "Patient",
      entityId: patient._id.toString(),
      clinicId: clinic._id,
      details: {
        patientId: patient.patientId,
        registrationNumber: patient.registrationNumber,
        visitNumber: visit?.visitNumber,
      },
    });

    return { patient, visit, warning };
  }

  static async listPatients(query: {
    clinicId?: string;
    search?: string;
    phone?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };

    if (query.clinicId) {
      filter.clinicId = new Types.ObjectId(query.clinicId);
    }

    if (query.phone) {
      filter.phone = { $regex: query.phone, $options: "i" };
    }

    if (query.search) {
      filter.$or = [
        { fullName: { $regex: query.search, $options: "i" } },
        { patientId: { $regex: query.search, $options: "i" } },
        { registrationNumber: { $regex: query.search, $options: "i" } },
        { phone: { $regex: query.search, $options: "i" } },
      ];
    }

    if (query.startDate || query.endDate) {
      const createdAtFilter: Record<string, Date> = {};
      if (query.startDate) createdAtFilter.$gte = new Date(query.startDate);
      if (query.endDate) createdAtFilter.$lte = new Date(query.endDate);
      filter.createdAt = createdAtFilter;
    }

    const [items, total] = await Promise.all([
      Patient.find(filter)
        .populate("clinicId", "name clinicCode branchCode")
        .populate("defaultReferringDoctorId", "fullName qualification doctorId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Patient.countDocuments(filter),
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

  static async getPatientById(id: string): Promise<IPatient> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid patient ID.");
    }

    const patient = await Patient.findById(id)
      .populate("clinicId", "name clinicCode branchCode")
      .populate("defaultReferringDoctorId", "fullName qualification doctorId");

    if (!patient) {
      throw AppError.notFound("Patient record not found.");
    }

    return patient;
  }

  static async updatePatient(
    id: string,
    updates: Partial<IPatient>,
    actorId?: string,
  ): Promise<IPatient> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid patient ID.");
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      throw AppError.notFound("Patient record not found.");
    }

    // Never allow updating patientId or registrationNumber directly
    delete updates.patientId;
    delete updates.registrationNumber;

    Object.assign(patient, updates);
    await patient.save();

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "patients:update",
      entityType: "Patient",
      entityId: patient._id.toString(),
      clinicId: patient.clinicId,
      details: { updates },
    });

    return patient;
  }

  static async getPatientHistory(patientId: string) {
    if (!Types.ObjectId.isValid(patientId)) {
      throw AppError.badRequest("Invalid patient ID.");
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw AppError.notFound("Patient record not found.");
    }

    const visits = await Visit.find({ patientId: patient._id })
      .populate("referringDoctorId", "fullName qualification doctorId")
      .sort({ createdAt: -1 });

    return {
      patient,
      visits,
    };
  }
}
