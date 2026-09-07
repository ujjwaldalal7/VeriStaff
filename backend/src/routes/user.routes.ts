import { Router } from "express";
import {
  assignManagerEmployee,
  createUser,
  listUsers,
  resetUserPassword,
  unassignManagerEmployee,
  updateUserRole,
  updateUserStatus
} from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();
router.use(authenticate, authorize("SUPER_ADMIN"));
router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/status", updateUserStatus);
router.post("/:id/reset-password", resetUserPassword);
router.post("/:id/assignments", assignManagerEmployee);
router.delete("/:id/assignments/:employeeId", unassignManagerEmployee);
export default router;
