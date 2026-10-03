import { Request, Response, NextFunction } from "express";
import { InventoryService } from "./inventory.service.js";

export class InventoryController {
  static async createItem(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const item = await InventoryService.createItem(
        req.body,
        req.user?._id?.toString(),
      );
      res.status(201).json({
        success: true,
        data: item,
        message: "Inventory item created successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async listItems(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { clinicId, category, lowStockOnly, search, page, limit } =
        req.query;
      const result = await InventoryService.listItems({
        clinicId: clinicId as string,
        category: category as string,
        lowStockOnly:
          lowStockOnly !== undefined ? lowStockOnly === "true" : undefined,
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

  static async recordMovement(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await InventoryService.recordMovement(
        req.params["id"] as string,
        req.body,
        req.user!._id.toString(),
      );
      res.status(200).json({
        success: true,
        data: result,
        message: "Stock movement recorded successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMovements(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const movements = await InventoryService.getMovements(
        req.params["id"] as string,
      );
      res.status(200).json({
        success: true,
        data: movements,
      });
    } catch (error) {
      next(error);
    }
  }
}
