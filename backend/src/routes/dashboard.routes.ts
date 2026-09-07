import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { getDashboardStats } from "../controllers/dashboard.controller.js";

const router = Router();

router.get(
  "/stats",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN", "MANAGER"),
  getDashboardStats
);

export default router;