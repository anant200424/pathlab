import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateRequest } from "../../common/middleware/validation.middleware.js";
import { loginSchema, changePasswordSchema } from "./auth.schemas.js";
import { authenticate } from "../../common/middleware/auth.middleware.js";
import { authRateLimiter } from "../../common/middleware/rate-limit.middleware.js";

const router = Router();

router.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  AuthController.login,
);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.get("/me", authenticate, AuthController.me);
router.post(
  "/change-password",
  authenticate,
  validateRequest({ body: changePasswordSchema }),
  AuthController.changePassword,
);

export const authRoutes = router;
