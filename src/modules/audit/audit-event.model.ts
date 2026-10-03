import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAuditEvent extends Document {
  actorId?: Types.ObjectId;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  clinicId?: Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditEventSchema = new Schema<IAuditEvent>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    actorEmail: {
      type: String,
    },
    actorRole: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable audit logs: no updatedAt
  },
);

auditEventSchema.index({ createdAt: -1 });
auditEventSchema.index({ action: 1, createdAt: -1 });
auditEventSchema.index({ entityType: 1, entityId: 1 });

export const AuditEvent = mongoose.model<IAuditEvent>(
  "AuditEvent",
  auditEventSchema,
);
