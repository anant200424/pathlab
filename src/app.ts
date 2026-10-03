import express, { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { requestIdMiddleware } from "./common/middleware/request-id.middleware.js";
import { globalRateLimiter } from "./common/middleware/rate-limit.middleware.js";
import { errorHandler } from "./common/errors/error-handler.js";
import { AppError } from "./common/errors/app-error.js";
import { isDatabaseReady } from "./database/connection.js";
import { swaggerDocument } from "./docs/swagger.js";

// Import Route Handlers
import { authRoutes } from "./modules/auth/auth.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";
import { clinicRoutes } from "./modules/clinics/clinic.routes.js";
import { doctorRoutes } from "./modules/doctors/doctor.routes.js";
import { patientRoutes } from "./modules/patients/patient.routes.js";
import { testRoutes } from "./modules/tests/test.routes.js";
import { orderRoutes } from "./modules/orders/order.routes.js";
import { sampleRoutes } from "./modules/samples/sample.routes.js";
import { resultRoutes } from "./modules/results/result.routes.js";
import { reportRoutes } from "./modules/reports/report.routes.js";
import { billingRoutes } from "./modules/billing/billing.routes.js";
import { inventoryRoutes } from "./modules/inventory/inventory.routes.js";
import { analyticsRoutes } from "./modules/analytics/analytics.routes.js";
import { notificationRoutes } from "./modules/notifications/notification.routes.js";
import { settingsRoutes } from "./modules/settings/settings.routes.js";
import { auditRoutes } from "./modules/audit/audit.routes.js";

export function createApp(): Express {
  const app = express();

  // 1. Trust proxy (Required for Render, reverse proxies, and rate limiter behind LB)
  app.set("trust proxy", 1);

  // 2. Request ID & Security Headers
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI and report previews
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // 3. Explicit CORS Allowlist with credentials
  const allowedOrigins = env.FRONTEND_ORIGINS.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (such as mobile apps, curl, server-to-server)
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes("*") ||
          origin.endsWith(".vercel.app") ||
          origin.includes("vercel.app") ||
          origin.includes("localhost") ||
          env.NODE_ENV === "development"
        ) {
          callback(null, true);
        } else {
          callback(
            new AppError(
              `Origin '${origin}' not allowed by CORS policy.`,
              403,
              "CORS_ERROR",
            ),
          );
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
    }),
  );

  // 4. Body and Cookie Parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser(env.SESSION_SECRET));

  // 5. Global Rate Limiter
  if (env.NODE_ENV !== "test") {
    app.use(globalRateLimiter);
  }

  // 6. OpenAPI Documentation
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // 7. Health and Readiness Endpoints
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "UP",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get("/ready", (_req: Request, res: Response) => {
    const dbReady = isDatabaseReady();
    if (!dbReady) {
      res.status(503).json({
        status: "DOWN",
        database: "DISCONNECTED",
        timestamp: new Date().toISOString(),
      });
      return;
    }
    res.status(200).json({
      status: "READY",
      database: "CONNECTED",
      timestamp: new Date().toISOString(),
    });
  });

  // 8. API v1 Module Routes
  const apiRouter = express.Router();
  apiRouter.use("/auth", authRoutes);
  apiRouter.use("/users", userRoutes);
  apiRouter.use("/clinics", clinicRoutes);
  apiRouter.use("/doctors", doctorRoutes);
  apiRouter.use("/patients", patientRoutes);
  apiRouter.use("/tests", testRoutes);
  apiRouter.use("/orders", orderRoutes);
  apiRouter.use("/samples", sampleRoutes);
  apiRouter.use("/results", resultRoutes);
  apiRouter.use("/reports", reportRoutes);
  apiRouter.use("/billing", billingRoutes);
  apiRouter.use("/inventory", inventoryRoutes);
  apiRouter.use("/analytics", analyticsRoutes);
  apiRouter.use("/notifications", notificationRoutes);
  apiRouter.use("/settings", settingsRoutes);
  apiRouter.use("/audit", auditRoutes);

  app.use(env.API_PREFIX, apiRouter);

  // 9. 404 Route Not Found Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(AppError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
  });

  // 10. Centralized Error Handler Middleware
  app.use(errorHandler);

  return app;
}
