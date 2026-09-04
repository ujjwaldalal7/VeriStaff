import { Router } from "express";

import {
  createDocumentRecord,
  getDocuments,
  getDocumentById,
  getEmployeeDocuments,
  getMyDocuments,
  deleteDocument,
  revokeDocument,
  getDocumentDownload
} from "../controllers/document.controller.js";

import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();


/*
 * Get all documents for the tenant
 */
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  getDocuments
);


/*
 * Get all documents for one employee
 */
router.get(
  "/employee/:employeeId",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  getEmployeeDocuments
);


/*
 * Get documents belonging to the logged-in employee
 */
router.get(
  "/me",
  authenticate,
  authorize("EMPLOYEE"),
  getMyDocuments
);

router.get(
  "/:id/download",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"),
  getDocumentDownload
);

/*
 * Get one document
 */
router.get(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  getDocumentById
);


/*
 * Create document
 */
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  createDocumentRecord
);


/*
 * Delete document
 */
router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  deleteDocument
);

router.patch(
  "/:id/revoke",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  revokeDocument
);

export default router;