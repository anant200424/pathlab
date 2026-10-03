import { Request, Response, NextFunction } from "express";
import { NotificationService } from "./notification.service.js";

export class NotificationController {
  static async listNotifications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const items = await NotificationService.listUserNotifications(
        req.user!._id.toString(),
      );
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const updated = await NotificationService.markAsRead(
        req.params["id"] as string,
        req.user!._id.toString(),
      );
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
