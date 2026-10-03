import { Request, Response, NextFunction } from "express";
import { PatientService } from "./patient.service.js";

export class PatientController {
  static async registerPatient(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const clinicId =
        req.body.clinicId ||
        req.clinicId ||
        (req.user?.clinics && req.user.clinics[0]?.toString());
      if (clinicId) {
        req.body.clinicId = clinicId;
      }

      const result = await PatientService.registerPatient(
        req.body,
        req.user?._id?.toString(),
      );

      const patientDoc = result.patient;
      const patientData =
        typeof (patientDoc as any)?.toObject === "function"
          ? (patientDoc as any).toObject()
          : patientDoc;

      res.status(201).json({
        success: true,
        data: {
          ...patientData,
          patient: result.patient,
          visit: result.visit,
          warning: result.warning,
        },
        message: "Patient registered successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async listPatients(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { clinicId, search, phone, startDate, endDate, page, limit } =
        req.query;
      const result = await PatientService.listPatients({
        clinicId: clinicId as string,
        search: search as string,
        phone: phone as string,
        startDate: startDate as string,
        endDate: endDate as string,
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

  static async getPatientById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const patient = await PatientService.getPatientById(
        req.params["id"] as string,
      );
      res.status(200).json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePatient(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const patient = await PatientService.updatePatient(
        req.params["id"] as string,
        req.body,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: patient,
        message: "Patient profile updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPatientHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const history = await PatientService.getPatientHistory(
        req.params["id"] as string,
      );
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}
