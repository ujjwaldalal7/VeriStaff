import { Router } from "express";
import {
  login,
  me,
  registerTenant
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.post("/register-tenant", registerTenant);
router.post("/login", login);
router.get("/me", authenticate, me);

export default router;
