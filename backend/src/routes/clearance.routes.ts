import { Router } from "express";
import {
  submitResignation,
  getEmployeeClearances,
  updateClearance,
  getClearanceStatus
} from "../controllers/clearance.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.post(
  "/employees/:employeeId/resignation",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  submitResignation
);

router.get(
  "/employees/:employeeId",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "HR_ADMIN",
    "EMPLOYEE"
  ),
  getEmployeeClearances
);

router.patch(
  "/employees/:employeeId/:department",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  updateClearance
);

router.get(
  "/employees/:employeeId/status",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "HR_ADMIN",
    "EMPLOYEE"
  ),
  getClearanceStatus
);

export default router;
