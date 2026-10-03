import { Types } from "mongoose";
import { Patient } from "../patients/patient.model.js";
import { TestOrder } from "../orders/order.model.js";
import { Sample } from "../samples/sample.model.js";
import { Report } from "../reports/report.model.js";
import { Invoice } from "../billing/invoice.model.js";
import { Payment } from "../billing/payment.model.js";
import { InventoryItem } from "../inventory/inventory.model.js";

export class AnalyticsService {
  static async getDashboardMetrics(clinicId?: string) {
    const filter: Record<string, unknown> = {};
    if (clinicId && Types.ObjectId.isValid(clinicId)) {
      filter.clinicId = new Types.ObjectId(clinicId);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      todayPatients,
      pendingSamples,
      awaitingVerificationOrders,
      publishedReports,
      invoices,
      todayPayments,
      lowStockItems,
    ] = await Promise.all([
      Patient.countDocuments({ ...filter, isActive: true }),
      Patient.countDocuments({
        ...filter,
        isActive: true,
        createdAt: { $gte: todayStart },
      }),
      Sample.countDocuments({
        ...filter,
        status: { $in: ["pending", "collected"] },
      }),
      TestOrder.countDocuments({ ...filter, status: "awaiting_verification" }),
      Report.countDocuments({
        ...filter,
        status: { $in: ["published", "amended"] },
      }),
      Invoice.find(filter).select("netTotal paidAmount balanceDue status"),
      Payment.find({ ...filter, createdAt: { $gte: todayStart } }).select(
        "amount",
      ),
      InventoryItem.countDocuments({
        ...filter,
        isActive: true,
        $expr: { $lte: ["$currentStock", "$minimumThreshold"] },
      }),
    ]);

    const totalBilled = invoices.reduce(
      (sum, inv) => sum + (inv.netTotal || 0),
      0,
    );
    const totalCollected = invoices.reduce(
      (sum, inv) => sum + (inv.paidAmount || 0),
      0,
    );
    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + (inv.balanceDue || 0),
      0,
    );
    const todayCollections = todayPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );

    return {
      patients: {
        total: totalPatients,
        registeredToday: todayPatients,
      },
      workload: {
        pendingSamples,
        awaitingVerificationOrders,
        publishedReports,
      },
      financials: {
        totalBilled: Number(totalBilled.toFixed(2)),
        totalCollected: Number(totalCollected.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        todayCollections: Number(todayCollections.toFixed(2)),
      },
      alerts: {
        lowStockItems,
      },
    };
  }
}
