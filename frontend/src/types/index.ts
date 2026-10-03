// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  clinics: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
  clinicId?: string;
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type Gender = 'male' | 'female' | 'other';

export interface Address {
  line1?: string;
  line2?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Patient {
  _id: string;
  patientId: string;        // "PAT-2026-000001"
  registrationNumber: string;
  fullName?: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  phone: string;
  email?: string;
  bloodGroup?: BloodGroup;
  address?: Address;
  createdAt: string;
  updatedAt?: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'draft'
  | 'registered'
  | 'awaiting_sample'
  | 'sample_collected'
  | 'processing'
  | 'awaiting_verification'
  | 'verified'
  | 'published';

export type Priority = 'routine' | 'urgent' | 'stat';

export interface OrderedTest {
  test: { _id: string; name: string; code: string };
  price: number;
  status: string;
}

export interface Order {
  _id: string;
  orderId: string;           // "ORD-2026-000001"
  orderBarcode?: string;
  status: OrderStatus;
  priority: Priority;
  patient: Pick<Patient, '_id' | 'firstName' | 'lastName' | 'patientId'> & {
    fullName?: string;
    phone?: string;
    gender?: Gender;
    dateOfBirth?: string;
    ageYears?: number;
    address?: Address;
  };
  clinic: { _id: string; name: string; clinicCode?: string; contact?: { phone?: string }; address?: Address };
  referringDoctor?: {
    _id: string;
    displayName?: string;
    fullName?: string;
    qualification?: string;
    specialization?: string;
    medicalRegistrationNumber?: string;
    doctorId?: string;
  };
  verifyingDoctor?: {
    _id: string;
    displayName?: string;
    fullName?: string;
    qualification?: string;
    specialization?: string;
    medicalRegistrationNumber?: string;
    doctorId?: string;
  };
  orderedTests: OrderedTest[];
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  notes?: string;
  createdAt: string;
}

// ─── Sample ───────────────────────────────────────────────────────────────────

export type SampleStatus =
  | 'pending_collection'
  | 'collected'
  | 'accepted'
  | 'rejected'
  | 'processing'
  | 'processed';

export interface Sample {
  _id: string;
  barcode: string;
  sampleType: string;
  status: SampleStatus;
  order: Pick<Order, '_id' | 'orderId'>;
  patient: Pick<Patient, '_id' | 'firstName' | 'lastName' | 'patientId'>;
  collectedAt?: string;
  acceptedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

// ─── Results ──────────────────────────────────────────────────────────────────

export type ResultFlag =
  | 'normal'
  | 'abnormal_low'
  | 'abnormal_high'
  | 'critical_low'
  | 'critical_high';

export interface ResultParameter {
  name: string;
  value?: string | number;
  unit?: string;
  referenceRange?: string;
  flag?: ResultFlag;
}

export type ResultStatus = 'pending' | 'entered' | 'verified' | 'rejected' | 'amended';

export interface Result {
  _id: string;
  order: Pick<Order, '_id' | 'orderId'>;
  test: { _id: string; name: string; code: string };
  status: ResultStatus;
  parameters: ResultParameter[];
  enteredBy?: { _id: string; firstName: string; lastName: string };
  verifiedBy?: { _id: string; firstName: string; lastName: string };
  enteredAt?: string;
  verifiedAt?: string;
  notes?: string;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export type ReportStatus = 'draft' | 'published' | 'amended';

export interface Report {
  _id: string;
  order: Pick<Order, '_id' | 'orderId'>;
  patient: Pick<Patient, '_id' | 'firstName' | 'lastName' | 'patientId'>;
  status: ReportStatus;
  version: number;
  generatedAt: string;
  publishedAt?: string;
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'net_banking';
export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

export interface Payment {
  method: PaymentMethod;
  amount: number;
  paidAt: string;
  reference?: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;    // "INV-2026-000001"
  order: Pick<Order, '_id' | 'orderId'>;
  patient: Pick<Patient, '_id' | 'firstName' | 'lastName' | 'patientId'>;
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  payments: Payment[];
  createdAt: string;
}

// ─── Test Catalogue ───────────────────────────────────────────────────────────

export interface ReferenceRange {
  gender?: Gender;
  ageMin?: number;
  ageMax?: number;
  low?: number;
  high?: number;
  criticalLow?: number;
  criticalHigh?: number;
  unit?: string;
}

export interface TestParameter {
  name: string;
  unit?: string;
  referenceRanges: ReferenceRange[];
}

export interface Test {
  _id: string;
  name: string;
  code: string;
  testCode?: string;
  category: string;
  department?: string;
  price: number;
  turnaroundTime?: number;   // hours
  turnaroundTimeHours?: number;
  sampleType: string;
  specimenType?: string;
  parameters: TestParameter[];
  isActive: boolean;
  createdAt?: string;
}

export interface TestPackage {
  _id: string;
  packageCode: string;
  name: string;
  description?: string;
  tests: Array<{ _id: string; name?: string; testCode?: string; code?: string }>;
  packagePrice: number;
  originalPrice?: number;
  discountPercentage?: number;
  isActive: boolean;
  createdAt?: string;
}

// ─── Clinic ───────────────────────────────────────────────────────────────────

export interface Clinic {
  _id: string;
  name: string;
  code: string;
  clinicCode?: string;
  branchCode?: string;
  address?: Address;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Doctor ───────────────────────────────────────────────────────────────────

export type DoctorType = 'referring' | 'pathologist';

export interface Doctor {
  _id: string;
  doctorId?: string;
  displayName: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  qualification?: string;
  specialization?: string;
  medicalRegistrationNumber?: string;
  type: DoctorType;
  phone?: string;
  email?: string;
  associatedClinics?: Array<{ _id: string; clinicCode?: string; name: string; branchCode?: string }>;
  clinic?: Pick<Clinic, '_id' | 'name'>;
  isReferringDoctor?: boolean;
  isVerifyingDoctor?: boolean;
  isActive: boolean;
  createdAt: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type InventoryUnit = 'ml' | 'L' | 'mg' | 'g' | 'units' | 'boxes' | 'strips';

export interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  isLowStock: boolean;
  expiryDate?: string;
  supplier?: string;
  createdAt: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  totalOrders: number;
  todayOrders: number;
  pendingResults: number;
  pendingVerification: number;
  totalRevenue: number;
  todayRevenue: number;
  totalPatients: number;
  todayPatients: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'order_created'
  | 'result_entered'
  | 'result_verified'
  | 'report_published'
  | 'critical_value'
  | 'low_stock'
  | 'sample_rejected';

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  _id: string;
  action: string;
  resource: string;
  resourceId: string;
  performedBy: { _id: string; firstName: string; lastName: string; email: string };
  changes?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
