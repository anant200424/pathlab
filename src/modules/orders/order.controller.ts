import { Request, Response, NextFunction } from "express";
import { OrderService } from "./order.service.js";

export class OrderController {
  static async createOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const order = await OrderService.createOrder(
        req.body,
        req.user?._id?.toString(),
      );
      res.status(201).json({
        success: true,
        data: order,
        message: "Test order created successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async listOrders(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        clinicId,
        patientId,
        status,
        search,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;
      const result = await OrderService.listOrders({
        clinicId: clinicId as string,
        patientId: patientId as string,
        status: status as any,
        search: search as string,
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

  static async getOrderById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const order = await OrderService.getOrderById(req.params["id"] as string);
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status, note } = req.body;
      const order = await OrderService.updateOrderStatus(
        req.params["id"] as string,
        status,
        note,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: order,
        message: `Order status updated to ${status}.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
