import { Router } from "express";
import { OrderController } from "./order.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { validateRequest } from "../../common/middleware/validation.middleware.js";
import { createOrderSchema, updateOrderStatusSchema } from "./order.schemas.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requirePermissions(PERMISSIONS.ORDERS_CREATE),
  validateRequest({ body: createOrderSchema }),
  OrderController.createOrder,
);

router.get(
  "/",
  requirePermissions(PERMISSIONS.ORDERS_READ),
  OrderController.listOrders,
);
router.get(
  "/:id",
  requirePermissions(PERMISSIONS.ORDERS_READ),
  OrderController.getOrderById,
);

router.patch(
  "/:id/status",
  requirePermissions(PERMISSIONS.ORDERS_UPDATE),
  validateRequest({ body: updateOrderStatusSchema }),
  OrderController.updateOrderStatus,
);

export const orderRoutes = router;
