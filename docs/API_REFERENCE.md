# LabCare Pro Enterprise LIMS - API Reference

All API routes are prefixed with `/api/v1`.

## 1. System Health & Readiness
- `GET /health`: Returns process status, uptime, and timestamp.
- `GET /ready`: Returns database connectivity state. Returns HTTP 503 if MongoDB is disconnected.
- `GET /api-docs`: Interactive Swagger/OpenAPI documentation UI.

## 2. Authentication & Sessions (`/api/v1/auth`)

### 2.1 Login
`POST /api/v1/auth/login`
- **Rate Limit**: 10 attempts per 15-minute window per IP.
- **Request Body**:
```json
{
  "email": "admin@labcarepro.internal",
  "password": "Admin@LabCarePro2026!",
  "clinicId": "65b4c1234567890abcdef123",
  "rememberMe": true
}
```
- **Response**:
  - Sets HTTP-only, secure cookies:
    - `labcare_access_token`: AES-256-GCM encrypted payload (15-min TTL)
    - `labcare_refresh_token`: AES-256-GCM encrypted opaque token (30-day TTL if `rememberMe`, else 24 hours)
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "accessTokenExpiresAt": "2026-10-03T09:25:00.000Z",
    "refreshTokenExpiresAt": "2026-11-02T09:10:00.000Z",
    "user": {
      "id": "65b4c1...",
      "email": "admin@labcarepro.internal",
      "firstName": "System",
      "lastName": "Administrator",
      "roles": ["Super Admin"],
      "permissions": ["*"],
      "clinics": []
    }
  },
  "message": "Login successful."
}
```

### 2.2 Refresh Tokens
`POST /api/v1/auth/refresh`
- **Request Body** (optional if cookie present): `{ "refreshToken": "..." }`
- **Response**: Rotates refresh token in MongoDB, issues new access token, updates cookies.

### 2.3 Logout
`POST /api/v1/auth/logout`
- Revokes session in database, clears all authentication cookies.

### 2.4 Current User Profile
`GET /api/v1/auth/me`

---

## 3. Clinics (`/api/v1/clinics`)
- `POST /api/v1/clinics`: Create new clinic or branch (Requires `clinics:manage`)
- `GET /api/v1/clinics`: List clinics with search and pagination
- `GET /api/v1/clinics/:id`: Get clinic details
- `PATCH /api/v1/clinics/:id`: Update clinic details
- `DELETE /api/v1/clinics/:id`: Safe deactivation/archival (no cascade delete)
- `GET /api/v1/clinics/:clinicId/doctors`: **Dropdown API** returning active doctors authorized for that clinic with minimal necessary fields (`doctorId`, `displayName`, `qualification`, `specialization`, `isVerifying`).

---

## 4. Doctors & Assets (`/api/v1/doctors`)
- `POST /api/v1/doctors`: Create doctor profile (Requires `doctors:manage`)
- `GET /api/v1/doctors`: List doctors with clinic, specialization, and verifying doctor filters
- `GET /api/v1/doctors/:id`: Get doctor profile
- `POST /api/v1/doctors/:id/assets`: Upload asset (parchi, letterhead, logo, signature, stamp) via multipart/form-data
- `POST /api/v1/doctors/assets/:assetId/approve`: Approve or reject doctor credentials and signatures
- `GET /api/v1/doctors/assets/:assetId/download-url`: Get short-lived authorized preview/download URL

---

## 5. Patients & Visits (`/api/v1/patients`)
- `POST /api/v1/patients`: Register patient. Automatically allocates collision-safe `patientId` (`PAT-...`) and `registrationNumber` (`REG-...`). Creates initial visit if requested.
- `GET /api/v1/patients`: Search patients by name, phone, or IDs with pagination and date range.
- `GET /api/v1/patients/:id`: Get single patient record.
- `PATCH /api/v1/patients/:id`: Update demographics.
- `GET /api/v1/patients/:id/history`: Get full patient visit history and orders.

---

## 6. Test Catalogue (`/api/v1/tests`)
- `POST /api/v1/tests`: Create laboratory test with parameter definitions and gender/age-specific reference ranges.
- `GET /api/v1/tests`: List tests filtered by department, category, and active status.
- `GET /api/v1/tests/:id`: Get test definition.
- `PATCH /api/v1/tests/:id`: Update test definition (increments version if clinical parameters are modified).
- `POST /api/v1/tests/packages`: Create test package / panel with bundled pricing.
- `GET /api/v1/tests/packages`: List test packages.

---

## 7. Orders & Specimen Tracking (`/api/v1/orders` and `/api/v1/samples`)
- `POST /api/v1/orders`:
  - Validates that doctor belongs to clinic independently on the server.
  - Computes pricing, discounts, and balances server-side.
  - Automatically creates barcode (`ORD-...`) and sample records grouped by specimen type.
  - Initializes draft result containers for all ordered tests.
- `GET /api/v1/orders`: List orders with clinic, status, priority, and date range filters.
- `GET /api/v1/orders/:id`: Full order details.
- `PATCH /api/v1/orders/:id/status`: Advance order through validated state transitions (`awaiting_sample` -> `sample_collected` -> `processing` -> `awaiting_verification` -> `verified` -> `published`).
- `GET /api/v1/samples`: List specimen accession records.
- `GET /api/v1/samples/barcode/:barcode`: Accession barcode scanner lookup.
- `POST /api/v1/samples/:id/collect`: Record phlebotomy / sample collection.
- `POST /api/v1/samples/:id/accept`: Record lab reception.
- `POST /api/v1/samples/:id/reject`: Record sample rejection with reason.
- `POST /api/v1/samples/:id/recollect`: Request specimen recollection.

---

## 8. Results & Verification (`/api/v1/results`)
- `GET /api/v1/results/order/:orderId`: Get all test results for an order.
- `POST /api/v1/results/:id/enter`: Enter parameter values. Evaluates age and gender to assign flags (`normal`, `abnormal_low`, `abnormal_high`, `critical_low`, `critical_high`).
- `POST /api/v1/results/:id/verify`: Authorized pathologist review & sign-off.
- `POST /api/v1/results/:id/reject`: Reject results for re-testing.
- `POST /api/v1/results/:id/amend`: Issue clinical amendment and archive previous revision.

---

## 9. Reports & Downloads (`/api/v1/reports`)
- `POST /api/v1/reports/:orderId/generate`: Resolves template, branding, and verifying pathologist signature snapshot. Generates PDF and DOCX, saves in private storage, advances order to `published`.
- `GET /api/v1/reports/:id`: Get report metadata.
- `GET /api/v1/reports/:id/download?format=pdf`: Download official clinical report PDF.
- `GET /api/v1/reports/:id/download?format=docx`: Download editable DOCX export (when authorized).
- `GET /api/v1/reports/:id/print`: Clean HTML browser print view with `window.print()`.
- `GET /api/v1/reports/:id/versions`: List all previous versions with audit timestamps.
- `GET /api/v1/reports/patient/:patientId`: Patient portal API (patient can only view their own records).

---

## 10. Billing & Payments (`/api/v1/billing`)
- `POST /api/v1/billing/invoices`: Auto-generate invoice from test order.
- `GET /api/v1/billing/invoices/:id`: Get invoice and balance details.
- `POST /api/v1/billing/payments`: Record payment (Cash, Card, UPI, Net Banking). Enforces no overpayment, atomic balance updates, idempotency.
- `POST /api/v1/billing/refunds`: Issue refund with recorded authorization.
- `GET /api/v1/billing/daily-collections`: Real-time daily collection metrics grouped by payment method.

---

## 11. Inventory, Analytics & Audit
- `/api/v1/inventory`: Reagents and supplies tracking, stock receipts, consumption, low-stock alerts.
- `/api/v1/analytics/dashboard`: Real-time metrics on patient volumes, pending samples, reports awaiting verification, and billing collections.
- `/api/v1/audit`: Immutable audit trail of clinical, security, and administrative actions.
