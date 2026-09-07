import { Router } from "express";

import {
  createPayslip,
  generatePayslipDocument,
  getMyPayslips,
  listPayslips
} from "../controllers/payslip.controller.js";

import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "HR_ADMIN",
    "MANAGER"
  ),
  listPayslips
);

router.get(
  "/me",
  authenticate,
  authorize("EMPLOYEE"),
  getMyPayslips
);

router.post(
  "/",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "HR_ADMIN"
  ),
  createPayslip
);

router.post(
  "/:payslipId/generate",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "HR_ADMIN"
  ),
  generatePayslipDocument
);

export default router;
