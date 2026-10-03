import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError } from "./app-error.js";
import { logger } from "../logging/logger.js";
import { env } from "../../config/env.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId =
    (req.headers["x-request-id"] as string) ||
    (req as unknown as { id?: string }).id ||
    "unknown";

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const formattedDetails = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));

    res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the submitted data.",
        details: formattedDetails,
      },
      requestId,
    });
    return;
  }

  // 2. Custom App Error
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, `Operational Error: ${err.message}`);
    } else {
      logger.warn(
        { err, requestId },
        `Client Error [${err.statusCode}]: ${err.message}`,
      );
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details ?? [],
      },
      requestId,
    });
    return;
  }

  // 3. Mongoose Duplicate Key Error (E11000)
  if ((err as unknown as { code?: number }).code === 11000) {
    const keyPattern = (
      err as unknown as { keyPattern?: Record<string, number> }
    ).keyPattern;
    const duplicateFields = keyPattern
      ? Object.keys(keyPattern).join(", ")
      : "field";

    res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_ENTRY",
        message: `A record with this ${duplicateFields} already exists.`,
        details: keyPattern ? [keyPattern] : [],
      },
      requestId,
    });
    return;
  }

  // 4. Mongoose Validation Error
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    res.status(422).json({
      success: false,
      error: {
        code: "SCHEMA_VALIDATION_ERROR",
        message: "Invalid schema data provided.",
        details,
      },
      requestId,
    });
    return;
  }

  // 5. Mongoose Cast Error (Invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_IDENTIFIER",
        message: `Invalid identifier format for ${err.path}.`,
        details: [],
      },
      requestId,
    });
    return;
  }

  // 6. Generic or Unhandled Server Error
  logger.error({ err, requestId, stack: err.stack }, "Unhandled Server Error");

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        env.NODE_ENV === "production"
          ? "An unexpected error occurred. Please contact support."
          : err.message,
      details: [],
    },
    requestId,
  });
}
