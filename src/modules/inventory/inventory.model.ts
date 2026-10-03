import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInventoryItem extends Document {
  itemCode: string;
  name: string;
  category: string;
  unit: string; // e.g. 'vials', 'boxes', 'tubes', 'ml'
  currentStock: number;
  minimumThreshold: number;
  clinicId: Types.ObjectId;
  supplierName?: string;
  lotNumber?: string;
  expiryDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryMovement extends Document {
  itemId: Types.ObjectId;
  clinicId: Types.ObjectId;
  movementType: "receipt" | "consumption" | "adjustment" | "disposal";
  quantity: number;
  remainingStock: number;
  lotNumber?: string;
  reason?: string;
  performedBy: Types.ObjectId;
  createdAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    itemCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
    },
    minimumThreshold: {
      type: Number,
      required: true,
      default: 10,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    supplierName: { type: String },
    lotNumber: { type: String },
    expiryDate: { type: Date },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
      index: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    movementType: {
      type: String,
      enum: ["receipt", "consumption", "adjustment", "disposal"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    remainingStock: {
      type: Number,
      required: true,
    },
    lotNumber: { type: String },
    reason: { type: String },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

inventoryItemSchema.index({ clinicId: 1, currentStock: 1 });

export const InventoryItem = mongoose.model<IInventoryItem>(
  "InventoryItem",
  inventoryItemSchema,
);
export const InventoryMovement = mongoose.model<IInventoryMovement>(
  "InventoryMovement",
  inventoryMovementSchema,
);
