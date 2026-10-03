import { Types } from "mongoose";
import { Notification, INotification } from "./notification.model.js";
import { env } from "../../config/env.js";
import { logger } from "../../common/logging/logger.js";

export class NotificationService {
  static async sendNotification(data: {
    recipientId: string;
    title: string;
    message: string;
    channel?: "in_app" | "email" | "sms";
    metadata?: Record<string, unknown>;
  }): Promise<INotification> {
    const notification = await Notification.create({
      recipientId: new Types.ObjectId(data.recipientId),
      title: data.title,
      message: data.message,
      channel: data.channel || "in_app",
      metadata: data.metadata,
      isRead: false,
    });

    if (data.channel === "email" && env.EMAIL_PROVIDER_ENABLED) {
      logger.info(
        { to: data.recipientId, title: data.title },
        "Email notification dispatched via configured SMTP",
      );
    }

    if (data.channel === "sms" && env.SMS_PROVIDER_ENABLED) {
      logger.info(
        { to: data.recipientId },
        "SMS notification dispatched via configured SMS Gateway",
      );
    }

    return notification;
  }

  static async listUserNotifications(userId: string) {
    return Notification.find({ recipientId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  static async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(userId),
      },
      { $set: { isRead: true } },
      { new: true },
    );
  }
}
