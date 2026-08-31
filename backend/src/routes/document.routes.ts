import { Router } from "express";

import {
  createDocumentRecord,
  getDocuments,
  getDocumentById,
  getEmployeeDocuments,
  deleteDocument
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
 *
 * IMPORTANT:
 * This must come before "/:id"
 */
router.get(
  "/employee/:employeeId",
  authenticate,
  authorize("SUPER_ADMIN", "HR_ADMIN"),
  getEmployeeDocuments
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
 * Create Experience/Relieving Letter
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


export default router;