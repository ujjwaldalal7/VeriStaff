import { Router } from "express";

import {
  getTenant,
  updateBranding,
  uploadTenantBrandingAsset
} from "../controllers/tenant.controller.js";

import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { uploadImage } from "../middlewares/upload.js";

const router = Router();

router.get(
  "/me",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  getTenant
);

router.patch(
  "/me",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  updateBranding
);

router.post(
  "/me/branding/:assetType",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  uploadImage.single("file"),
  uploadTenantBrandingAsset
);

export default router;