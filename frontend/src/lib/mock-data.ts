import type {
  Patient, Order, Sample, Result, Report, Invoice,
  Test, Clinic, Doctor, InventoryItem, Notification,
  AuditLog, DashboardKPIs, RevenueDataPoint,
} from '@/types';

// ─── Clinics ──────────────────────────────────────────────────────────────────

export const MOCK_CLINICS: Clinic[] = [
  {
    _id: 'cl1',
    name: 'LabCare Pro — Main Centre',
    code: 'LCP-MAIN',
    phone: '+91 98765 43210',
    email: 'main@labcarepro.com',
    address: { street: '12, MG Road', city: 'Bengaluru', state: 'Karnataka', country: 'India', postalCode: '560001' },
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'cl2',
    name: 'LabCare Pro — Whitefield Branch',
    code: 'LCP-WF',
    phone: '+91 98765 43211',
    email: 'whitefield@labcarepro.com',
    address: { street: '5, Whitefield Main Rd', city: 'Bengaluru', state: 'Karnataka', country: 'India', postalCode: '560066' },
    isActive: true,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
];

// ─── Doctors ──────────────────────────────────────────────────────────────────

export const MOCK_DOCTORS: Doctor[] = [
  {
    _id: 'dr1',
    displayName: 'Dr. Ananya Sharma',
    firstName: 'Ananya',
    lastName: 'Sharma',
    type: 'pathologist',
    specialization: 'Clinical Pathology',
    phone: '+91 98765 11111',
    email: 'ananya.sharma@labcarepro.com',
    isActive: true,
    createdAt: '2026-01-05T00:00:00.000Z',
  },
  {
    _id: 'dr2',
    displayName: 'Dr. Rajesh Kumar',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    type: 'referring',
    specialization: 'General Physician',
    phone: '+91 98765 22222',
    email: 'rajesh.kumar@clinic.com',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    _id: 'dr3',
    displayName: 'Dr. Priya Patel',
    firstName: 'Priya',
    lastName: 'Patel',
    type: 'referring',
    specialization: 'Endocrinologist',
    phone: '+91 98765 33333',
    isActive: true,
    createdAt: '2026-02-15T00:00:00.000Z',
  },
];

// ─── Patients ─────────────────────────────────────────────────────────────────

export const MOCK_PATIENTS: Patient[] = [
  {
    _id: 'pat1',
    patientId: 'PAT-2026-000001',
    registrationNumber: 'REG-2026-000001',
    firstName: 'Vikram',
    lastName: 'Mehta',
    gender: 'male',
    dateOfBirth: '1985-06-15',
    phone: '+91 99887 76655',
    email: 'vikram.mehta@email.com',
    bloodGroup: 'B+',
    address: { street: '22, Residency Road', city: 'Bengaluru', state: 'Karnataka', country: 'India', postalCode: '560025' },
    createdAt: '2026-09-01T08:30:00.000Z',
  },
  {
    _id: 'pat2',
    patientId: 'PAT-2026-000002',
    registrationNumber: 'REG-2026-000002',
    firstName: 'Sunita',
    lastName: 'Nair',
    gender: 'female',
    dateOfBirth: '1992-03-28',
    phone: '+91 99887 55443',
    email: 'sunita.nair@email.com',
    bloodGroup: 'O+',
    address: { street: '45, Indiranagar', city: 'Bengaluru', state: 'Karnataka', country: 'India', postalCode: '560038' },
    createdAt: '2026-09-05T10:15:00.000Z',
  },
  {
    _id: 'pat3',
    patientId: 'PAT-2026-000003',
    registrationNumber: 'REG-2026-000003',
    firstName: 'Arjun',
    lastName: 'Reddy',
    gender: 'male',
    dateOfBirth: '1978-11-02',
    phone: '+91 99887 44332',
    bloodGroup: 'A+',
    address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    createdAt: '2026-09-10T09:00:00.000Z',
  },
  {
    _id: 'pat4',
    patientId: 'PAT-2026-000004',
    registrationNumber: 'REG-2026-000004',
    firstName: 'Meera',
    lastName: 'Iyer',
    gender: 'female',
    dateOfBirth: '2000-07-20',
    phone: '+91 99887 33221',
    email: 'meera.iyer@email.com',
    bloodGroup: 'AB-',
    address: { street: '8, Koramangala 5th Block', city: 'Bengaluru', state: 'Karnataka', country: 'India', postalCode: '560095' },
    createdAt: '2026-09-15T11:30:00.000Z',
  },
  {
    _id: 'pat5',
    patientId: 'PAT-2026-000005',
    registrationNumber: 'REG-2026-000005',
    firstName: 'Suresh',
    lastName: 'Pillai',
    gender: 'male',
    dateOfBirth: '1968-02-14',
    phone: '+91 99887 22110',
    bloodGroup: 'O-',
    address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    createdAt: '2026-10-01T07:45:00.000Z',
  },
  {
    _id: 'pat6',
    patientId: 'PAT-2026-000006',
    registrationNumber: 'REG-2026-000006',
    firstName: 'Divya',
    lastName: 'Krishnamurthy',
    gender: 'female',
    dateOfBirth: '1995-09-10',
    phone: '+91 99887 11009',
    email: 'divya.k@email.com',
    bloodGroup: 'A-',
    address: { street: '3, JP Nagar', city: 'Bengaluru', state: 'Karnataka', country: 'India', postalCode: '560078' },
    createdAt: '2026-10-02T08:00:00.000Z',
  },
  {
    _id: 'pat7',
    patientId: 'PAT-2026-000007',
    registrationNumber: 'REG-2026-000007',
    firstName: 'Ravi',
    lastName: 'Shankar',
    gender: 'male',
    dateOfBirth: '1955-12-30',
    phone: '+91 99887 00998',
    bloodGroup: 'B-',
    address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    createdAt: '2026-10-03T06:30:00.000Z',
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

export const MOCK_TESTS: Test[] = [
  {
    _id: 'test1',
    name: 'Complete Blood Count (CBC)',
    code: 'CBC',
    category: 'Haematology',
    price: 350,
    turnaroundTime: 4,
    sampleType: 'Whole Blood (EDTA)',
    parameters: [
      { name: 'Haemoglobin', unit: 'g/dL', referenceRanges: [{ gender: 'male', low: 13.0, high: 17.0 }, { gender: 'female', low: 11.0, high: 15.0 }] },
      { name: 'WBC Count', unit: '×10³/µL', referenceRanges: [{ low: 4.0, high: 11.0 }] },
      { name: 'Platelet Count', unit: '×10³/µL', referenceRanges: [{ low: 150, high: 400 }] },
    ],
    isActive: true,
  },
  {
    _id: 'test2',
    name: 'Fasting Blood Sugar (FBS)',
    code: 'FBS',
    category: 'Biochemistry',
    price: 120,
    turnaroundTime: 2,
    sampleType: 'Serum',
    parameters: [
      { name: 'Glucose (Fasting)', unit: 'mg/dL', referenceRanges: [{ low: 70, high: 100, criticalLow: 40, criticalHigh: 500 }] },
    ],
    isActive: true,
  },
  {
    _id: 'test3',
    name: 'Thyroid Stimulating Hormone (TSH)',
    code: 'TSH',
    category: 'Endocrinology',
    price: 450,
    turnaroundTime: 6,
    sampleType: 'Serum',
    parameters: [
      { name: 'TSH', unit: 'mIU/L', referenceRanges: [{ low: 0.4, high: 4.0 }] },
    ],
    isActive: true,
  },
  {
    _id: 'test4',
    name: 'Liver Function Test (LFT)',
    code: 'LFT',
    category: 'Biochemistry',
    price: 600,
    turnaroundTime: 6,
    sampleType: 'Serum',
    parameters: [
      { name: 'Total Bilirubin', unit: 'mg/dL', referenceRanges: [{ low: 0.2, high: 1.2 }] },
      { name: 'SGOT (AST)', unit: 'U/L', referenceRanges: [{ low: 10, high: 40 }] },
      { name: 'SGPT (ALT)', unit: 'U/L', referenceRanges: [{ low: 7, high: 56 }] },
      { name: 'Albumin', unit: 'g/dL', referenceRanges: [{ low: 3.5, high: 5.0 }] },
    ],
    isActive: true,
  },
  {
    _id: 'test5',
    name: 'Lipid Profile',
    code: 'LIPID',
    category: 'Biochemistry',
    price: 500,
    turnaroundTime: 4,
    sampleType: 'Serum',
    parameters: [
      { name: 'Total Cholesterol', unit: 'mg/dL', referenceRanges: [{ high: 200, criticalHigh: 300 }] },
      { name: 'LDL Cholesterol', unit: 'mg/dL', referenceRanges: [{ high: 130 }] },
      { name: 'HDL Cholesterol', unit: 'mg/dL', referenceRanges: [{ low: 40 }] },
      { name: 'Triglycerides', unit: 'mg/dL', referenceRanges: [{ high: 150 }] },
    ],
    isActive: true,
  },
  {
    _id: 'test6',
    name: 'HbA1c',
    code: 'HBA1C',
    category: 'Endocrinology',
    price: 550,
    turnaroundTime: 6,
    sampleType: 'Whole Blood (EDTA)',
    parameters: [
      { name: 'HbA1c', unit: '%', referenceRanges: [{ high: 5.7 }] },
    ],
    isActive: true,
  },
  {
    _id: 'test7',
    name: 'Kidney Function Test (KFT)',
    code: 'KFT',
    category: 'Biochemistry',
    price: 480,
    turnaroundTime: 4,
    sampleType: 'Serum',
    parameters: [
      { name: 'Creatinine', unit: 'mg/dL', referenceRanges: [{ gender: 'male', low: 0.7, high: 1.3 }, { gender: 'female', low: 0.5, high: 1.1 }] },
      { name: 'Urea', unit: 'mg/dL', referenceRanges: [{ low: 15, high: 40 }] },
      { name: 'Uric Acid', unit: 'mg/dL', referenceRanges: [{ gender: 'male', low: 3.5, high: 7.2 }, { gender: 'female', low: 2.6, high: 6.0 }] },
    ],
    isActive: true,
  },
];

// ─── Orders ───────────────────────────────────────────────────────────────────

export const MOCK_ORDERS: Order[] = [
  {
    _id: 'ord1',
    orderId: 'ORD-2026-000001',
    status: 'published',
    priority: 'routine',
    patient: { _id: 'pat1', firstName: 'Vikram', lastName: 'Mehta', patientId: 'PAT-2026-000001' },
    clinic: { _id: 'cl1', name: 'LabCare Pro — Main Centre' },
    referringDoctor: { _id: 'dr2', displayName: 'Dr. Rajesh Kumar' },
    orderedTests: [
      { test: { _id: 'test1', name: 'Complete Blood Count (CBC)', code: 'CBC' }, price: 350, status: 'verified' },
      { test: { _id: 'test2', name: 'Fasting Blood Sugar (FBS)', code: 'FBS' }, price: 120, status: 'verified' },
    ],
    totalAmount: 470,
    discountAmount: 0,
    netAmount: 470,
    createdAt: '2026-09-28T08:30:00.000Z',
  },
  {
    _id: 'ord2',
    orderId: 'ORD-2026-000002',
    status: 'awaiting_verification',
    priority: 'urgent',
    patient: { _id: 'pat2', firstName: 'Sunita', lastName: 'Nair', patientId: 'PAT-2026-000002' },
    clinic: { _id: 'cl1', name: 'LabCare Pro — Main Centre' },
    referringDoctor: { _id: 'dr3', displayName: 'Dr. Priya Patel' },
    orderedTests: [
      { test: { _id: 'test3', name: 'Thyroid Stimulating Hormone (TSH)', code: 'TSH' }, price: 450, status: 'entered' },
      { test: { _id: 'test6', name: 'HbA1c', code: 'HBA1C' }, price: 550, status: 'entered' },
    ],
    totalAmount: 1000,
    discountAmount: 100,
    netAmount: 900,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    _id: 'ord3',
    orderId: 'ORD-2026-000003',
    status: 'processing',
    priority: 'stat',
    patient: { _id: 'pat3', firstName: 'Arjun', lastName: 'Reddy', patientId: 'PAT-2026-000003' },
    clinic: { _id: 'cl2', name: 'LabCare Pro — Whitefield Branch' },
    orderedTests: [
      { test: { _id: 'test4', name: 'Liver Function Test (LFT)', code: 'LFT' }, price: 600, status: 'pending' },
      { test: { _id: 'test5', name: 'Lipid Profile', code: 'LIPID' }, price: 500, status: 'pending' },
      { test: { _id: 'test7', name: 'Kidney Function Test (KFT)', code: 'KFT' }, price: 480, status: 'pending' },
    ],
    totalAmount: 1580,
    discountAmount: 0,
    netAmount: 1580,
    createdAt: '2026-10-02T09:15:00.000Z',
  },
  {
    _id: 'ord4',
    orderId: 'ORD-2026-000004',
    status: 'registered',
    priority: 'routine',
    patient: { _id: 'pat4', firstName: 'Meera', lastName: 'Iyer', patientId: 'PAT-2026-000004' },
    clinic: { _id: 'cl1', name: 'LabCare Pro — Main Centre' },
    orderedTests: [
      { test: { _id: 'test1', name: 'Complete Blood Count (CBC)', code: 'CBC' }, price: 350, status: 'pending' },
    ],
    totalAmount: 350,
    discountAmount: 0,
    netAmount: 350,
    createdAt: '2026-10-03T07:00:00.000Z',
  },
  {
    _id: 'ord5',
    orderId: 'ORD-2026-000005',
    status: 'awaiting_sample',
    priority: 'urgent',
    patient: { _id: 'pat5', firstName: 'Suresh', lastName: 'Pillai', patientId: 'PAT-2026-000005' },
    clinic: { _id: 'cl1', name: 'LabCare Pro — Main Centre' },
    referringDoctor: { _id: 'dr2', displayName: 'Dr. Rajesh Kumar' },
    orderedTests: [
      { test: { _id: 'test2', name: 'Fasting Blood Sugar (FBS)', code: 'FBS' }, price: 120, status: 'pending' },
      { test: { _id: 'test7', name: 'Kidney Function Test (KFT)', code: 'KFT' }, price: 480, status: 'pending' },
    ],
    totalAmount: 600,
    discountAmount: 0,
    netAmount: 600,
    createdAt: '2026-10-03T08:45:00.000Z',
  },
  {
    _id: 'ord6',
    orderId: 'ORD-2026-000006',
    status: 'verified',
    priority: 'routine',
    patient: { _id: 'pat6', firstName: 'Divya', lastName: 'Krishnamurthy', patientId: 'PAT-2026-000006' },
    clinic: { _id: 'cl2', name: 'LabCare Pro — Whitefield Branch' },
    referringDoctor: { _id: 'dr3', displayName: 'Dr. Priya Patel' },
    orderedTests: [
      { test: { _id: 'test3', name: 'Thyroid Stimulating Hormone (TSH)', code: 'TSH' }, price: 450, status: 'verified' },
    ],
    totalAmount: 450,
    discountAmount: 0,
    netAmount: 450,
    createdAt: '2026-10-02T11:00:00.000Z',
  },
];

// ─── Samples ──────────────────────────────────────────────────────────────────

export const MOCK_SAMPLES: Sample[] = [
  {
    _id: 'smp1',
    barcode: 'LCP-2026-001-001',
    sampleType: 'Whole Blood (EDTA)',
    status: 'processed',
    order: { _id: 'ord1', orderId: 'ORD-2026-000001' },
    patient: { _id: 'pat1', firstName: 'Vikram', lastName: 'Mehta', patientId: 'PAT-2026-000001' },
    collectedAt: '2026-09-28T09:00:00.000Z',
    acceptedAt: '2026-09-28T09:30:00.000Z',
    createdAt: '2026-09-28T08:30:00.000Z',
  },
  {
    _id: 'smp2',
    barcode: 'LCP-2026-002-001',
    sampleType: 'Serum',
    status: 'accepted',
    order: { _id: 'ord2', orderId: 'ORD-2026-000002' },
    patient: { _id: 'pat2', firstName: 'Sunita', lastName: 'Nair', patientId: 'PAT-2026-000002' },
    collectedAt: '2026-10-01T10:30:00.000Z',
    acceptedAt: '2026-10-01T11:00:00.000Z',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    _id: 'smp3',
    barcode: 'LCP-2026-003-001',
    sampleType: 'Serum',
    status: 'collected',
    order: { _id: 'ord3', orderId: 'ORD-2026-000003' },
    patient: { _id: 'pat3', firstName: 'Arjun', lastName: 'Reddy', patientId: 'PAT-2026-000003' },
    collectedAt: '2026-10-02T09:45:00.000Z',
    createdAt: '2026-10-02T09:15:00.000Z',
  },
  {
    _id: 'smp4',
    barcode: 'LCP-2026-005-001',
    sampleType: 'Serum',
    status: 'pending_collection',
    order: { _id: 'ord5', orderId: 'ORD-2026-000005' },
    patient: { _id: 'pat5', firstName: 'Suresh', lastName: 'Pillai', patientId: 'PAT-2026-000005' },
    createdAt: '2026-10-03T08:45:00.000Z',
  },
];

// ─── Results ──────────────────────────────────────────────────────────────────

export const MOCK_RESULTS: Result[] = [
  {
    _id: 'res1',
    order: { _id: 'ord1', orderId: 'ORD-2026-000001' },
    test: { _id: 'test1', name: 'Complete Blood Count (CBC)', code: 'CBC' },
    status: 'verified',
    parameters: [
      { name: 'Haemoglobin', value: 14.5, unit: 'g/dL', referenceRange: '13.0–17.0', flag: 'normal' },
      { name: 'WBC Count', value: 7.2, unit: '×10³/µL', referenceRange: '4.0–11.0', flag: 'normal' },
      { name: 'Platelet Count', value: 210, unit: '×10³/µL', referenceRange: '150–400', flag: 'normal' },
    ],
    enteredBy: { _id: 'u2', firstName: 'Ramesh', lastName: 'Technician' },
    verifiedBy: { _id: 'u1', firstName: 'Ananya', lastName: 'Sharma' },
    enteredAt: '2026-09-28T11:00:00.000Z',
    verifiedAt: '2026-09-28T12:30:00.000Z',
  },
  {
    _id: 'res2',
    order: { _id: 'ord1', orderId: 'ORD-2026-000001' },
    test: { _id: 'test2', name: 'Fasting Blood Sugar (FBS)', code: 'FBS' },
    status: 'verified',
    parameters: [
      { name: 'Glucose (Fasting)', value: 126, unit: 'mg/dL', referenceRange: '70–100', flag: 'abnormal_high' },
    ],
    enteredBy: { _id: 'u2', firstName: 'Ramesh', lastName: 'Technician' },
    verifiedBy: { _id: 'u1', firstName: 'Ananya', lastName: 'Sharma' },
    enteredAt: '2026-09-28T11:15:00.000Z',
    verifiedAt: '2026-09-28T12:35:00.000Z',
  },
  {
    _id: 'res3',
    order: { _id: 'ord2', orderId: 'ORD-2026-000002' },
    test: { _id: 'test3', name: 'Thyroid Stimulating Hormone (TSH)', code: 'TSH' },
    status: 'entered',
    parameters: [
      { name: 'TSH', value: 6.8, unit: 'mIU/L', referenceRange: '0.4–4.0', flag: 'abnormal_high' },
    ],
    enteredBy: { _id: 'u2', firstName: 'Ramesh', lastName: 'Technician' },
    enteredAt: '2026-10-01T13:00:00.000Z',
  },
  {
    _id: 'res4',
    order: { _id: 'ord2', orderId: 'ORD-2026-000002' },
    test: { _id: 'test6', name: 'HbA1c', code: 'HBA1C' },
    status: 'entered',
    parameters: [
      { name: 'HbA1c', value: 8.1, unit: '%', referenceRange: '<5.7', flag: 'abnormal_high' },
    ],
    enteredBy: { _id: 'u2', firstName: 'Ramesh', lastName: 'Technician' },
    enteredAt: '2026-10-01T13:20:00.000Z',
  },
];

// ─── Reports ──────────────────────────────────────────────────────────────────

export const MOCK_REPORTS: Report[] = [
  {
    _id: 'rep1',
    order: { _id: 'ord1', orderId: 'ORD-2026-000001' },
    patient: { _id: 'pat1', firstName: 'Vikram', lastName: 'Mehta', patientId: 'PAT-2026-000001' },
    status: 'published',
    version: 1,
    generatedAt: '2026-09-28T13:00:00.000Z',
    publishedAt: '2026-09-28T13:05:00.000Z',
  },
  {
    _id: 'rep2',
    order: { _id: 'ord6', orderId: 'ORD-2026-000006' },
    patient: { _id: 'pat6', firstName: 'Divya', lastName: 'Krishnamurthy', patientId: 'PAT-2026-000006' },
    status: 'draft',
    version: 1,
    generatedAt: '2026-10-02T14:00:00.000Z',
  },
];

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const MOCK_INVOICES: Invoice[] = [
  {
    _id: 'inv1',
    invoiceNumber: 'INV-2026-000001',
    order: { _id: 'ord1', orderId: 'ORD-2026-000001' },
    patient: { _id: 'pat1', firstName: 'Vikram', lastName: 'Mehta', patientId: 'PAT-2026-000001' },
    totalAmount: 470,
    discountAmount: 0,
    netAmount: 470,
    paidAmount: 470,
    balanceAmount: 0,
    status: 'paid',
    payments: [{ method: 'upi', amount: 470, paidAt: '2026-09-28T08:35:00.000Z' }],
    createdAt: '2026-09-28T08:32:00.000Z',
  },
  {
    _id: 'inv2',
    invoiceNumber: 'INV-2026-000002',
    order: { _id: 'ord2', orderId: 'ORD-2026-000002' },
    patient: { _id: 'pat2', firstName: 'Sunita', lastName: 'Nair', patientId: 'PAT-2026-000002' },
    totalAmount: 1000,
    discountAmount: 100,
    netAmount: 900,
    paidAmount: 500,
    balanceAmount: 400,
    status: 'partial',
    payments: [{ method: 'cash', amount: 500, paidAt: '2026-10-01T10:05:00.000Z' }],
    createdAt: '2026-10-01T10:05:00.000Z',
  },
  {
    _id: 'inv3',
    invoiceNumber: 'INV-2026-000003',
    order: { _id: 'ord3', orderId: 'ORD-2026-000003' },
    patient: { _id: 'pat3', firstName: 'Arjun', lastName: 'Reddy', patientId: 'PAT-2026-000003' },
    totalAmount: 1580,
    discountAmount: 0,
    netAmount: 1580,
    paidAmount: 0,
    balanceAmount: 1580,
    status: 'unpaid',
    payments: [],
    createdAt: '2026-10-02T09:20:00.000Z',
  },
  {
    _id: 'inv4',
    invoiceNumber: 'INV-2026-000004',
    order: { _id: 'ord4', orderId: 'ORD-2026-000004' },
    patient: { _id: 'pat4', firstName: 'Meera', lastName: 'Iyer', patientId: 'PAT-2026-000004' },
    totalAmount: 350,
    discountAmount: 0,
    netAmount: 350,
    paidAmount: 350,
    balanceAmount: 0,
    status: 'paid',
    payments: [{ method: 'card', amount: 350, paidAt: '2026-10-03T07:05:00.000Z' }],
    createdAt: '2026-10-03T07:02:00.000Z',
  },
];

// ─── Inventory ────────────────────────────────────────────────────────────────

export const MOCK_INVENTORY: InventoryItem[] = [
  { _id: 'inv_i1', name: 'EDTA Vacutainer Tubes', category: 'Collection Tubes', unit: 'boxes', currentStock: 45, minimumStock: 20, isLowStock: false, expiryDate: '2027-06-30', supplier: 'BD Diagnostics', createdAt: '2026-01-01T00:00:00.000Z' },
  { _id: 'inv_i2', name: 'Serum Separator Tubes', category: 'Collection Tubes', unit: 'boxes', currentStock: 12, minimumStock: 20, isLowStock: true, expiryDate: '2027-03-31', supplier: 'BD Diagnostics', createdAt: '2026-01-01T00:00:00.000Z' },
  { _id: 'inv_i3', name: 'Glucose Reagent', category: 'Reagents', unit: 'L', currentStock: 3.5, minimumStock: 2.0, isLowStock: false, expiryDate: '2026-12-15', supplier: 'Tulip Diagnostics', createdAt: '2026-01-01T00:00:00.000Z' },
  { _id: 'inv_i4', name: 'TSH ELISA Kit', category: 'Reagents', unit: 'boxes', currentStock: 2, minimumStock: 5, isLowStock: true, expiryDate: '2026-11-30', supplier: 'Monobind Inc.', createdAt: '2026-01-01T00:00:00.000Z' },
  { _id: 'inv_i5', name: 'Gloves (Medium)', category: 'PPE', unit: 'boxes', currentStock: 80, minimumStock: 30, isLowStock: false, supplier: 'Kimberly Clark', createdAt: '2026-01-01T00:00:00.000Z' },
  { _id: 'inv_i6', name: 'Lancets', category: 'Collection Supplies', unit: 'boxes', currentStock: 8, minimumStock: 10, isLowStock: true, expiryDate: '2027-01-31', supplier: 'Roche', createdAt: '2026-01-01T00:00:00.000Z' },
];

// ─── Notifications ────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  { _id: 'notif1', type: 'critical_value', title: 'Critical Value Alert', message: 'FBS critical high (126 mg/dL) for Vikram Mehta — ORD-2026-000001', isRead: false, createdAt: '2026-09-28T11:16:00.000Z', link: '/orders/ord1' },
  { _id: 'notif2', type: 'result_entered', title: 'Results Entered', message: 'TSH & HbA1c results entered for Sunita Nair — ORD-2026-000002', isRead: false, createdAt: '2026-10-01T13:25:00.000Z', link: '/results/ord2' },
  { _id: 'notif3', type: 'low_stock', title: 'Low Stock Alert', message: 'Serum Separator Tubes stock below minimum (12 boxes remaining)', isRead: false, createdAt: '2026-10-02T08:00:00.000Z', link: '/inventory' },
  { _id: 'notif4', type: 'report_published', title: 'Report Published', message: 'Report published for Vikram Mehta — ORD-2026-000001', isRead: true, createdAt: '2026-09-28T13:05:00.000Z', link: '/reports/rep1' },
  { _id: 'notif5', type: 'order_created', title: 'New Order Created', message: 'STAT order ORD-2026-000003 for Arjun Reddy — 3 tests', isRead: true, createdAt: '2026-10-02T09:15:00.000Z', link: '/orders/ord3' },
  { _id: 'notif6', type: 'low_stock', title: 'Low Stock Alert', message: 'TSH ELISA Kit stock critically low (2 boxes remaining)', isRead: true, createdAt: '2026-10-01T07:00:00.000Z', link: '/inventory' },
];

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export const MOCK_KPIS: DashboardKPIs = {
  totalOrders: 847,
  todayOrders: 6,
  pendingResults: 4,
  pendingVerification: 2,
  totalRevenue: 387450,
  todayRevenue: 3000,
  totalPatients: 312,
  todayPatients: 3,
};

export const MOCK_REVENUE_TREND: RevenueDataPoint[] = [
  { date: '2026-09-27', revenue: 12400, orders: 18 },
  { date: '2026-09-28', revenue: 15600, orders: 24 },
  { date: '2026-09-29', revenue: 9800, orders: 14 },
  { date: '2026-09-30', revenue: 11200, orders: 16 },
  { date: '2026-10-01', revenue: 18900, orders: 28 },
  { date: '2026-10-02', revenue: 14300, orders: 21 },
  { date: '2026-10-03', revenue: 3000, orders: 6 },
];

export const MOCK_TEST_VOLUME: { name: string; count: number }[] = [
  { name: 'CBC', count: 234 },
  { name: 'FBS', count: 187 },
  { name: 'TSH', count: 143 },
  { name: 'Lipid Profile', count: 121 },
  { name: 'LFT', count: 98 },
  { name: 'HbA1c', count: 89 },
  { name: 'KFT', count: 76 },
];

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { _id: 'aud1', action: 'CREATE', resource: 'Order', resourceId: 'ord3', performedBy: { _id: 'u3', firstName: 'Kavitha', lastName: 'Receptionist', email: 'kavitha@labcarepro.com' }, ipAddress: '192.168.1.10', createdAt: '2026-10-02T09:15:00.000Z' },
  { _id: 'aud2', action: 'VERIFY', resource: 'Result', resourceId: 'res1', performedBy: { _id: 'u1', firstName: 'Ananya', lastName: 'Sharma', email: 'ananya@labcarepro.com' }, ipAddress: '192.168.1.5', createdAt: '2026-09-28T12:30:00.000Z' },
  { _id: 'aud3', action: 'PUBLISH', resource: 'Report', resourceId: 'rep1', performedBy: { _id: 'u1', firstName: 'Ananya', lastName: 'Sharma', email: 'ananya@labcarepro.com' }, ipAddress: '192.168.1.5', createdAt: '2026-09-28T13:05:00.000Z' },
  { _id: 'aud4', action: 'CREATE', resource: 'Patient', resourceId: 'pat7', performedBy: { _id: 'u3', firstName: 'Kavitha', lastName: 'Receptionist', email: 'kavitha@labcarepro.com' }, ipAddress: '192.168.1.10', createdAt: '2026-10-03T06:30:00.000Z' },
  { _id: 'aud5', action: 'ENTER', resource: 'Result', resourceId: 'res3', performedBy: { _id: 'u2', firstName: 'Ramesh', lastName: 'Technician', email: 'ramesh@labcarepro.com' }, ipAddress: '192.168.1.8', createdAt: '2026-10-01T13:00:00.000Z' },
];
