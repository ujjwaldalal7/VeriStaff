import { Router } from "express";

import {
  createPayslip, generatePayslipDocument
} from "../controllers/payslip.controller.js";

import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

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