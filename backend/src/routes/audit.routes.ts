import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { getAuditLogs } from "../controllers/audit.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  getAuditLogs
);

export default router;