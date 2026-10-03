import { connectDatabase, disconnectDatabase } from "./connection.js";
import { DoctorProfile } from "../modules/doctors/doctor.model.js";
import { Clinic } from "../modules/clinics/clinic.model.js";

async function seedEpathlabDoctors() {
  await connectDatabase();

  const clinics = await Clinic.find({ isActive: true });
  const clinicIds = clinics.map((c) => c._id);

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
      associatedClinics: clinicIds,
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
      associatedClinics: clinicIds,
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
      associatedClinics: clinicIds,
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
      associatedClinics: clinicIds,
    },
    {
      doctorId: "REF-SELF",
      fullName: "SELF",
      qualification: "Self Referral",
      specialization: "Walk-in Patient",
      medicalRegistrationNumber: "SELF-WALKIN",
      contact: { phone: "+91 00000 00000" },
      isReferringDoctor: true,
      isVerifyingDoctor: false,
      isActive: true,
      associatedClinics: clinicIds,
    },
  ];

  for (const doc of doctorsToSeed) {
    const existing = await DoctorProfile.findOne({ doctorId: doc.doctorId });
    if (!existing) {
      await DoctorProfile.create(doc);
      console.log(`Created doctor: ${doc.fullName}`);
    } else {
      await DoctorProfile.updateOne({ doctorId: doc.doctorId }, { $set: doc });
      console.log(`Updated doctor: ${doc.fullName}`);
    }
  }

  console.log("Seeding completed successfully!");
  await disconnectDatabase();
  process.exit(0);
}

seedEpathlabDoctors().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
