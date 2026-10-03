import { Request, Response, NextFunction } from "express";
import { SampleService } from "./sample.service.js";

export class SampleController {
  static async listSamples(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { orderId, clinicId, status, specimenType, page, limit } =
        req.query;
      const result = await SampleService.listSamples({
        orderId: orderId as string,
        clinicId: clinicId as string,
        status: status as string,
        specimenType: specimenType as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSampleByBarcode(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sample = await SampleService.getSampleByBarcode(
        req.params["barcode"] as string,
      );
      res.status(200).json({
        success: true,
        data: sample,
      });
    } catch (error) {
      next(error);
    }
  }

  static async recordCollection(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sample = await SampleService.recordCollection(
        req.params["id"] as string,
        req.body.notes,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: sample,
        message: "Sample collection recorded.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async acceptSample(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sample = await SampleService.acceptSample(
        req.params["id"] as string,
        req.body.notes,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: sample,
        message: "Sample accepted in laboratory.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectSample(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sample = await SampleService.rejectSample(
        req.params["id"] as string,
        req.body.rejectionReason,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: sample,
        message: "Sample rejected.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async recollectSample(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sample = await SampleService.recollectSample(
        req.params["id"] as string,
        req.body.recollectionReason,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: sample,
        message: "Recollection recorded.",
      });
    } catch (error) {
      next(error);
    }
  }
}
