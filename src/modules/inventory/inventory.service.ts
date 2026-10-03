import { Types } from "mongoose";
import {
  InventoryItem,
  InventoryMovement,
  IInventoryItem,
} from "./inventory.model.js";
import { Clinic } from "../clinics/clinic.model.js";
import { AppError } from "../../common/errors/app-error.js";
import { AuditService } from "../audit/audit.service.js";

export class InventoryService {
  static async createItem(
    data: {
      itemCode: string;
      name: string;
      category: string;
      unit: string;
      minimumThreshold?: number;
      clinicId: string;
      supplierName?: string;
      lotNumber?: string;
      expiryDate?: string;
    },
    actorId?: string,
  ): Promise<IInventoryItem> {
    if (!Types.ObjectId.isValid(data.clinicId)) {
      throw AppError.badRequest("Invalid clinic ID.");
    }

    const clinic = await Clinic.findById(data.clinicId);
    if (!clinic || !clinic.isActive) {
      throw AppError.badRequest("Clinic not found or inactive.");
    }

    const existing = await InventoryItem.findOne({
      itemCode: data.itemCode.toUpperCase(),
    });
    if (existing) {
      throw AppError.conflict(
        `Inventory item with code '${data.itemCode}' already exists.`,
      );
    }

    const item = await InventoryItem.create({
      itemCode: data.itemCode.toUpperCase(),
      name: data.name,
      category: data.category,
      unit: data.unit,
      minimumThreshold: data.minimumThreshold ?? 10,
      currentStock: 0,
      clinicId: clinic._id,
      supplierName: data.supplierName,
      lotNumber: data.lotNumber,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      isActive: true,
    });

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "inventory:create_item",
      entityType: "InventoryItem",
      entityId: item._id.toString(),
      clinicId: clinic._id,
      details: { itemCode: item.itemCode, name: item.name },
    });

    return item;
  }

  static async listItems(query: {
    clinicId?: string;
    category?: string;
    lowStockOnly?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };
    if (query.clinicId) filter.clinicId = new Types.ObjectId(query.clinicId);
    if (query.category) filter.category = query.category;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { itemCode: { $regex: query.search, $options: "i" } },
      ];
    }
    if (query.lowStockOnly) {
      filter.$expr = { $lte: ["$currentStock", "$minimumThreshold"] };
    }

    const [items, total] = await Promise.all([
      InventoryItem.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      InventoryItem.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async recordMovement(
    itemId: string,
    data: {
      movementType: "receipt" | "consumption" | "adjustment" | "disposal";
      quantity: number;
      lotNumber?: string;
      reason?: string;
    },
    actorId: string,
  ) {
    if (!Types.ObjectId.isValid(itemId)) {
      throw AppError.badRequest("Invalid inventory item ID.");
    }

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      throw AppError.notFound("Inventory item not found.");
    }

    if (data.quantity <= 0) {
      throw AppError.badRequest("Movement quantity must be greater than zero.");
    }

    let newStock = item.currentStock;
    if (data.movementType === "receipt") {
      newStock += data.quantity;
    } else if (
      data.movementType === "consumption" ||
      data.movementType === "disposal"
    ) {
      if (item.currentStock < data.quantity) {
        throw AppError.badRequest(
          `Insufficient stock. Current: ${item.currentStock}, requested: ${data.quantity}`,
        );
      }
      newStock -= data.quantity;
    } else if (data.movementType === "adjustment") {
      newStock = data.quantity; // direct override
    }

    item.currentStock = newStock;
    if (data.lotNumber) item.lotNumber = data.lotNumber;
    await item.save();

    const movement = await InventoryMovement.create({
      itemId: item._id,
      clinicId: item.clinicId,
      movementType: data.movementType,
      quantity: data.quantity,
      remainingStock: newStock,
      lotNumber: data.lotNumber || item.lotNumber,
      reason: data.reason,
      performedBy: new Types.ObjectId(actorId),
    });

    await AuditService.log({
      actorId: new Types.ObjectId(actorId),
      action: `inventory:${data.movementType}`,
      entityType: "InventoryItem",
      entityId: item._id.toString(),
      clinicId: item.clinicId,
      details: {
        quantity: data.quantity,
        remainingStock: newStock,
        movementType: data.movementType,
      },
    });

    return { item, movement };
  }

  static async getMovements(itemId: string) {
    if (!Types.ObjectId.isValid(itemId)) {
      throw AppError.badRequest("Invalid inventory item ID.");
    }
    return InventoryMovement.find({ itemId: new Types.ObjectId(itemId) })
      .populate("performedBy", "firstName lastName")
      .sort({ createdAt: -1 });
  }
}
