import { Router } from "express";
import {
  getTenant,
  updateBranding
} from "../controllers/tenant.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

router.get("/", getTenant);
router.patch(
  "/branding",
  authorize("SUPER_ADMIN"),
  updateBranding
);

export default router;
