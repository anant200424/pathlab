import { Router } from "express";
import { UserController } from "./user.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { validateRequest } from "../../common/middleware/validation.middleware.js";
import { createUserSchema, updateUserSchema } from "./user.schemas.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requirePermissions(PERMISSIONS.USERS_MANAGE),
  validateRequest({ body: createUserSchema }),
  UserController.createUser,
);

router.get(
  "/",
  requirePermissions(PERMISSIONS.USERS_MANAGE),
  UserController.listUsers,
);
router.get(
  "/:id",
  requirePermissions(PERMISSIONS.USERS_MANAGE),
  UserController.getUserById,
);
router.patch(
  "/:id",
  requirePermissions(PERMISSIONS.USERS_MANAGE),
  validateRequest({ body: updateUserSchema }),
  UserController.updateUser,
);

export const userRoutes = router;
