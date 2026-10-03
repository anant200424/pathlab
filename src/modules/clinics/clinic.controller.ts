import { Request, Response, NextFunction } from "express";
import { ClinicService } from "./clinic.service.js";

export class ClinicController {
  static async createClinic(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const clinic = await ClinicService.createClinic(
        req.body,
        req.user?._id?.toString(),
      );
      res.status(201).json({
        success: true,
        data: clinic,
        message: "Clinic created successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async listClinics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { search, isActive, page, limit } = req.query;
      const result = await ClinicService.listClinics({
        search: search as string,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
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

  static async getClinicById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const clinic = await ClinicService.getClinicById(
        req.params["id"] as string,
      );
      res.status(200).json({
        success: true,
        data: clinic,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateClinic(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const clinic = await ClinicService.updateClinic(
        req.params["id"] as string,
        req.body,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: clinic,
        message: "Clinic updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async deactivateClinic(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const clinic = await ClinicService.deactivateClinic(
        req.params["id"] as string,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: clinic,
        message: "Clinic archived/deactivated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
}
