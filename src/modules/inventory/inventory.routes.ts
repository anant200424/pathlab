import { Router } from "express";
import { InventoryController } from "./inventory.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { validateRequest } from "../../common/middleware/validation.middleware.js";
import {
  createInventoryItemSchema,
  recordMovementSchema,
} from "./inventory.schemas.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requirePermissions(PERMISSIONS.INVENTORY_MANAGE),
  validateRequest({ body: createInventoryItemSchema }),
  InventoryController.createItem,
);

router.get(
  "/",
  requirePermissions(PERMISSIONS.INVENTORY_READ),
  InventoryController.listItems,
);

router.post(
  "/:id/movement",
  requirePermissions(PERMISSIONS.INVENTORY_MANAGE),
  validateRequest({ body: recordMovementSchema }),
  InventoryController.recordMovement,
);

router.get(
  "/:id/movements",
  requirePermissions(PERMISSIONS.INVENTORY_READ),
  InventoryController.getMovements,
);

export const inventoryRoutes = router;
