import { Router } from "express";
import {
  listClearances,
  updateClearance
} from "../controllers/clearance.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

router.get(
  "/:employeeId",
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  listClearances
);

router.patch(
  "/:employeeId/:department",
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  updateClearance
);

export default router;
