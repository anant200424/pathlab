import { Request, Response, NextFunction } from "express";
import { BillingService } from "./billing.service.js";

export class BillingController {
  static async createInvoiceForOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const invoice = await BillingService.createInvoiceForOrder(
        req.body.orderId,
        req.body.notes,
        req.user?._id?.toString(),
      );
      res.status(201).json({
        success: true,
        data: invoice,
        message: "Invoice created successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const payment = await BillingService.recordPayment(
        req.body,
        req.user!._id.toString(),
      );
      res.status(201).json({
        success: true,
        data: payment,
        message: "Payment recorded successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async issueRefund(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const refund = await BillingService.issueRefund(
        req.body,
        req.user!._id.toString(),
      );
      res.status(200).json({
        success: true,
        data: refund,
        message: "Refund issued successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const invoice = await BillingService.getInvoiceById(
        req.params["id"] as string,
      );
      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentsForInvoice(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const payments = await BillingService.getPaymentsForInvoice(
        req.params["invoiceId"] as string,
      );
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDailyCollections(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { clinicId, date } = req.query;
      const collections = await BillingService.getDailyCollections(
        clinicId as string,
        date as string,
      );
      res.status(200).json({
        success: true,
        data: collections,
      });
    } catch (error) {
      next(error);
    }
  }
}
