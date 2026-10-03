export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  totalPages?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

export function normalizeEntity<T>(item: any): T {
  if (!item || typeof item !== 'object') return item;

  const copy = { ...item };

  // Patient normalization
  if (copy.fullName) {
    if (!copy.firstName) copy.firstName = copy.fullName.split(' ')[0] || '';
    if (!copy.lastName) copy.lastName = copy.fullName.split(' ').slice(1).join(' ') || '';
  }

  // Order normalization
  if (copy.patientId && !copy.patient) {
    copy.patient = normalizeEntity(copy.patientId);
  }
  if (copy.clinicId && !copy.clinic) {
    copy.clinic = normalizeEntity(copy.clinicId);
  }
  if (copy.referringDoctorId && !copy.referringDoctor) {
    copy.referringDoctor = normalizeEntity(copy.referringDoctorId);
  }
  if (copy.tests && !copy.orderedTests) {
    copy.orderedTests = copy.tests.map((t: any) => ({
      test: { _id: t.testId || t._id, name: t.name, code: t.testCode },
      price: t.price ?? 0,
      status: t.status ?? 'pending',
    }));
  }
  if (copy.pricing) {
    if (copy.netAmount === undefined) copy.netAmount = copy.pricing.netTotal ?? 0;
    if (copy.totalAmount === undefined) copy.totalAmount = copy.pricing.subtotal ?? 0;
    if (copy.discountAmount === undefined) copy.discountAmount = copy.pricing.discountAmount ?? 0;
  }

  // Sample normalization
  if (copy.sampleBarcode && !copy.barcode) {
    copy.barcode = copy.sampleBarcode;
  }
  if (copy.specimenType && !copy.sampleType) {
    copy.sampleType = copy.specimenType;
  }
  if (copy.orderId && !copy.order) {
    copy.order = copy.orderId;
  }

  // Invoice normalization
  if (copy.patientId && !copy.patient) {
    copy.patient = normalizeEntity(copy.patientId);
  }

  // Doctor normalization
  if (copy.fullName && !copy.displayName) {
    copy.displayName = copy.fullName;
  }
  if (!copy.displayName && (copy.firstName || copy.lastName)) {
    copy.displayName = `${copy.firstName || ''} ${copy.lastName || ''}`.trim();
  }
  if (copy.contact) {
    if (!copy.phone) copy.phone = copy.contact.phone;
    if (!copy.email) copy.email = copy.contact.email;
  }
  if (!copy.type) {
    copy.type = copy.isVerifyingDoctor ? 'pathologist' : 'referring';
  }

  // Test normalization
  if (copy.testCode && !copy.code) {
    copy.code = copy.testCode;
  }
  if (copy.specimenType && !copy.sampleType) {
    copy.sampleType = copy.specimenType;
  }
  if (copy.turnaroundTimeHours !== undefined && copy.turnaroundTime === undefined) {
    copy.turnaroundTime = copy.turnaroundTimeHours;
  }
  if (copy.department && !copy.category) {
    copy.category = copy.department;
  }

  // Clinic normalization
  if (copy.clinicCode && !copy.code) {
    copy.code = copy.clinicCode;
  }
  if (copy.contact) {
    if (!copy.phone) copy.phone = copy.contact.phone;
    if (!copy.email) copy.email = copy.contact.email;
    if (!copy.website) copy.website = copy.contact.website;
  }

  return copy as T;
}

export function extractList<T>(responsePayload: any): PaginatedResult<T> {
  if (!responsePayload) {
    return { data: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } };
  }

  // If response has { success: true, data: ... }
  const root = responsePayload.data !== undefined ? responsePayload.data : responsePayload;

  // Case 1: root is directly an array
  if (Array.isArray(root)) {
    const total = root.length;
    const pagination = responsePayload.pagination || {
      page: 1,
      limit: total || 10,
      total,
      pages: 1,
    };
    return { data: root.map(normalizeEntity) as T[], pagination };
  }

  // Case 2: root has items: [...]
  if (root && Array.isArray(root.items)) {
    const pagination = root.pagination || responsePayload.pagination || {
      page: 1,
      limit: root.items.length || 10,
      total: root.items.length,
      pages: 1,
    };
    return {
      data: root.items.map(normalizeEntity) as T[],
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: pagination.total ?? root.items.length,
        pages: pagination.totalPages || pagination.pages || 1,
      },
    };
  }

  return { data: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } };
}

export function extractItem<T>(responsePayload: any, fallback: T): T {
  if (!responsePayload) return fallback;
  const item = responsePayload.data !== undefined ? responsePayload.data : responsePayload;
  return normalizeEntity<T>(item);
}
