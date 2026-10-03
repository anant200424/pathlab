import http from "http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";
import { seedInitialData } from "./database/seeder.js";
import { logger } from "./common/logging/logger.js";

let server: http.Server | null = null;

async function startServer(): Promise<void> {
  try {
    logger.info("Starting LabCare Pro Enterprise Backend...");

    // 1. Connect to Database
    await connectDatabase();

    // 2. Seed System Roles and Default Administrator
    await seedInitialData();

    // 3. Create Express App & HTTP Server
    const app = createApp();
    server = http.createServer(app);

    const port = Number(process.env.PORT) || env.PORT;
    const host = "0.0.0.0";

    server.listen(port, host, () => {
      logger.info(
        `LabCare Pro Server listening on http://${host}:${port}${env.API_PREFIX}`,
      );
      logger.info(`Health check: http://${host}:${port}/health`);
      logger.info(`Readiness check: http://${host}:${port}/ready`);
      logger.info(`OpenAPI Documentation: http://${host}:${port}/api-docs`);
    });

    // 4. Graceful Shutdown Handler
    const shutdown = async (signal: string) => {
      logger.warn(`Received ${signal}. Starting graceful shutdown...`);

      if (server) {
        server.close(async () => {
          logger.info("HTTP server closed.");
          try {
            await disconnectDatabase();
            logger.info("Graceful shutdown completed successfully.");
            process.exit(0);
          } catch (err) {
            logger.error(
              { err },
              "Error disconnecting database during shutdown.",
            );
            process.exit(1);
          }
        });

        // Force shutdown after timeout if pending requests do not close
        setTimeout(() => {
          logger.error("Shutdown timeout reached (10s). Forcing process exit.");
          process.exit(1);
        }, 10000).unref();
      } else {
        process.exit(0);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      logger.error({ reason }, "Unhandled Promise Rejection detected");
    });

    process.on("uncaughtException", (err) => {
      logger.fatal({ err }, "Uncaught Exception detected");
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ error }, "Failed to start LabCare Pro Server");
    process.exit(1);
  }
}

startServer();
