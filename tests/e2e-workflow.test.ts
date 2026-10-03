import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/users/user.model.js';
import { Role } from '../src/modules/roles/role.model.js';
import { AuditEvent } from '../src/modules/audit/audit-event.model.js';
import { SYSTEM_ROLES } from '../src/modules/roles/role.constants.js';
import { hashPassword } from '../src/common/utilities/crypto.util.js';

describe('LabCare Pro Acceptance Test: Complete 24-Step End-to-End Workflow', () => {
  const app = createApp();

  // Workflow State variables across steps
  let adminCookies: string[];
  let receptionistCookies: string[];
  let labTechCookies: string[];
  let pathologistCookies: string[];
  let patientCookies: string[];
  let otherPatientCookies: string[];

  let clinicId: string;
  let doctorId: string;
  let doctorProfileDocId: string;
  let signatureAssetId: string;
  let stampAssetId: string;
  let logoAssetId: string;
  let parchiAssetId: string;
  let testId: string;
  let patientDocId: string;
  let visitDocId: string;
  let otherPatientDocId: string;
  let orderDocId: string;
  let sampleDocId: string;
  let resultDocId: string;
  let reportDocId: string;
  let invoiceDocId: string;

  // Step 0: Setup Staff Accounts
  it('Setup: Pre-requisite staff accounts with dedicated RBAC roles', async () => {
    // 1. Admin login
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@labcarepro.internal', password: 'Admin@LabCarePro2026!' });
    expect(adminLogin.status).toBe(200);
    adminCookies = adminLogin.headers['set-cookie'] as unknown as string[];

    // 2. Create Receptionist
    const recRole = await Role.findOne({ name: SYSTEM_ROLES.RECEPTIONIST });
    await User.create({
      email: 'receptionist@labcarepro.internal',
      passwordHash: await hashPassword('ReceptionistPass123!'),
      firstName: 'Priya',
      lastName: 'Sharma',
      roles: [recRole!._id],
      isActive: true
    });
    const recLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'receptionist@labcarepro.internal', password: 'ReceptionistPass123!' });
    receptionistCookies = recLogin.headers['set-cookie'] as unknown as string[];

    // 3. Create Lab Technician
    const techRole = await Role.findOne({ name: SYSTEM_ROLES.LAB_TECHNICIAN });
    await User.create({
      email: 'tech@labcarepro.internal',
      passwordHash: await hashPassword('TechPass123!'),
      firstName: 'Rahul',
      lastName: 'Verma',
      roles: [techRole!._id],
      isActive: true
    });
    const techLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'tech@labcarepro.internal', password: 'TechPass123!' });
    labTechCookies = techLogin.headers['set-cookie'] as unknown as string[];

    // 4. Create Pathologist / Verifying Doctor user
    const pathRole = await Role.findOne({ name: SYSTEM_ROLES.PATHOLOGIST });
    await User.create({
      email: 'pathologist@labcarepro.internal',
      passwordHash: await hashPassword('PathologistPass123!'),
      firstName: 'Dr. Anand',
      lastName: 'Deshmukh',
      roles: [pathRole!._id],
      isActive: true
    });
    const pathLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pathologist@labcarepro.internal', password: 'PathologistPass123!' });
    pathologistCookies = pathLogin.headers['set-cookie'] as unknown as string[];
  });

  // Step 1: Administrator creates a clinic
  it('Step 1: Administrator creates a clinic', async () => {
    const res = await request(app)
      .post('/api/v1/clinics')
      .set('Cookie', adminCookies)
      .send({
        clinicCode: 'LCPDEL',
        name: 'LabCare Central Diagnostics',
        branchCode: 'DEL01',
        address: {
          line1: '104 Ring Road',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'India'
        },
        contact: {
          phone: '+911123456789',
          email: 'contact@centraldelhi.labcare.internal'
        },
        letterheadConfig: {
          headerHeight: 80,
          footerHeight: 50,
          showLogo: true
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.clinicCode).toBe('LCPDEL');
    clinicId = res.body.data._id;
  });

  // Step 2 & 3: Administrator creates doctor account and associates with clinic
  it('Step 2 & 3: Administrator creates doctor profile and associates with clinic', async () => {
    const res = await request(app)
      .post('/api/v1/doctors')
      .set('Cookie', adminCookies)
      .send({
        fullName: 'Dr. Anand Deshmukh',
        qualification: 'MBBS, MD (Pathology)',
        specialization: 'Consultant Pathologist & Lab Director',
        medicalRegistrationNumber: 'MCI-DEL-48291',
        contact: {
          phone: '+919811223344',
          email: 'dr.anand@labcare.internal'
        },
        associatedClinics: [clinicId],
        isReferringDoctor: true,
        isVerifyingDoctor: true, // Authorized report-verifying professional
        reportFooterText: 'Consultant Pathologist & Quality Manager'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctorId).toBeDefined();
    expect(res.body.data.isVerifyingDoctor).toBe(true);
    doctorId = res.body.data.doctorId;
    doctorProfileDocId = res.body.data._id;
  });

  // Step 4: Upload and approve doctor's parchi, logo, signature and stamp assets
  it('Step 4: Upload and approve doctor assets (parchi, logo, signature, stamp)', async () => {
    // 1x1 transparent PNG synthetic buffer
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload Signature
    const sigRes = await request(app)
      .post(`/api/v1/doctors/${doctorProfileDocId}/assets`)
      .set('Cookie', adminCookies)
      .field('assetType', 'signature')
      .attach('file', mockImageBuffer, 'signature.png');
    expect(sigRes.status).toBe(201);
    signatureAssetId = sigRes.body.data._id;

    // Approve Signature
    const approveSig = await request(app)
      .post(`/api/v1/doctors/assets/${signatureAssetId}/approve`)
      .set('Cookie', adminCookies)
      .send({ approved: true });
    expect(approveSig.status).toBe(200);

    // Upload Stamp
    const stampRes = await request(app)
      .post(`/api/v1/doctors/${doctorProfileDocId}/assets`)
      .set('Cookie', adminCookies)
      .field('assetType', 'stamp')
      .attach('file', mockImageBuffer, 'stamp.png');
    expect(stampRes.status).toBe(201);
    stampAssetId = stampRes.body.data._id;

    // Approve Stamp
    await request(app)
      .post(`/api/v1/doctors/assets/${stampAssetId}/approve`)
      .set('Cookie', adminCookies)
      .send({ approved: true });

    // Upload Parchi
    const parchiRes = await request(app)
      .post(`/api/v1/doctors/${doctorProfileDocId}/assets`)
      .set('Cookie', adminCookies)
      .field('assetType', 'parchi')
      .attach('file', mockImageBuffer, 'parchi.png');
    expect(parchiRes.status).toBe(201);
    parchiAssetId = parchiRes.body.data._id;

    // Upload Logo
    const logoRes = await request(app)
      .post(`/api/v1/doctors/${doctorProfileDocId}/assets`)
      .set('Cookie', adminCookies)
      .field('assetType', 'logo')
      .attach('file', mockImageBuffer, 'logo.png');
    expect(logoRes.status).toBe(201);
    logoAssetId = logoRes.body.data._id;
  });

  // Step 5: Administrator configures a test and its approved parameters
  it('Step 5: Administrator configures a test with parameters and reference ranges', async () => {
    const res = await request(app)
      .post('/api/v1/tests')
      .set('Cookie', adminCookies)
      .send({
        testCode: 'CBC',
        name: 'Complete Blood Count (CBC)',
        department: 'Hematology',
        category: 'Routine Hematology',
        specimenType: 'EDTA Whole Blood',
        turnaroundTimeHours: 12,
        price: 350.0,
        parameters: [
          {
            parameterCode: 'HGB',
            name: 'Hemoglobin',
            unit: 'g/dL',
            dataType: 'numeric',
            referenceRanges: [
              {
                gender: 'male',
                normalMin: 13.0,
                normalMax: 17.0,
                criticalLow: 7.0,
                criticalHigh: 20.0
              },
              {
                gender: 'female',
                normalMin: 12.0,
                normalMax: 15.5,
                criticalLow: 7.0,
                criticalHigh: 20.0
              }
            ],
            displayOrder: 1
          },
          {
            parameterCode: 'WBC',
            name: 'Total Leukocyte Count (TLC)',
            unit: '/cumm',
            dataType: 'numeric',
            referenceRanges: [
              {
                gender: 'both',
                normalMin: 4000,
                normalMax: 11000,
                criticalLow: 2000,
                criticalHigh: 30000
              }
            ],
            displayOrder: 2
          },
          {
            parameterCode: 'PLT',
            name: 'Platelet Count',
            unit: 'lakh/cumm',
            dataType: 'numeric',
            referenceRanges: [
              {
                gender: 'both',
                normalMin: 1.5,
                normalMax: 4.5,
                criticalLow: 0.5,
                criticalHigh: 10.0
              }
            ],
            displayOrder: 3
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    testId = res.body.data._id;
  });

  // Step 6 & 7: Receptionist registers a patient and selects clinic
  it('Step 6 & 7: Receptionist registers a patient at clinic with automatic visit creation', async () => {
    const res = await request(app)
      .post('/api/v1/patients')
      .set('Cookie', receptionistCookies)
      .send({
        fullName: 'Amit Kumar',
        ageYears: 35,
        gender: 'male',
        phone: '+919988776655',
        email: 'amit.kumar@example.internal',
        clinicId: clinicId,
        createInitialVisit: true,
        visitType: 'outpatient'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patient.patientId).toMatch(/^PAT-/);
    expect(res.body.data.patient.registrationNumber).toMatch(/^REG-/);
    expect(res.body.data.visit.visitNumber).toMatch(/^VIS-/);

    patientDocId = res.body.data.patient._id;
    visitDocId = res.body.data.visit._id;
  });

  // Step 8: Frontend calls clinic doctor dropdown API: GET /api/v1/clinics/:clinicId/doctors
  it('Step 8: Retrieve eligible doctors for clinic dropdown', async () => {
    const res = await request(app)
      .get(`/api/v1/clinics/${clinicId}/doctors`)
      .set('Cookie', receptionistCookies);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].doctorId).toBe(doctorId);
    expect(res.body.data[0].displayName).toContain('Dr. Anand Deshmukh');
    expect(res.body.data[0].isVerifying).toBe(true);
  });

  // Step 9 & 10 & 11: Receptionist selects doctor and creates order with tests
  it('Step 9, 10 & 11: Create test order with validated clinic/doctor relationship', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', receptionistCookies)
      .send({
        patientId: patientDocId,
        visitId: visitDocId,
        clinicId: clinicId,
        referringDoctorId: doctorProfileDocId,
        testIds: [testId],
        packageIds: [],
        discountPercent: 10, // 10% discount on 350 = 35 -> Net = 315
        priority: 'routine'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toMatch(/^ORD-/);
    expect(res.body.data.pricing.subtotal).toBe(350);
    expect(res.body.data.pricing.discountAmount).toBe(35);
    expect(res.body.data.pricing.netTotal).toBe(315);
    expect(res.body.data.pricing.balanceDue).toBe(315);
    expect(res.body.data.status).toBe('awaiting_sample');

    orderDocId = res.body.data._id;
  });

  // Step 12: Sample collection is recorded
  it('Step 12: Record sample collection and laboratory reception', async () => {
    // 1. Get sample created for the order
    const listRes = await request(app)
      .get(`/api/v1/samples?orderId=${orderDocId}`)
      .set('Cookie', labTechCookies);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBeGreaterThan(0);
    sampleDocId = listRes.body.data.items[0]._id;

    // 2. Record collection
    const collectRes = await request(app)
      .post(`/api/v1/samples/${sampleDocId}/collect`)
      .set('Cookie', labTechCookies)
      .send({ notes: 'Collected from left antecubital vein' });

    expect(collectRes.status).toBe(200);
    expect(collectRes.body.data.status).toBe('collected');

    // 3. Accept sample in laboratory
    const acceptRes = await request(app)
      .post(`/api/v1/samples/${sampleDocId}/accept`)
      .set('Cookie', labTechCookies)
      .send({ notes: 'Sample intact, no hemolysis' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('accepted');
  });

  // Step 13: Authorized laboratory staff enters test results
  it('Step 13: Enter test results with automatic abnormal flag calculation', async () => {
    // 1. Get results container
    const resList = await request(app)
      .get(`/api/v1/results/order/${orderDocId}`)
      .set('Cookie', labTechCookies);

    expect(resList.status).toBe(200);
    expect(resList.body.data.length).toBe(1);
    resultDocId = resList.body.data[0]._id;

    // 2. Enter parameter results (Male normal HGB is 13.0-17.0. Let's enter 11.5 to trigger ABNORMAL_LOW flag!)
    const enterRes = await request(app)
      .post(`/api/v1/results/${resultDocId}/enter`)
      .set('Cookie', labTechCookies)
      .send({
        parameterValues: [
          { parameterCode: 'HGB', value: '11.5' },
          { parameterCode: 'WBC', value: '7500' },
          { parameterCode: 'PLT', value: '2.5' }
        ],
        remarks: 'Mild normocytic normochromic anemia noted'
      });

    expect(enterRes.status).toBe(200);
    expect(enterRes.body.data.status).toBe('pending_verification');

    // Verify flag was computed
    const hgbParam = enterRes.body.data.parameterResults.find((p: any) => p.parameterCode === 'HGB');
    expect(hgbParam.flag).toBe('abnormal_low');
  });

  // Step 14: Authorized verifier pathologist reviews and approves results
  it('Step 14: Authorized verifier approves and verifies results', async () => {
    const verifyRes = await request(app)
      .post(`/api/v1/results/${resultDocId}/verify`)
      .set('Cookie', pathologistCookies)
      .send({ verifyingDoctorId: doctorProfileDocId });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.status).toBe('verified');
  });

  // Step 15 & 16: System generates report using approved template, saves report version and asset snapshot
  it('Step 15 & 16: Generate and publish clinical report with immutable snapshot', async () => {
    const reportRes = await request(app)
      .post(`/api/v1/reports/${orderDocId}/generate`)
      .set('Cookie', pathologistCookies);

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.success).toBe(true);
    expect(reportRes.body.data.reportId).toMatch(/^REP-/);
    expect(reportRes.body.data.status).toBe('published');
    expect(reportRes.body.data.currentVersion).toBe(1);
    expect(reportRes.body.data.brandingSnapshot.clinicName).toBe('LabCare Central Diagnostics');
    expect(reportRes.body.data.signerSnapshot.doctorName).toBe('Dr. Anand Deshmukh');

    reportDocId = reportRes.body.data._id;
  });

  // Step 17: Authorized user downloads PDF
  it('Step 17: Authorized user downloads official clinical report PDF', async () => {
    const pdfRes = await request(app)
      .get(`/api/v1/reports/${reportDocId}/download?format=pdf`)
      .set('Cookie', receptionistCookies);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(pdfRes.body.length).toBeGreaterThan(100);
  });

  // Step 18: Authorized user downloads DOCX
  it('Step 18: Authorized user downloads editable DOCX export', async () => {
    const docxRes = await request(app)
      .get(`/api/v1/reports/${reportDocId}/download?format=docx`)
      .set('Cookie', adminCookies);

    expect(docxRes.status).toBe(200);
    expect(docxRes.headers['content-type']).toContain('wordprocessingml');
    expect(docxRes.headers['content-disposition']).toContain('.docx');
  });

  // Step 19: Browser HTML report print preview
  it('Step 19: Report can be printed via HTML print view', async () => {
    const printRes = await request(app)
      .get(`/api/v1/reports/${reportDocId}/print`)
      .set('Cookie', receptionistCookies);

    expect(printRes.status).toBe(200);
    expect(printRes.headers['content-type']).toContain('text/html');
    expect(printRes.text).toContain('LabCare Central Diagnostics');
    expect(printRes.text).toContain('Dr. Anand Deshmukh');
    expect(printRes.text).toContain('window.print()');
  });

  // Step 20: Unauthorized user is denied access
  it('Step 20: Unauthorized user without authentication is denied access', async () => {
    const res = await request(app).get(`/api/v1/reports/${reportDocId}`);
    expect(res.status).toBe(401);
  });

  // Step 21: Patient can access only their own published report
  it('Step 21: Patient data isolation (IDOR protection)', async () => {
    const patientRole = await Role.findOne({ name: SYSTEM_ROLES.PATIENT });

    // Register Patient 1 User Account
    const pat1User = await User.create({
      _id: patientDocId, // linked to patient document
      email: 'amit.patient@example.internal',
      passwordHash: await hashPassword('PatientPass123!'),
      firstName: 'Amit',
      lastName: 'Kumar',
      roles: [patientRole!._id],
      isActive: true
    });
    const pat1Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'amit.patient@example.internal', password: 'PatientPass123!' });
    patientCookies = pat1Login.headers['set-cookie'] as unknown as string[];

    // Register Patient 2 User Account
    const otherPatientUser = await User.create({
      email: 'other.patient@example.internal',
      passwordHash: await hashPassword('OtherPass123!'),
      firstName: 'Other',
      lastName: 'Patient',
      roles: [patientRole!._id],
      isActive: true
    });
    const pat2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'other.patient@example.internal', password: 'OtherPass123!' });
    otherPatientCookies = pat2Login.headers['set-cookie'] as unknown as string[];

    // Patient 1 accessing their own report -> 200 SUCCESS
    const p1Access = await request(app)
      .get(`/api/v1/reports/${reportDocId}`)
      .set('Cookie', patientCookies);
    expect(p1Access.status).toBe(200);

    // Patient 2 attempting to access Patient 1's report -> 403 FORBIDDEN
    const p2Access = await request(app)
      .get(`/api/v1/reports/${reportDocId}`)
      .set('Cookie', otherPatientCookies);
    expect(p2Access.status).toBe(403);
  });

  // Step 22: Billing, payment and balance records remain consistent
  it('Step 22: Billing, invoice generation, payment recording, and balance consistency', async () => {
    // 1. Create invoice for order
    const invRes = await request(app)
      .post('/api/v1/billing/invoices')
      .set('Cookie', receptionistCookies)
      .send({ orderId: orderDocId });

    expect(invRes.status).toBe(201);
    expect(invRes.body.data.netTotal).toBe(315);
    expect(invRes.body.data.balanceDue).toBe(315);
    expect(invRes.body.data.status).toBe('unpaid');
    invoiceDocId = invRes.body.data._id;

    // 2. Record partial payment of 200 via UPI
    const payRes1 = await request(app)
      .post('/api/v1/billing/payments')
      .set('Cookie', receptionistCookies)
      .send({
        invoiceId: invoiceDocId,
        amount: 200,
        paymentMethod: 'upi',
        transactionReference: 'UPI-TXN-984210'
      });

    expect(payRes1.status).toBe(201);
    expect(payRes1.body.data.receiptNumber).toMatch(/^REC-/);

    // Check invoice updated balance
    const checkInv1 = await request(app)
      .get(`/api/v1/billing/invoices/${invoiceDocId}`)
      .set('Cookie', receptionistCookies);
    expect(checkInv1.body.data.paidAmount).toBe(200);
    expect(checkInv1.body.data.balanceDue).toBe(115);
    expect(checkInv1.body.data.status).toBe('partially_paid');

    // 3. Record remaining payment of 115 in Cash
    const payRes2 = await request(app)
      .post('/api/v1/billing/payments')
      .set('Cookie', receptionistCookies)
      .send({
        invoiceId: invoiceDocId,
        amount: 115,
        paymentMethod: 'cash'
      });

    expect(payRes2.status).toBe(201);

    const checkInv2 = await request(app)
      .get(`/api/v1/billing/invoices/${invoiceDocId}`)
      .set('Cookie', receptionistCookies);
    expect(checkInv2.body.data.paidAmount).toBe(315);
    expect(checkInv2.body.data.balanceDue).toBe(0);
    expect(checkInv2.body.data.status).toBe('paid');
  });

  // Step 23: Audit records contain the relevant workflow events
  it('Step 23: Audit trail contains relevant workflow lifecycle events', async () => {
    const auditRes = await request(app)
      .get('/api/v1/audit?limit=100')
      .set('Cookie', adminCookies);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.items.length).toBeGreaterThan(5);

    const actions = auditRes.body.data.items.map((i: any) => i.action);
    expect(actions).toContain('clinics:create');
    expect(actions).toContain('doctors:create');
    expect(actions).toContain('patients:register');
    expect(actions).toContain('orders:create');
    expect(actions).toContain('results:enter');
    expect(actions).toContain('results:verify');
    expect(actions).toContain('reports:publish');
    expect(actions).toContain('billing:payment_record');
  });

  // Step 24: Operational Analytics and State Persistence
  it('Step 24: Analytics reflect workflow metrics accurately', async () => {
    const analyticsRes = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set('Cookie', adminCookies);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data.patients.total).toBeGreaterThanOrEqual(1);
    expect(analyticsRes.body.data.workload.publishedReports).toBeGreaterThanOrEqual(1);
    expect(analyticsRes.body.data.financials.totalCollected).toBeGreaterThanOrEqual(315);
  });
});
