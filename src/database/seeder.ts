import { Role } from "../modules/roles/role.model.js";
import { User } from "../modules/users/user.model.js";
import {
  SYSTEM_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
} from "../modules/roles/role.constants.js";
import { hashPassword } from "../common/utilities/crypto.util.js";
import { logger } from "../common/logging/logger.js";

export async function seedInitialData(): Promise<void> {
  try {
    // 1. Seed Roles
    const roleDocs: Record<string, typeof Role.prototype> = {};

    for (const [roleName, permissions] of Object.entries(
      DEFAULT_ROLE_PERMISSIONS,
    )) {
      const existingRole = await Role.findOne({ name: roleName });
      if (!existingRole) {
        const created = await Role.create({
          name: roleName,
          description: `System defined ${roleName} role with default operational permissions`,
          permissions,
          isSystem: true,
        });
        roleDocs[roleName] = created;
        logger.info(`Seeded role: ${roleName}`);
      } else {
        // Keep permissions updated
        existingRole.permissions = permissions;
        await existingRole.save();
        roleDocs[roleName] = existingRole;
      }
    }

    // 2. Seed Default Super Admin user if no user exists
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const superAdminRole = await Role.findOne({
        name: SYSTEM_ROLES.SUPER_ADMIN,
      });
      if (superAdminRole) {
        const passwordHash = await hashPassword("Admin@LabCarePro2026!");
        await User.create({
          email: "admin@labcarepro.internal",
          passwordHash,
          firstName: "System",
          lastName: "Administrator",
          phone: "+919876543210",
          roles: [superAdminRole._id],
          clinics: [],
          isActive: true,
          isEmailVerified: true,
        });
        logger.info(
          "Seeded default initial Super Admin account: admin@labcarepro.internal",
        );
      }
    }

    // 3. Seed Default Clinic if none exists
    const { Clinic } = await import("../modules/clinics/clinic.model.js");
    let mainClinic = await Clinic.findOne({ clinicCode: "CLN-PATNA-01" });
    if (!mainClinic) {
      mainClinic = await Clinic.create({
        name: "ShuLab Central Reference Laboratory",
        clinicCode: "CLN-PATNA-01",
        address: {
          line1: "Bailey Road, Near Medical College",
          city: "Patna",
          state: "Bihar",
          postalCode: "800001",
          country: "India",
        },
        phone: "+91 94312 99999",
        email: "central@shulab.in",
        licenseNumber: "BIH-LIMS-2026-9921",
        isActive: true,
      });
      logger.info("Seeded default reference clinic: ShuLab Central Reference Laboratory");
    }

    // 4. Seed ePathLab Doctors if none exist
    const { DoctorProfile } = await import("../modules/doctors/doctor.model.js");
    const docCount = await DoctorProfile.countDocuments();
    if (docCount === 0 && mainClinic) {
      const doctorsToSeed = [
        {
          doctorId: "DOC-UPADHYAY",
          fullName: "DR N UPADHYAY",
          qualification: "M. B. B. S  M.D",
          specialization: "MICROBIOLOGIST",
          medicalRegistrationNumber: "41175",
          contact: { phone: "+91 94312 00001", email: "dr.upadhyay@epathlab.in" },
          isReferringDoctor: true,
          isVerifyingDoctor: true,
          reportFooterText: "Verified by Consultant Microbiologist",
          isActive: true,
          associatedClinics: [mainClinic._id],
        },
        {
          doctorId: "DOC-GUPTA",
          fullName: "DR MANOJ KUMAR GUPTA",
          qualification: "M.B.B.S",
          specialization: "Consultant Physician",
          medicalRegistrationNumber: "28419",
          contact: { phone: "+91 94312 00002" },
          isReferringDoctor: true,
          isVerifyingDoctor: false,
          isActive: true,
          associatedClinics: [mainClinic._id],
        },
        {
          doctorId: "REF-DIVY",
          fullName: "DIVY NURSING HOME",
          qualification: "Referral Nursing Home / Hospital",
          specialization: "Hospital & Medical Care",
          medicalRegistrationNumber: "DIVY-HOSP-01",
          contact: { phone: "+91 94312 00003" },
          isReferringDoctor: true,
          isVerifyingDoctor: false,
          isActive: true,
          associatedClinics: [mainClinic._id],
        },
        {
          doctorId: "REF-JLNMC",
          fullName: "J.L.N.M.C.H",
          qualification: "Jawaharlal Nehru Medical College Hospital",
          specialization: "Tertiary Healthcare Center",
          medicalRegistrationNumber: "JLNMCH-01",
          contact: { phone: "+91 94312 00004" },
          isReferringDoctor: true,
          isVerifyingDoctor: false,
          isActive: true,
          associatedClinics: [mainClinic._id],
        },
        {
          doctorId: "REF-SELF",
          fullName: "SELF",
          qualification: "Direct Walk-in Patient",
          specialization: "General Consultation",
          medicalRegistrationNumber: "WALK-IN",
          contact: { phone: "+91 94312 00000" },
          isReferringDoctor: true,
          isVerifyingDoctor: false,
          isActive: true,
          associatedClinics: [mainClinic._id],
        },
      ];
      await DoctorProfile.insertMany(doctorsToSeed);
      logger.info("Seeded 5 ePathLab doctors including DR N UPADHYAY (DOC-UPADHYAY)");
    }
  } catch (err) {
    logger.error({ err }, "Error during initial database seeding");
  }
}
