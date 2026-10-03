import { Types } from "mongoose";
import { AuditEvent } from "./audit-event.model.js";
import { logger } from "../../common/logging/logger.js";

export interface CreateAuditInput {
  actorId?: Types.ObjectId | string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  clinicId?: Types.ObjectId | string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(input: CreateAuditInput): Promise<void> {
    try {
      const sanitizedDetails = input.details
        ? this.sanitizeDetails(input.details)
        : undefined;

      await AuditEvent.create({
        actorId: input.actorId ? new Types.ObjectId(input.actorId) : undefined,
        actorEmail: input.actorEmail,
        actorRole: input.actorRole,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        clinicId: input.clinicId
          ? new Types.ObjectId(input.clinicId)
          : undefined,
        details: sanitizedDetails,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    } catch (err) {
      // Never crash the primary request because of an audit logging error
      logger.error(
        { err, action: input.action },
        "Failed to record audit event",
      );
    }
  }

  private static sanitizeDetails(
    details: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "cvv",
      "cardNumber",
      "pin",
    ];

    for (const [key, val] of Object.entries(details)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = "[REDACTED]";
      } else if (val instanceof Types.ObjectId) {
        sanitized[key] = val.toString();
      } else if (val instanceof Date) {
        sanitized[key] = val.toISOString();
      } else if (Array.isArray(val)) {
        sanitized[key] = val;
      } else if (
        typeof val === "object" &&
        val !== null &&
        val.constructor === Object
      ) {
        sanitized[key] = this.sanitizeDetails(val as Record<string, unknown>);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }
}
