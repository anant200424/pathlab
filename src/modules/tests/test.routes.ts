import { Router } from "express";
import { TestController } from "./test.controller.js";
import {
  authenticate,
  requirePermissions,
} from "../../common/middleware/auth.middleware.js";
import { validateRequest } from "../../common/middleware/validation.middleware.js";
import {
  createTestDefinitionSchema,
  updateTestDefinitionSchema,
  createTestPackageSchema,
} from "./test.schemas.js";
import { PERMISSIONS } from "../roles/role.constants.js";

const router = Router();

router.use(authenticate);

// Packages routes
router.post(
  "/packages",
  requirePermissions(PERMISSIONS.TESTS_MANAGE),
  validateRequest({ body: createTestPackageSchema }),
  TestController.createPackage,
);
router.get("/packages", TestController.listPackages);
router.get("/packages/:id", TestController.getPackageById);

// Tests routes
router.post(
  "/",
  requirePermissions(PERMISSIONS.TESTS_MANAGE),
  validateRequest({ body: createTestDefinitionSchema }),
  TestController.createTest,
);
router.get("/", TestController.listTests);
router.get("/:id", TestController.getTestById);
router.patch(
  "/:id",
  requirePermissions(PERMISSIONS.TESTS_MANAGE),
  validateRequest({ body: updateTestDefinitionSchema }),
  TestController.updateTest,
);

export const testRoutes = router;
