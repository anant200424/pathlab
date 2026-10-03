import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../common/logging/logger.js";

// Ensure DNS resolution handles MongoDB Atlas SRV records correctly on all networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (dnsErr) {
  // If setServers fails in restricted environments, proceed with system DNS
}

let isConnected = false;

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const connectionUri = uri || env.MONGODB_URI;

  try {
    mongoose.set("strictQuery", true);

    mongoose.connection.on("connected", () => {
      isConnected = true;
      logger.info("MongoDB connection established successfully.");
    });

    mongoose.connection.on("error", (err) => {
      isConnected = false;
      logger.error({ err }, "MongoDB connection error occurred.");
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      logger.warn("MongoDB connection disconnected.");
    });

    const conn = await mongoose.connect(connectionUri, {
      maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
      minPoolSize: env.MONGODB_MIN_POOL_SIZE,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = mongoose.connection.readyState === 1;
    return conn;
  } catch (error) {
    isConnected = false;
    logger.error({ error }, "Failed to connect to MongoDB");
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info("MongoDB disconnected cleanly.");
  }
}

export function isDatabaseReady(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
