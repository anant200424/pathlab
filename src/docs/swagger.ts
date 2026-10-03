export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "LabCare Pro Enterprise LIMS API",
    version: "1.0.0",
    description:
      "Production-oriented Laboratory Information and Management System (LIMS) Backend API for clinic management, doctor profiles, patient registration, orders, specimen tracking, result entry, verifications, report generation, and billing.",
  },
  servers: [
    {
      url: "/api/v1",
      description: "API v1",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "labcare_session",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Process health check",
        responses: {
          "200": { description: "Process alive" },
        },
      },
    },
    "/ready": {
      get: {
        summary: "Readiness check (including database connectivity)",
        responses: {
          "200": { description: "System and database ready" },
          "503": { description: "Database unavailable" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Authenticate user and issue revocable session cookie",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  clinicId: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful" },
          "401": { description: "Invalid credentials or inactive account" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Revoke active session and clear cookie",
        responses: {
          "200": { description: "Logged out successfully" },
        },
      },
    },
    "/auth/me": {
      get: {
        summary:
          "Get current authenticated user profile, roles, and permissions",
        responses: {
          "200": { description: "Current profile" },
        },
      },
    },
    "/clinics": {
      get: {
        summary: "List clinics and branches",
        responses: { "200": { description: "Clinics list" } },
      },
      post: {
        summary: "Create a new clinic/branch",
        responses: { "201": { description: "Clinic created" } },
      },
    },
    "/clinics/{clinicId}/doctors": {
      get: {
        summary: "Get authorized active doctors for a clinic dropdown",
        parameters: [
          {
            name: "clinicId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Dropdown doctor items" } },
      },
    },
    "/patients": {
      get: {
        summary: "Search and list patient registrations",
        responses: { "200": { description: "Patients list" } },
      },
      post: {
        summary: "Register a patient with atomic ID generation",
        responses: { "201": { description: "Patient registered" } },
      },
    },
    "/orders": {
      get: {
        summary: "List laboratory test orders",
        responses: { "200": { description: "Orders list" } },
      },
      post: {
        summary:
          "Create order, allocate barcode, group specimen samples, and initialize draft results",
        responses: { "201": { description: "Order created" } },
      },
    },
    "/samples/{id}/collect": {
      post: {
        summary: "Record sample collection",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Collection recorded" } },
      },
    },
    "/results/{id}/enter": {
      post: {
        summary:
          "Enter lab test parameter results and calculate abnormal flags",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Results entered" } },
      },
    },
    "/results/{id}/verify": {
      post: {
        summary: "Verify test results by authorized pathologist",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Results verified" } },
      },
    },
    "/reports/{orderId}/generate": {
      post: {
        summary:
          "Publish clinical report and store immutable branding/signature snapshot",
        parameters: [
          {
            name: "orderId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "201": { description: "Report published" } },
      },
    },
    "/reports/{id}/download": {
      get: {
        summary: "Download clinical report PDF or DOCX",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "format",
            in: "query",
            schema: { type: "string", enum: ["pdf", "docx"] },
          },
        ],
        responses: { "200": { description: "File stream download" } },
      },
    },
    "/billing/payments": {
      post: {
        summary:
          "Record payment against invoice with decimal-safe calculations",
        responses: { "201": { description: "Payment recorded" } },
      },
    },
    "/analytics/dashboard": {
      get: {
        summary: "Retrieve operational and financial dashboard analytics",
        responses: { "200": { description: "Dashboard metrics" } },
      },
    },
  },
};
