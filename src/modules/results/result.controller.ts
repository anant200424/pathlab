import { Request, Response, NextFunction } from "express";
import { ResultService } from "./result.service.js";

export class ResultController {
  static async getResultsByOrderId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const results = await ResultService.getResultsByOrderId(
        req.params["orderId"] as string,
      );
      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getResultById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await ResultService.getResultById(
        req.params["id"] as string,
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async enterResults(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { parameterValues, remarks } = req.body;
      const result = await ResultService.enterResults(
        req.params["id"] as string,
        parameterValues,
        remarks,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: result,
        message: "Test results entered and saved.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyResult(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { verifyingDoctorId } = req.body;
      const result = await ResultService.verifyResult(
        req.params["id"] as string,
        verifyingDoctorId,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: result,
        message: "Test results verified successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectResult(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { rejectionReason } = req.body;
      const result = await ResultService.rejectResult(
        req.params["id"] as string,
        rejectionReason,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: result,
        message: "Test results rejected.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async amendResult(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { parameterValues, remarks, reason } = req.body;
      const result = await ResultService.amendResult(
        req.params["id"] as string,
        parameterValues,
        reason,
        remarks,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: result,
        message: "Test results amended and revision stored.",
      });
    } catch (error) {
      next(error);
    }
  }
}
