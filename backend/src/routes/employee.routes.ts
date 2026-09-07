import { Router } from "express";
import {
  createEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
  getMyProfile,
  updateMyProfile
} from "../controllers/employee.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

router.get("/me",authorize("EMPLOYEE"),getMyProfile);
router.patch("/me",authorize("EMPLOYEE"),updateMyProfile);
router.get("/", authorize("SUPER_ADMIN", "HR_ADMIN"), listEmployees);
router.post("/", authorize("SUPER_ADMIN", "HR_ADMIN"), createEmployee);
router.get("/:id", authorize("SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"), getEmployee);
router.patch("/:id", authorize("SUPER_ADMIN", "HR_ADMIN"), updateEmployee);

export default router;
