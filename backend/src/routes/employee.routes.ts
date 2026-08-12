import { Router } from "express";
import {
  createEmployee,
  getEmployee,
  listEmployees,
  resignEmployee,
  updateEmployee
} from "../controllers/employee.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("SUPER_ADMIN", "HR_ADMIN"), listEmployees);
router.post("/", authorize("SUPER_ADMIN", "HR_ADMIN"), createEmployee);
router.get("/:id", authorize("SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"), getEmployee);
router.patch("/:id", authorize("SUPER_ADMIN", "HR_ADMIN"), updateEmployee);
router.post("/:id/resign", authorize("SUPER_ADMIN", "HR_ADMIN"), resignEmployee);

export default router;
