import { Request, Response, NextFunction } from "express";
import { SettingsService } from "./settings.service.js";

export class SettingsController {
  static async getAllSettings(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const settings = await SettingsService.getAllSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  static async setSetting(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { key, value, description } = req.body;
      const setting = await SettingsService.setSetting(
        key,
        value,
        description,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: setting,
        message: "Setting saved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
}
