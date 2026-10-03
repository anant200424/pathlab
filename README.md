# LabCare Pro - Enterprise Laboratory Information & Management System (LIMS) Backend

![Node.js](https://img.shields.io/badge/Node.js-24.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9_Strict_ESM-blue)
![Express](https://img.shields.io/badge/Express-4.21-lightgrey)
![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas_Mongoose_8.x-brightgreen)
![Tests](https://img.shields.io/badge/Tests-36%20Passed%20(Vitest)-success)
![Hosting](https://img.shields.io/badge/Deployment-Render_Free_Tier_%2B_Vercel-orange)

LabCare Pro is a high-security, production-ready backend for enterprise pathology laboratories, diagnostic centres, and multi-branch hospital networks. Built entirely with **TypeScript in strict mode (`NodeNext`)**, **Express**, and **MongoDB/Mongoose**, it provides real database operations, strict clinical state machines, automated abnormal/critical flag calculations, vector PDF report generation with pathologist signatures, and decimal-safe billing.

---

## Key Highlights & Architectural Strengths

- **Enterprise Security & Cryptography**:
  - Dual HTTP-only cookies (`labcare_access_token` and `labcare_refresh_token`).
  - **AES-256-GCM authenticated payload encryption** for tokens (`iv:authTag:cipherHex`).
  - **Remember Me with 30-Day TTL**: Standard session is 24 hours; checking "Remember Me" grants 30 days of seamless rotated sessions with DB-backed revocation.
  - Brute-force account lockout protection (5 failed attempts locks account for 15 minutes).
  - Centralized, immutable, sanitised audit logging (`AuditEvent`).
- **100% Free Tier Deployment**:
  - Backend runs completely free on **Render Free Web Service**.
  - Database runs completely free on **MongoDB Atlas Free M0 (512 MB)**.
  - Front-end integration optimized for **Vercel Free Tier (Next.js)** with cross-domain cookie exchange (`SameSite=None; Secure=true`).
  - Zero cloud S3 costs required: built-in **Local Disk Storage Provider fallback** for document assets and report PDFs.
- **Strict Clinical Workflow**:
  - Deterministic state machine: `draft` ➔ `registered` ➔ `awaiting_sample` ➔ `sample_collected` ➔ `processing` ➔ `awaiting_verification` ➔ `verified` ➔ `published`.
  - Age and gender-specific reference range evaluations with flags: `normal`, `abnormal_low`, `abnormal_high`, `critical_low`, `critical_high`.
  - Verifying Pathologist dual-signoff with doctor asset snapshots (letterhead, digital signature, clinic stamp).
  - Collision-safe atomic ID generators (`PAT-YYYY-XXXXXX`, `REG-YYYY-XXXXXX`, `ORD-YYYY-XXXXXX`, `SMP-YYYY-XXXXXX`, `INV-YYYY-XXXXXX`).
- **Comprehensive Document Engines**:
  - **Vector PDF Generator (PDFKit)**: Dynamic multi-page medical lab reports, complete with QR code/barcode verification, clinic branding, test parameters, flags, and pathologist digital signatures.
  - **DOCX Generator**: Administrative Word export capability.
  - **HTML Print View**: Fast browser printing directly from `/api/v1/reports/:id/print`.

---

## 9-Role Granular RBAC System

LabCare Pro seeds 9 system roles with strict permission checks:

1. **Super Admin**: Full global system configuration, tenant management, and user provisioning.
2. **Lab Admin**: Clinic-level operations, catalogue management, staff assignments, and financial audits.
3. **Pathologist**: Authorized to review, edit, approve, and verify lab results with digital signature snapshot.
4. **Lab Technician**: Access to sample processing, analyzer result entry, and equipment maintenance.
5. **Phlebotomist**: Specimen collection, barcode validation, sample rejection, and recollection.
6. **Receptionist**: Patient registration, visit logging, test ordering, appointment booking, and bill collection.
7. **Doctor (Referring)**: View referred patients, orders, and published clinical reports.
8. **Billing Clerk**: Manage invoices, payment collection (Cash/Card/UPI), and refunds.
9. **Patient**: Secure access restricted exclusively to own visits, invoices, and published reports (IDOR-protected).

---

## Directory Structure

```
shulab/
├── docs/                        # Complete technical documentation
│   ├── API_REFERENCE.md         # Full endpoint catalog and parameters
│   ├── ARCHITECTURE.md          # System architecture and security design
│   ├── ERD.md                   # Entity Relationship Diagram & schemas
│   ├── RENDER_DEPLOYMENT.md     # Step-by-step free tier Render guide
│   └── VERCEL_INTEGRATION.md    # Next.js frontend integration & Axios interceptor
├── src/
│   ├── common/                  # Cross-cutting concerns
│   │   ├── errors/              # AppError & centralized error middleware
│   │   ├── logging/             # Pino structured logger with PII redaction
│   │   ├── middleware/          # auth, permissions, clinicContext, validate
│   │   └── utilities/           # crypto (AES-256-GCM), currency, ID generator
│   ├── config/                  # Zod environment schema validation
│   ├── database/                # Mongoose connection & initial seeders
│   ├── docs/                    # OpenAPI / Swagger specification
│   ├── docx/                    # DOCX report export engine
│   ├── pdf/                     # PDFKit vector medical report generator
│   ├── storage/                 # Storage client (S3/R2 + Local Disk fallback)
│   ├── modules/                 # Modular domain logic
│   │   ├── analytics/           # Operational KPI metrics & dashboards
│   │   ├── audit/               # Immutable audit log tracking
│   │   ├── auth/                # Session, AES cookies, login, refresh, logout
│   │   ├── billing/             # Invoices, payments, refunds, daily collections
│   │   ├── clinics/             # Multi-branch clinic management
│   │   ├── doctors/             # Pathologists vs Referring docs & assets
│   │   ├── inventory/           # Reagents, batch tracking, low-stock alerts
│   │   ├── notifications/       # Multi-channel alerts (in-app, email, SMS)
│   │   ├── orders/              # Test order state machine & pricing
│   │   ├── patients/            # Registration, atomic IDs, visit history
│   │   ├── reports/             # Report publication, downloads, templates
│   │   ├── results/             # Result entry, reference ranges, verification
│   │   ├── roles/               # 9 system roles and permission definitions
│   │   ├── samples/             # Barcode generation, collection, rejection
│   │   ├── settings/            # Key-value system configurations
│   │   ├── tests/               # Test catalog, parameters, panels/packages
│   │   └── users/               # Staff user management & lockout handling
│   ├── app.ts                   # Express application setup
│   └── server.ts                # HTTP server bootstrap & graceful shutdown
├── storage/uploads/             # Local storage fallback directory
├── tests/                       # Vitest automated test suites
│   ├── auth.test.ts             # Cookie, AES encryption, rememberMe & refresh tests
│   ├── crypto.test.ts           # AES-256-GCM, Bcrypt, Currency math tests
│   └── e2e-workflow.test.ts     # Complete 24-step end-to-end acceptance test
├── package.json
├── render.yaml                  # Render Infrastructure-as-Code Blueprint
├── tsconfig.json                # TypeScript strict NodeNext configuration
└── vitest.config.ts             # Vitest test configuration
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20 or v24+
- **npm**: v10+
- **MongoDB**: Local MongoDB instance or free MongoDB Atlas URI

### 2. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

Ensure `.env` contains valid values (a random 64-character hex string for `SESSION_SECRET`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/labcare_pro
SESSION_SECRET=a8b3e4f6291a27e3612d48347fbc01826f0923e198302f8641d9c72e4b30129a
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./storage/uploads
CORS_ORIGIN=http://localhost:3000
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
```

### 3. Install Dependencies & Build
```bash
npm install
npm run build
```

### 4. Run Automated Tests
All 36 tests execute against an in-memory MongoDB replica set (`mongodb-memory-server`):
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```

The server will automatically bootstrap, connect to MongoDB, seed default roles and create the initial Super Admin:
- **Email**: `admin@labcarepro.internal`
- **Password**: `Admin@LabCarePro2026!`

Interactive Swagger documentation is available at:
```
http://localhost:5000/api-docs
```

---

## Free-Tier Deployment Guides

- **Deploy Backend to Render (Free)**: See [docs/RENDER_DEPLOYMENT.md](file:///c:/Users/mithl/OneDrive/Documents/Desktop/shulab/docs/RENDER_DEPLOYMENT.md) for step-by-step instructions on setting up Render and MongoDB Atlas Free M0.
- **Integrate Next.js on Vercel (Free)**: See [docs/VERCEL_INTEGRATION.md](file:///c:/Users/mithl/OneDrive/Documents/Desktop/shulab/docs/VERCEL_INTEGRATION.md) for Axios interceptors, 30-day Remember Me cookie handling, and cross-site requests.

---

## Key cURL Testing Examples

### 1. Health & Liveness Probe
```bash
curl -X GET http://localhost:5000/health
```

### 2. Staff Login with 30-Day "Remember Me"
```bash
curl -i -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@labcarepro.internal",
    "password": "Admin@LabCarePro2026!",
    "rememberMe": true
  }'
```
*Response sets two AES-256-GCM encrypted HTTP-only cookies (`labcare_access_token` and `labcare_refresh_token` with 30-day expiry).*

### 3. Rotate and Refresh Session via Cookies
```bash
curl -i -X POST http://localhost:5000/api/v1/auth/refresh \
  --cookie "labcare_refresh_token=<ENCRYPTED_TOKEN>"
```

### 4. Register a New Patient
```bash
curl -X POST http://localhost:5000/api/v1/patients \
  -H "Content-Type: application/json" \
  --cookie "labcare_access_token=<ENCRYPTED_ACCESS_TOKEN>" \
  -d '{
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "gender": "male",
    "dateOfBirth": "1988-06-15",
    "phone": "+919876543210",
    "email": "rajesh.kumar@example.com",
    "address": { "city": "Mumbai", "country": "India" }
  }'
```

### 5. Create Diagnostic Test Order
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  --cookie "labcare_access_token=<ENCRYPTED_ACCESS_TOKEN>" \
  -d '{
    "patientId": "<PATIENT_OBJECT_ID>",
    "clinicId": "<CLINIC_OBJECT_ID>",
    "referringDoctorId": "<DOCTOR_OBJECT_ID>",
    "testIds": ["<TEST_OBJECT_ID>"],
    "priority": "routine"
  }'
```

### 6. Enter Results & Automatic Abnormal Evaluation
```bash
curl -X PUT http://localhost:5000/api/v1/results/<RESULT_ID>/parameters \
  -H "Content-Type: application/json" \
  --cookie "labcare_access_token=<ENCRYPTED_ACCESS_TOKEN>" \
  -d '{
    "results": [
      {
        "parameterId": "<PARAM_OBJECT_ID>",
        "value": "18.5"
      }
    ],
    "technicianNotes": "Sample analyzed on auto-hematology analyzer."
  }'
```

### 7. Pathologist Verification with Digital Signoff
```bash
curl -X POST http://localhost:5000/api/v1/results/<RESULT_ID>/verify \
  -H "Content-Type: application/json" \
  --cookie "labcare_access_token=<ENCRYPTED_PATHOLOGIST_ACCESS_TOKEN>" \
  -d '{
    "comments": "Clinical correlation recommended. Verified by Dr. Pathologist."
  }'
```

### 8. Download Generated Vector PDF Report
```bash
curl -X GET http://localhost:5000/api/v1/reports/<REPORT_ID>/download \
  --cookie "labcare_access_token=<ENCRYPTED_ACCESS_TOKEN>" \
  --output report.pdf
```

---

## Production Security Measures

- **No Plaintext Tokens**: Sessions in the database store SHA-256 hashes of cryptographically random 32-byte tokens.
- **AES-256-GCM Encrypted Cookies**: Token cookies passed over the wire are encrypted using AES-256-GCM with unique 16-byte IVs and 16-byte authentication tags, preventing client-side decryption or tampering.
- **IDOR Protection**: Patient routes strictly prevent access to orders, visits, and reports belonging to any other patient ID.
- **Decimal Safety**: All currency and billing operations are calculated using an integer-scaled currency utility (`currency.util.ts`), eliminating floating-point rounding errors.
- **Structured Redaction**: Sensitive attributes such as passwords, tokens, and patient clinical records are redacted from application logs via Pino.

---

## License
MIT License. LabCare Pro Enterprise.
