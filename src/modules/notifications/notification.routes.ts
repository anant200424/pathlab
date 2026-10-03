import { Router } from "express";
import { NotificationController } from "./notification.controller.js";
import { authenticate } from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", NotificationController.listNotifications);
router.patch("/:id/read", NotificationController.markAsRead);

export const notificationRoutes = router;
