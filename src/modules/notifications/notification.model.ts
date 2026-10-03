import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  channel: "in_app" | "email" | "sms";
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: {
      type: String,
      enum: ["in_app", "email", "sms"],
      default: "in_app",
    },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
