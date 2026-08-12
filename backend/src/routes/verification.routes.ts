import { Router } from "express";
import { verifyDocument } from "../controllers/verification.controller.js";

const router = Router();

router.get("/:hash", verifyDocument);

export default router;
