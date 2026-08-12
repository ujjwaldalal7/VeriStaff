import { Router } from "express";
import authRoutes from "./auth.routes.js";
import tenantRoutes from "./tenant.routes.js";
import employeeRoutes from "./employee.routes.js";
import onboardingRoutes from "./onboarding.routes.js";
import clearanceRoutes from "./clearance.routes.js";
import documentRoutes from "./document.routes.js";
import verificationRoutes from "./verification.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tenant", tenantRoutes);
router.use("/employees", employeeRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/clearances", clearanceRoutes);
router.use("/documents", documentRoutes);
router.use("/verify-doc", verificationRoutes);

export default router;
