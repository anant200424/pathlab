import { Types } from "mongoose";
import { Invoice, IInvoice, IInvoiceItem } from "./invoice.model.js";
import { Payment, IPayment, PaymentMethod } from "./payment.model.js";
import { Refund, IRefund } from "./refund.model.js";
import { TestOrder } from "../orders/order.model.js";
import { AppError } from "../../common/errors/app-error.js";
import { generateCustomId } from "../../common/utilities/id-generator.util.js";
import {
  toCents,
  addCurrency,
  subtractCurrency,
} from "../../common/utilities/currency.util.js";
import { AuditService } from "../audit/audit.service.js";

export class BillingService {
  static async createInvoiceForOrder(
    orderId: string,
    notes?: string,
    actorId?: string,
  ): Promise<IInvoice> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw AppError.badRequest("Invalid order ID.");
    }

    const order = await TestOrder.findById(orderId);
    if (!order) {
      throw AppError.notFound("Test order not found.");
    }

    // Check if an invoice already exists for this order
    const existing = await Invoice.findOne({ orderId: order._id });
    if (existing) {
      return existing;
    }

    const items: IInvoiceItem[] = [];

    // Individual tests
    for (const test of order.tests) {
      items.push({
        description: test.name,
        itemType: "test",
        itemId: test.testId,
        quantity: 1,
        unitPrice: test.price,
        totalPrice: test.price,
      });
    }

    // Packages
    for (const pkg of order.packages) {
      items.push({
        description: `Package: ${pkg.name}`,
        itemType: "package",
        itemId: pkg.packageId,
        quantity: 1,
        unitPrice: pkg.price,
        totalPrice: pkg.price,
      });
    }

    const invoiceNumber = generateCustomId("INV", 4);

    const invoice = await Invoice.create({
      invoiceNumber,
      orderId: order._id,
      patientId: order.patientId,
      clinicId: order.clinicId,
      items,
      subtotal: order.pricing.subtotal,
      discountPercent: order.pricing.discountPercent,
      discountAmount: order.pricing.discountAmount,
      taxAmount: 0,
      netTotal: order.pricing.netTotal,
      paidAmount: 0,
      balanceDue: order.pricing.netTotal,
      status: "unpaid",
      notes,
      createdBy: actorId ? new Types.ObjectId(actorId) : undefined,
    });

    order.pricing.invoiceId = invoice._id as Types.ObjectId;
    await order.save();

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "billing:invoice_create",
      entityType: "Invoice",
      entityId: invoice._id.toString(),
      clinicId: invoice.clinicId,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        netTotal: invoice.netTotal,
      },
    });

    return invoice;
  }

  static async recordPayment(
    data: {
      invoiceId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      transactionReference?: string;
      notes?: string;
      idempotencyKey?: string;
    },
    actorId: string,
  ): Promise<IPayment> {
    if (!Types.ObjectId.isValid(data.invoiceId)) {
      throw AppError.badRequest("Invalid invoice ID.");
    }

    // Idempotency check
    if (data.idempotencyKey) {
      const existing = await Payment.findOne({
        idempotencyKey: data.idempotencyKey,
      });
      if (existing) {
        return existing;
      }
    }

    const invoice = await Invoice.findById(data.invoiceId);
    if (!invoice) {
      throw AppError.notFound("Invoice not found.");
    }

    if (invoice.status === "cancelled") {
      throw AppError.badRequest(
        "Cannot record payment against a cancelled invoice.",
      );
    }

    const paymentAmountCents = toCents(data.amount);
    const balanceDueCents = toCents(invoice.balanceDue);

    if (paymentAmountCents <= 0) {
      throw AppError.badRequest("Payment amount must be greater than zero.");
    }

    if (paymentAmountCents > balanceDueCents) {
      throw AppError.badRequest(
        `Overpayment not permitted. Maximum payable balance is ${invoice.balanceDue}, requested: ${data.amount}.`,
      );
    }

    const receiptNumber = generateCustomId("REC", 4);

    const payment = await Payment.create({
      receiptNumber,
      invoiceId: invoice._id,
      orderId: invoice.orderId,
      patientId: invoice.patientId,
      clinicId: invoice.clinicId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionReference,
      notes: data.notes,
      receivedBy: new Types.ObjectId(actorId),
      idempotencyKey: data.idempotencyKey,
    });

    // Update invoice balance
    invoice.paidAmount = addCurrency(invoice.paidAmount, data.amount);
    invoice.balanceDue = subtractCurrency(invoice.balanceDue, data.amount);
    invoice.status = invoice.balanceDue === 0 ? "paid" : "partially_paid";
    await invoice.save();

    // Update order pricing balance
    const order = await TestOrder.findById(invoice.orderId);
    if (order) {
      order.pricing.paidAmount = invoice.paidAmount;
      order.pricing.balanceDue = invoice.balanceDue;
      await order.save();
    }

    await AuditService.log({
      actorId: new Types.ObjectId(actorId),
      action: "billing:payment_record",
      entityType: "Payment",
      entityId: payment._id.toString(),
      clinicId: invoice.clinicId,
      details: {
        receiptNumber: payment.receiptNumber,
        amount: data.amount,
        remainingBalance: invoice.balanceDue,
      },
    });

    return payment;
  }

  static async issueRefund(
    data: {
      invoiceId: string;
      paymentId?: string;
      amount: number;
      reason: string;
      refundMethod?: string;
    },
    actorId: string,
  ): Promise<IRefund> {
    if (!Types.ObjectId.isValid(data.invoiceId)) {
      throw AppError.badRequest("Invalid invoice ID.");
    }

    const invoice = await Invoice.findById(data.invoiceId);
    if (!invoice) {
      throw AppError.notFound("Invoice not found.");
    }

    if (toCents(data.amount) > toCents(invoice.paidAmount)) {
      throw AppError.badRequest(
        `Refund amount cannot exceed total paid amount of ${invoice.paidAmount}. Requested: ${data.amount}.`,
      );
    }

    const refundNumber = generateCustomId("REF", 4);

    const refund = await Refund.create({
      refundNumber,
      invoiceId: invoice._id,
      paymentId: data.paymentId
        ? new Types.ObjectId(data.paymentId)
        : undefined,
      orderId: invoice.orderId,
      patientId: invoice.patientId,
      clinicId: invoice.clinicId,
      amount: data.amount,
      reason: data.reason,
      refundMethod: data.refundMethod || "cash",
      approvedBy: new Types.ObjectId(actorId),
    });

    // Update invoice
    invoice.paidAmount = subtractCurrency(invoice.paidAmount, data.amount);
    invoice.balanceDue = addCurrency(invoice.balanceDue, data.amount);
    if (invoice.paidAmount === 0) {
      invoice.status = "refunded";
    } else {
      invoice.status = "partially_paid";
    }
    await invoice.save();

    // Update order
    const order = await TestOrder.findById(invoice.orderId);
    if (order) {
      order.pricing.paidAmount = invoice.paidAmount;
      order.pricing.balanceDue = invoice.balanceDue;
      await order.save();
    }

    await AuditService.log({
      actorId: new Types.ObjectId(actorId),
      action: "billing:refund_issue",
      entityType: "Refund",
      entityId: refund._id.toString(),
      clinicId: invoice.clinicId,
      details: { refundNumber, amount: data.amount, reason: data.reason },
    });

    return refund;
  }

  static async getInvoiceById(id: string): Promise<IInvoice> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid invoice ID.");
    }
    const invoice = await Invoice.findById(id)
      .populate("patientId", "fullName patientId phone")
      .populate("clinicId", "name clinicCode branchCode address contact")
      .populate("orderId", "orderId orderBarcode status");

    if (!invoice) {
      throw AppError.notFound("Invoice not found.");
    }
    return invoice;
  }

  static async getPaymentsForInvoice(invoiceId: string) {
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw AppError.badRequest("Invalid invoice ID.");
    }
    return Payment.find({ invoiceId: new Types.ObjectId(invoiceId) })
      .populate("receivedBy", "firstName lastName")
      .sort({ createdAt: -1 });
  }

  static async getDailyCollections(clinicId?: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const filter: Record<string, unknown> = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };
    if (clinicId) {
      filter.clinicId = new Types.ObjectId(clinicId);
    }

    const payments = await Payment.find(filter)
      .populate("patientId", "fullName patientId")
      .populate("receivedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    const totalCollected = payments.reduce(
      (sum, p) => addCurrency(sum, p.amount),
      0,
    );

    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      byMethod[p.paymentMethod] = addCurrency(
        byMethod[p.paymentMethod] || 0,
        p.amount,
      );
    }

    return {
      date: startOfDay.toISOString().slice(0, 10),
      totalCollected,
      paymentCount: payments.length,
      byMethod,
      payments,
    };
  }
}
