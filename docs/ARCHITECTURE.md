# LabCare Pro Enterprise LIMS - Architectural Blueprint

## 1. System Overview

LabCare Pro is an enterprise-grade Laboratory Information and Management System (LIMS) backend designed for multi-clinic clinical diagnostic laboratories, hospital pathology departments, and diagnostic networks.

The system is architected around security, medical data integrity, deterministic template resolution, decimal-safe financial calculations, and compliance with healthcare regulations.

```
                           +---------------------------+
                           |  Next.js Frontend (Vercel) |
                           +-------------+-------------+
                                         |
                                         | HTTPS (CORS, SameSite=none, Credentials)
                                         v
                           +---------------------------+
                           |   Express API (Render)    |
                           +-------------+-------------+
                                         |
            +----------------------------+----------------------------+
            |                            |                            |
            v                            v                            v
  +------------------+         +------------------+         +------------------+
  |  MongoDB Atlas   |         | Object Storage   |         | Document Engines |
  | (Mongoose Multi) |         | (Local / AWS S3) |         | (PDFKit / docx)  |
  +------------------+         +------------------+         +------------------+
```

## 2. Core Architectural Pillars

### 2.1 Multi-Clinic Isolation and IDOR Prevention
- Every patient record, order, sample, and result is strictly partitioned by `clinicId`.
- Clinic context middleware verifies that non-superadmin staff only access records within their assigned branches.
- Direct object references (IDOR) are prevented: patient accounts can only read their own published reports; other patients or unauthorized doctors are blocked with HTTP 403 Forbidden.

### 2.2 Dual Token Cookie Authentication with AES-256-GCM Encryption
- **Access Token**: Short-lived (15-minute) signed payload encrypted with AES-256-GCM and stored in the `labcare_access_token` HTTP-only cookie.
- **Refresh Token**: Opaque 256-bit cryptographically random token stored in the `labcare_refresh_token` HTTP-only cookie and hashed with SHA-256 in the database `Session` collection.
- **Remember Me**:
  - `rememberMe: false` -> 24-hour session.
  - `rememberMe: true` -> 30-day session expiry.
- **Tamper Resistance**: AES-256-GCM utilizes a 16-byte initialization vector (IV) and a 16-byte authentication tag. Any tampering immediately invalidates the token.
- **Instant Revocation**: Logout, password changes, or administrative suspension immediately revokes the session in the database.

### 2.3 Deterministic Report Template Resolution & Immutable Snapshots
1. **Clinic Identification**: Resolves the laboratory or branch issuing the report.
2. **Branding Resolution**: Fetches clinic logo, letterhead settings, address, and header/footer configurations.
3. **Verifier Authorization**: Validates that the assigned signing doctor has active `isVerifyingDoctor` credentials. Referring doctors cannot sign reports.
4. **Asset Retrieval**: Loads approved signature and official stamp images from private storage.
5. **Document Rendering**: Generates official multi-page PDF using PDFKit and authorized editable DOCX using `docx`.
6. **Immutable Snapshot**: Stores an immutable snapshot (`brandingSnapshot`, `signerSnapshot`, `testResultsSnapshot`) in MongoDB and private storage. Future modifications to doctor signatures or clinic letterheads do not alter previously issued reports.

### 2.4 Decimal-Safe Financial Architecture
- JavaScript floating point drift (`0.1 + 0.2 = 0.30000000000000004`) is eliminated by converting all monetary values to minor units (cents/paise) internally using integer arithmetic (`currency.util.ts`).
- Server-side calculation guarantees:
  - Total amount validation
  - Payment amount validation (overpayments blocked unless explicitly configured)
  - Atomic invoice and order balance updates
  - Idempotency keys prevent duplicate payments on network retries.
