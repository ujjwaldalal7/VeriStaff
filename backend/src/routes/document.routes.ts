import { Router } from "express";
import { createDocumentRecord } from "../controllers/document.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  createDocumentRecord
);

export default router;
