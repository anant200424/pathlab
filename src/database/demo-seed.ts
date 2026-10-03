import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

import { connectDatabase } from "./connection.js";
import { Clinic } from "../modules/clinics/clinic.model.js";
import { User } from "../modules/users/user.model.js";
import { DoctorProfile } from "../modules/doctors/doctor.model.js";
import { TestDefinition } from "../modules/tests/test-definition.model.js";
import { TestPackage } from "../modules/tests/test-package.model.js";
import { Patient } from "../modules/patients/patient.model.js";
import { TestOrder } from "../modules/orders/order.model.js";
import { Visit } from "../modules/patients/visit.model.js";
import { Sample } from "../modules/samples/sample.model.js";
import { TestResult } from "../modules/results/result.model.js";
import { InventoryItem } from "../modules/inventory/inventory.model.js";
import { logger } from "../common/logging/logger.js";

async function runSeed() {
  try {
    logger.info("Connecting to MongoDB Atlas for demo data seeding...");
    await connectDatabase();

    // 1. Clinics
    let clinic1 = await Clinic.findOne({ clinicCode: "CLINIC-001" });
    if (!clinic1) {
      clinic1 = await Clinic.create({
        clinicCode: "CLINIC-001",
        name: "Apex Central Reference Laboratory",
        branchCode: "MUM-REF",
        address: {
          line1: "Suite 401, MediTower, Andheri East",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400069",
          country: "India",
        },
        contact: {
          phone: "+91 22 2847 1100",
          email: "mumbai.lab@labcarepro.internal",
          website: "https://labcarepro.internal",
        },
        isActive: true,
      });
      logger.info("Created clinic: Apex Central Reference Laboratory");
    }

    let clinic2 = await Clinic.findOne({ clinicCode: "CLINIC-002" });
    if (!clinic2) {
      clinic2 = await Clinic.create({
        clinicCode: "CLINIC-002",
        name: "Apex Diagnostics & Collection Centre",
        branchCode: "PUN-COLL",
        address: {
          line1: "Ground Floor, Health Plaza, FC Road",
          city: "Pune",
          state: "Maharashtra",
          postalCode: "411005",
          country: "India",
        },
        contact: {
          phone: "+91 20 6789 2200",
          email: "pune.branch@labcarepro.internal",
        },
        isActive: true,
      });
      logger.info("Created clinic: Apex Diagnostics Pune");
    }

    // Associate admin user with clinics
    const adminUser = await User.findOne({ email: "admin@labcarepro.internal" });
    if (adminUser) {
      adminUser.clinics = [clinic1._id as any, clinic2._id as any];
      await adminUser.save();
      logger.info("Updated admin user with clinic access.");
    }

    // 2. Doctor Profiles
    let doc1 = await DoctorProfile.findOne({ doctorId: "DOC-001" });
    if (!doc1) {
      doc1 = await DoctorProfile.create({
        doctorId: "DOC-001",
        fullName: "Dr. Rajesh Sharma, MD",
        qualification: "MBBS, MD (Pathology)",
        specialization: "Clinical Pathology & Hematology",
        medicalRegistrationNumber: "MCI-48291-MH",
        contact: {
          phone: "+91 98201 12345",
          email: "dr.rajesh@labcarepro.internal",
        },
        associatedClinics: [clinic1._id, clinic2._id],
        isReferringDoctor: true,
        isVerifyingDoctor: true,
        isActive: true,
      });
      logger.info("Created doctor: Dr. Rajesh Sharma");
    }

    let doc2 = await DoctorProfile.findOne({ doctorId: "DOC-002" });
    if (!doc2) {
      doc2 = await DoctorProfile.create({
        doctorId: "DOC-002",
        fullName: "Dr. Priya Nair, MD",
        qualification: "MBBS, MD (Biochemistry)",
        specialization: "Clinical Biochemistry",
        medicalRegistrationNumber: "MCI-63104-MH",
        contact: {
          phone: "+91 98202 54321",
          email: "dr.priya@labcarepro.internal",
        },
        associatedClinics: [clinic1._id],
        isReferringDoctor: true,
        isVerifyingDoctor: true,
        isActive: true,
      });
      logger.info("Created doctor: Dr. Priya Nair");
    }

    // 3. Test Definitions
    let cbcTest = await TestDefinition.findOne({ testCode: "CBC" });
    if (!cbcTest) {
      cbcTest = await TestDefinition.create({
        testCode: "CBC",
        name: "Complete Blood Count (CBC) with ESR",
        department: "Hematology",
        category: "Routine Blood",
        specimenType: "EDTA Whole Blood",
        turnaroundTimeHours: 4,
        price: 450,
        parameters: [
          {
            parameterCode: "HB",
            name: "Hemoglobin",
            unit: "g/dL",
            dataType: "numeric",
            displayOrder: 1,
            referenceRanges: [
              { gender: "male", normalMin: 13.5, normalMax: 17.5, criticalLow: 7.0, criticalHigh: 20.0 },
              { gender: "female", normalMin: 12.0, normalMax: 15.5, criticalLow: 7.0, criticalHigh: 19.0 },
            ],
          },
          {
            parameterCode: "RBC",
            name: "Total RBC Count",
            unit: "mil/uL",
            dataType: "numeric",
            displayOrder: 2,
            referenceRanges: [
              { gender: "male", normalMin: 4.5, normalMax: 5.9 },
              { gender: "female", normalMin: 4.0, normalMax: 5.2 },
            ],
          },
          {
            parameterCode: "WBC",
            name: "Total Leucocyte Count (WBC)",
            unit: "/uL",
            dataType: "numeric",
            displayOrder: 3,
            referenceRanges: [
              { gender: "both", normalMin: 4000, normalMax: 11000, criticalLow: 2000, criticalHigh: 30000 },
            ],
          },
          {
            parameterCode: "PLT",
            name: "Platelet Count",
            unit: "lakh/uL",
            dataType: "numeric",
            displayOrder: 4,
            referenceRanges: [
              { gender: "both", normalMin: 1.5, normalMax: 4.5, criticalLow: 0.5, criticalHigh: 8.0 },
            ],
          },
        ],
        isActive: true,
        version: 1,
      });
      logger.info("Created test definition: CBC");
    }

    let fbsTest = await TestDefinition.findOne({ testCode: "FBS" });
    if (!fbsTest) {
      fbsTest = await TestDefinition.create({
        testCode: "FBS",
        name: "Blood Glucose - Fasting",
        department: "Biochemistry",
        category: "Diabetic Panel",
        specimenType: "Sodium Fluoride Plasma",
        turnaroundTimeHours: 2,
        price: 150,
        parameters: [
          {
            parameterCode: "GLU_F",
            name: "Fasting Blood Sugar",
            unit: "mg/dL",
            dataType: "numeric",
            displayOrder: 1,
            referenceRanges: [
              { gender: "both", normalMin: 70, normalMax: 99, criticalLow: 50, criticalHigh: 350 },
            ],
          },
        ],
        isActive: true,
        version: 1,
      });
      logger.info("Created test definition: FBS");
    }

    let lipidTest = await TestDefinition.findOne({ testCode: "LIPID" });
    if (!lipidTest) {
      lipidTest = await TestDefinition.create({
        testCode: "LIPID",
        name: "Lipid Profile Panel",
        department: "Biochemistry",
        category: "Cardiac Risk",
        specimenType: "Serum",
        turnaroundTimeHours: 6,
        price: 850,
        parameters: [
          {
            parameterCode: "CHOL",
            name: "Total Cholesterol",
            unit: "mg/dL",
            dataType: "numeric",
            displayOrder: 1,
            referenceRanges: [
              { gender: "both", normalMin: 125, normalMax: 200, criticalHigh: 300 },
            ],
          },
          {
            parameterCode: "HDL",
            name: "HDL Cholesterol (Good)",
            unit: "mg/dL",
            dataType: "numeric",
            displayOrder: 2,
            referenceRanges: [
              { gender: "male", normalMin: 40, normalMax: 60 },
              { gender: "female", normalMin: 50, normalMax: 70 },
            ],
          },
          {
            parameterCode: "LDL",
            name: "LDL Cholesterol (Calculated)",
            unit: "mg/dL",
            dataType: "numeric",
            displayOrder: 3,
            referenceRanges: [
              { gender: "both", normalMin: 0, normalMax: 100, criticalHigh: 190 },
            ],
          },
          {
            parameterCode: "TRIG",
            name: "Triglycerides",
            unit: "mg/dL",
            dataType: "numeric",
            displayOrder: 4,
            referenceRanges: [
              { gender: "both", normalMin: 50, normalMax: 150, criticalHigh: 500 },
            ],
          },
        ],
        isActive: true,
        version: 1,
      });
      logger.info("Created test definition: Lipid Profile");
    }

    let thyroidTest = await TestDefinition.findOne({ testCode: "TFT" });
    if (!thyroidTest) {
      thyroidTest = await TestDefinition.create({
        testCode: "TFT",
        name: "Thyroid Profile (Total T3, T4, TSH)",
        department: "Immunoassay",
        category: "Endocrinology",
        specimenType: "Serum",
        turnaroundTimeHours: 6,
        price: 650,
        parameters: [
          {
            parameterCode: "TSH",
            name: "Ultrasensitive TSH",
            unit: "uIU/mL",
            dataType: "numeric",
            displayOrder: 1,
            referenceRanges: [
              { gender: "both", normalMin: 0.35, normalMax: 4.94, criticalLow: 0.05, criticalHigh: 20.0 },
            ],
          },
        ],
        isActive: true,
        version: 1,
      });
      logger.info("Created test definition: Thyroid Profile");
    }

    // 4. Test Package
    let wellnessPkg = await TestPackage.findOne({ packageCode: "WELL-01" });
    if (!wellnessPkg) {
      wellnessPkg = await TestPackage.create({
        packageCode: "WELL-01",
        name: "Standard Wellness Health Check",
        description: "Includes Complete Blood Count, Blood Glucose Fasting, and Complete Lipid Profile",
        tests: [cbcTest._id, fbsTest._id, lipidTest._id],
        price: 999,
        originalPrice: 1450,
        isActive: true,
      });
      logger.info("Created package: Standard Wellness Health Check");
    }

    // 5. Patients
    let pat1 = await Patient.findOne({ patientId: "PAT-2026-001" });
    if (!pat1) {
      pat1 = await Patient.create({
        patientId: "PAT-2026-001",
        registrationNumber: "REG-2026-0001",
        fullName: "Ramesh Chand Patel",
        dateOfBirth: new Date("1982-04-15"),
        ageYears: 44,
        gender: "male",
        phone: "+919821098765",
        email: "ramesh.patel@example.com",
        address: {
          line1: "Flat 204, Shanti Apartments, JVPD",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400049",
          country: "India",
        },
        clinicId: clinic1._id,
        defaultReferringDoctorId: doc1._id,
        consentAcknowledged: true,
        isActive: true,
      });
      logger.info("Created patient: Ramesh Patel");
    }

    let pat2 = await Patient.findOne({ patientId: "PAT-2026-002" });
    if (!pat2) {
      pat2 = await Patient.create({
        patientId: "PAT-2026-002",
        registrationNumber: "REG-2026-0002",
        fullName: "Sunita Rajesh Verma",
        dateOfBirth: new Date("1991-08-22"),
        ageYears: 34,
        gender: "female",
        phone: "+919820543210",
        email: "sunita.verma@example.com",
        address: {
          line1: "B-12, Green Acres Society, Kothrud",
          city: "Pune",
          state: "Maharashtra",
          postalCode: "411038",
          country: "India",
        },
        clinicId: clinic2._id,
        defaultReferringDoctorId: doc2._id,
        consentAcknowledged: true,
        isActive: true,
      });
      logger.info("Created patient: Sunita Verma");
    }

    let pat3 = await Patient.findOne({ patientId: "PAT-2026-003" });
    if (!pat3) {
      pat3 = await Patient.create({
        patientId: "PAT-2026-003",
        registrationNumber: "REG-2026-0003",
        fullName: "Amitabh Vikram Sen",
        dateOfBirth: new Date("1968-12-05"),
        ageYears: 57,
        gender: "male",
        phone: "+919819912345",
        email: "amit.sen@example.com",
        address: {
          line1: "15, Marina Sea Face, Worli",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400018",
          country: "India",
        },
        clinicId: clinic1._id,
        defaultReferringDoctorId: doc1._id,
        consentAcknowledged: true,
        isActive: true,
      });
      logger.info("Created patient: Amitabh Sen");
    }

    // 6. Patient Visits & Orders
    let order1 = await TestOrder.findOne({ orderId: "ORD-2026-0001" });
    if (!order1) {
      const visit1 = await Visit.create({
        patientId: pat1._id,
        clinicId: clinic1._id,
        visitNumber: "VIS-2026-0001",
        referringDoctorId: doc1._id,
        status: "active",
      });

      order1 = await TestOrder.create({
        orderId: "ORD-2026-0001",
        orderBarcode: "LCP-2026-0001",
        patientId: pat1._id,
        visitId: visit1._id,
        clinicId: clinic1._id,
        referringDoctorId: doc1._id,
        status: "verified",
        priority: "routine",
        tests: [
          {
            testId: cbcTest._id,
            testCode: "CBC",
            name: cbcTest.name,
            price: 450,
            specimenType: "EDTA Whole Blood",
            status: "completed",
          },
          {
            testId: fbsTest._id,
            testCode: "FBS",
            name: fbsTest.name,
            price: 150,
            specimenType: "Sodium Fluoride Plasma",
            status: "completed",
          },
        ],
        packages: [],
        pricing: {
          subtotal: 600,
          discountPercent: 0,
          discountAmount: 0,
          netTotal: 600,
          paidAmount: 600,
          balanceDue: 0,
        },
        statusHistory: [
          { status: "registered", changedAt: new Date(Date.now() - 3600000 * 5) },
          { status: "sample_collected", changedAt: new Date(Date.now() - 3600000 * 4) },
          { status: "processing", changedAt: new Date(Date.now() - 3600000 * 3) },
          { status: "verified", changedAt: new Date(Date.now() - 3600000 * 1) },
        ],
      });

      // Sample
      await Sample.create({
        sampleBarcode: "SMP-2026-001",
        orderId: order1._id,
        patientId: pat1._id,
        clinicId: clinic1._id,
        specimenType: "EDTA Whole Blood",
        status: "accepted",
        collectedAt: new Date(Date.now() - 3600000 * 4),
        receivedAt: new Date(Date.now() - 3600000 * 3.5),
      });

      // Test Result for CBC
      await TestResult.create({
        orderId: order1._id,
        testId: cbcTest._id,
        status: "verified",
        parameterResults: [
          { parameterCode: "HB", name: "Hemoglobin", value: 14.8, unit: "g/dL", flag: "normal", referenceRange: "13.5 - 17.5" },
          { parameterCode: "RBC", name: "Total RBC Count", value: 4.9, unit: "mil/uL", flag: "normal", referenceRange: "4.5 - 5.9" },
          { parameterCode: "WBC", name: "Total Leucocyte Count (WBC)", value: 7200, unit: "/uL", flag: "normal", referenceRange: "4000 - 11000" },
          { parameterCode: "PLT", name: "Platelet Count", value: 2.8, unit: "lakh/uL", flag: "normal", referenceRange: "1.5 - 4.5" },
        ],
        verifiedBy: doc1._id,
        verifiedAt: new Date(Date.now() - 3600000 * 1),
      });

      logger.info("Created order ORD-2026-0001 with sample and results.");
    }

    let order2 = await TestOrder.findOne({ orderId: "ORD-2026-0002" });
    if (!order2) {
      const visit2 = await Visit.create({
        patientId: pat2._id,
        clinicId: clinic2._id,
        visitNumber: "VIS-2026-0002",
        referringDoctorId: doc2._id,
        status: "active",
      });

      order2 = await TestOrder.create({
        orderId: "ORD-2026-0002",
        orderBarcode: "LCP-2026-0002",
        patientId: pat2._id,
        visitId: visit2._id,
        clinicId: clinic2._id,
        referringDoctorId: doc2._id,
        status: "processing",
        priority: "urgent",
        tests: [
          {
            testId: lipidTest._id,
            testCode: "LIPID",
            name: lipidTest.name,
            price: 850,
            specimenType: "Serum",
            status: "processing",
          },
        ],
        packages: [],
        pricing: {
          subtotal: 850,
          discountPercent: 10,
          discountAmount: 85,
          netTotal: 765,
          paidAmount: 500,
          balanceDue: 265,
        },
        statusHistory: [
          { status: "registered", changedAt: new Date(Date.now() - 3600000 * 2) },
          { status: "sample_collected", changedAt: new Date(Date.now() - 3600000 * 1.5) },
          { status: "processing", changedAt: new Date(Date.now() - 3600000 * 0.5) },
        ],
      });

      await Sample.create({
        sampleBarcode: "SMP-2026-002",
        orderId: order2._id,
        patientId: pat2._id,
        clinicId: clinic2._id,
        specimenType: "Serum",
        status: "collected",
        collectedAt: new Date(Date.now() - 3600000 * 1.5),
      });

      logger.info("Created order ORD-2026-0002 in processing state.");
    }

    // 7. Inventory Items
    const inventoryList = [
      {
        itemCode: "INV-EDTA-01",
        name: "BD Vacutainer K2-EDTA 3ml Tubes",
        category: "Reagents & Tubes",
        unit: "pack",
        currentStock: 450,
        minimumThreshold: 100,
        clinicId: clinic1._id,
        isActive: true,
      },
      {
        itemCode: "INV-SST-01",
        name: "BD Vacutainer SST II Advance Gold 5ml",
        category: "Reagents & Tubes",
        unit: "pack",
        currentStock: 320,
        minimumThreshold: 100,
        clinicId: clinic1._id,
        isActive: true,
      },
      {
        itemCode: "INV-GLV-01",
        name: "Nitrile Examination Powder-Free Gloves (Medium)",
        category: "PPE & Consumables",
        unit: "box",
        currentStock: 85,
        minimumThreshold: 25,
        clinicId: clinic1._id,
        isActive: true,
      },
      {
        itemCode: "INV-REAG-01",
        name: "Sysmex Cellpack DCL Diluent 20L",
        category: "Hematology Reagents",
        unit: "canister",
        currentStock: 8,
        minimumThreshold: 3,
        clinicId: clinic1._id,
        isActive: true,
      },
    ];

    for (const inv of inventoryList) {
      const exists = await InventoryItem.findOne({ itemCode: inv.itemCode });
      if (!exists) {
        await InventoryItem.create(inv);
        logger.info(`Created inventory item: ${inv.name}`);
      }
    }

    logger.info("🎉 DEMO DATA SEEDING COMPLETE SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Error seeding demo data");
    process.exit(1);
  }
}

runSeed();
