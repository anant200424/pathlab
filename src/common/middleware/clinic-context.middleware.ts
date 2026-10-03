import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";

export function enforceClinicAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const isSuperAdmin = (req as unknown as { isSuperAdmin?: boolean })
    .isSuperAdmin;
  if (isSuperAdmin) {
    return next();
  }

  // Clinic ID might come from URL params (e.g., :clinicId), query, or body
  const clinicId =
    req.params["clinicId"] ||
    (req.query["clinicId"] as string) ||
    req.body?.clinicId;

  if (!clinicId) {
    return next();
  }

  const userClinics = req.user?.clinics?.map((c) => c.toString()) || [];

  if (!userClinics.includes(clinicId.toString())) {
    return next(
      AppError.forbidden("Access denied to records of this clinic/branch."),
    );
  }

  next();
}
