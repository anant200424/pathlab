import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AuditEvent } from "./audit-event.model.js";

export class AuditController {
  static async listAuditEvents(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        action,
        entityType,
        actorId,
        clinicId,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const p = Math.max(1, page ? Number(page) : 1);
      const l = Math.min(100, Math.max(1, limit ? Number(limit) : 25));
      const skip = (p - 1) * l;

      const filter: Record<string, unknown> = {};
      if (action) filter.action = action;
      if (entityType) filter.entityType = entityType;
      if (actorId && Types.ObjectId.isValid(actorId as string))
        filter.actorId = new Types.ObjectId(actorId as string);
      if (clinicId && Types.ObjectId.isValid(clinicId as string))
        filter.clinicId = new Types.ObjectId(clinicId as string);

      if (startDate || endDate) {
        const dateFilter: Record<string, Date> = {};
        if (startDate) dateFilter.$gte = new Date(startDate as string);
        if (endDate) dateFilter.$lte = new Date(endDate as string);
        filter.createdAt = dateFilter;
      }

      const [items, total] = await Promise.all([
        AuditEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l),
        AuditEvent.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            page: p,
            limit: l,
            total,
            totalPages: Math.ceil(total / l),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
