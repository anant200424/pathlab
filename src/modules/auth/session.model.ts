import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISession extends Document {
  tokenHash: string;
  userId: Types.ObjectId;
  clinicId?: Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  rememberMe: boolean;
  expiresAt: Date;
  revokedAt?: Date;
  revokedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    rememberMe: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index automatically cleans expired sessions
    },
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

sessionSchema.index({ tokenHash: 1, revokedAt: 1, expiresAt: 1 });
sessionSchema.index({ userId: 1, revokedAt: 1 });

export const Session = mongoose.model<ISession>("Session", sessionSchema);
