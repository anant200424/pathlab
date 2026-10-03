import { Request, Response, NextFunction } from "express";
import { DoctorService } from "./doctor.service.js";
import { DoctorAssetType } from "./doctor-asset.model.js";
import { AppError } from "../../common/errors/app-error.js";

export class DoctorController {
  static async createDoctor(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const doctor = await DoctorService.createDoctor(
        req.body,
        req.user?._id?.toString(),
      );
      res.status(201).json({
        success: true,
        data: doctor,
        message: "Doctor profile created successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async listDoctors(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        clinicId,
        isVerifying,
        isReferring,
        isActive,
        search,
        page,
        limit,
      } = req.query;
      const result = await DoctorService.listDoctors({
        clinicId: clinicId as string,
        isVerifying:
          isVerifying !== undefined ? isVerifying === "true" : undefined,
        isReferring:
          isReferring !== undefined ? isReferring === "true" : undefined,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
        search: search as string,
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

  static async getClinicDoctorsDropdown(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const clinicId = req.params["clinicId"] as string;
      const doctors = await DoctorService.getDoctorsForClinicDropdown(clinicId);
      res.status(200).json({
        success: true,
        data: doctors,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDoctorById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const doctor = await DoctorService.getDoctorById(
        req.params["id"] as string,
      );
      res.status(200).json({
        success: true,
        data: doctor,
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadAsset(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const doctorId = req.params["id"] as string;
      const assetType = req.body.assetType as DoctorAssetType;
      const file = req.file;

      if (!file) {
        throw AppError.badRequest("No asset file uploaded.");
      }
      if (!assetType) {
        throw AppError.badRequest(
          "assetType is required (parchi, letterhead, logo, signature, stamp, report_bg).",
        );
      }

      const asset = await DoctorService.uploadDoctorAsset(
        doctorId,
        assetType,
        file.buffer,
        file.originalname,
        file.mimetype,
        req.user?._id?.toString(),
      );

      res.status(201).json({
        success: true,
        data: asset,
        message:
          "Doctor asset uploaded successfully. Awaiting administrative approval.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveAsset(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const assetId = req.params["assetId"] as string;
      const { approved } = req.body;
      const asset = await DoctorService.approveDoctorAsset(
        assetId,
        approved,
        req.user!._id.toString(),
      );

      res.status(200).json({
        success: true,
        data: asset,
        message: approved
          ? "Doctor asset approved successfully."
          : "Doctor asset rejected.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAssetSignedUrl(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const assetId = req.params["assetId"] as string;
      const result = await DoctorService.getAssetSignedUrl(assetId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
