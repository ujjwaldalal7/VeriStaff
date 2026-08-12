import { Router } from "express";
import {
  completeOnboarding,
  createInvite,
  validateInvite
} from "../controllers/onboarding.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.post("/validate/:token", validateInvite);
router.post("/complete/:token", completeOnboarding);

router.post(
  "/invite",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  createInvite
);

export default router;
