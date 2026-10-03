import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "./analytics.service.js";

export class AnalyticsController {
  static async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { clinicId } = req.query;
      const metrics = await AnalyticsService.getDashboardMetrics(
        clinicId as string,
      );
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}
