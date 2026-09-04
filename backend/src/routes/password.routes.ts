import { Router } from "express";

import {
  changePassword,
  resetEmployeePassword
} from "../controllers/password.controller.js";

import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

/*
 * Logged-in user changes their own password.
 */
router.patch(
  "/change",
  authenticate,
  changePassword
);

/*
 * HR/Admin resets an employee's password.
 */
router.patch(
  "/employees/:employeeId/reset",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "HR_ADMIN"
  ),
  resetEmployeePassword
);

export default router;