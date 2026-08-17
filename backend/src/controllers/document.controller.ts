import type { Request, Response } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import QRCode from "qrcode";

import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSha256 } from "../utils/tokens.js";
import { env } from "../config/env.js";
import type { AuthRequest } from "../types/auth.js";

import { generatePdfFromHtml } from "../services/pdf.service.js";
import { uploadPdfToCloudinary } from "../services/cloudinary.service.js";

import { experienceLetterTemplate } from "../templates/experienceLetter.template.js";

const documentSchema = z.object({
  employeeId: z.string().uuid(),

  docType: z.enum([
    "OFFER_LETTER",
    "PAYSLIP",
    "RELIEVING_LETTER",
    "EXPERIENCE_LETTER"
  ]),

  metadata: z
    .record(z.string(), z.unknown())
    .default({})
});

const clearanceRequiredDocTypes = new Set([
  "RELIEVING_LETTER",
  "EXPERIENCE_LETTER"
]);

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
};

const generateDocumentNumber = (): string => {
  const year = new Date().getFullYear();

  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `VS-${year}-${randomPart}`;
};

export const createDocumentRecord = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const data = documentSchema.parse(req.body);

    /*
     * ---------------------------------------------------------
     * 1. Find employee inside authenticated tenant
     * ---------------------------------------------------------
     */

    const employee = await prisma.employee.findFirst({
      where: {
        id: data.employeeId,
        tenantId: auth.tenantId
      },
      include: {
        tenant: true
      }
    });

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    /*
     * ---------------------------------------------------------
     * 2. Check clearance before exit documents
     * ---------------------------------------------------------
     */

    if (clearanceRequiredDocTypes.has(data.docType)) {
      const clearances =
        await prisma.departmentClearance.findMany({
          where: {
            employeeId: employee.id
          }
        });

      const requiredDepartments = [
        "IT",
        "FINANCE",
        "HR"
      ];

      const allApproved = requiredDepartments.every(
        (department) =>
          clearances.some(
            (clearance) =>
              clearance.department === department &&
              clearance.status === "APPROVED"
          )
      );

      if (!allApproved) {
        throw new ApiError(
          403,
          "All IT, Finance and HR clearances must be approved before generating this document"
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 3. Currently support Experience Letter generation
     * ---------------------------------------------------------
     */

    if (data.docType !== "EXPERIENCE_LETTER") {
      throw new ApiError(
        400,
        `${data.docType} document generation will be implemented next`
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Generate unique document number
     * ---------------------------------------------------------
     */

    const docNumber = generateDocumentNumber();

    /*
     * ---------------------------------------------------------
     * 5. Generate SHA-256 verification hash
     * ---------------------------------------------------------
     */

    const timestamp = new Date().toISOString();

    const hashPayload = [
      employee.tenantId,
      employee.id,
      data.docType,
      docNumber,
      timestamp
    ].join(":");

    const verificationHash = createSha256(hashPayload);

    /*
     * ---------------------------------------------------------
     * 6. Generate public verification URL
     * ---------------------------------------------------------
     */

    const verificationUrl =
      `${env.PUBLIC_API_URL}/verify-doc/${verificationHash}`;

    /*
     * ---------------------------------------------------------
     * 7. Generate QR code
     * ---------------------------------------------------------
     */

    const qrDataUrl =
      await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300
      });

    /*
     * ---------------------------------------------------------
     * 8. Prepare branded Experience Letter
     * ---------------------------------------------------------
     */

    const employeeName =
      `${employee.firstName} ${employee.lastName}`;

    const html = experienceLetterTemplate({
      companyName: employee.tenant.name,

      logoUrl: employee.tenant.logoUrl,

      watermarkUrl:
        employee.tenant.watermarkUrl,

      primaryColor:
        employee.tenant.primaryColor,

      secondaryColor:
        employee.tenant.secondaryColor,

      footerAddress:
        employee.tenant.footerAddress,

      authorizedSignUrl:
        employee.tenant.authorizedSignUrl,

      employeeName,

      employeeCode:
        employee.employeeCode,

      designation:
        employee.designation,

      department:
        employee.department,

      joiningDate:
        formatDate(employee.joiningDate),

      lastWorkingDay:
        employee.lastWorkingDay
          ? formatDate(employee.lastWorkingDay)
          : "N/A",

      documentNumber: docNumber,

      issueDate:
        formatDate(new Date()),

      verificationUrl,

      qrDataUrl
    });

    /*
     * ---------------------------------------------------------
     * 9. Generate PDF using Puppeteer
     * ---------------------------------------------------------
     */

    const pdfBuffer =
      await generatePdfFromHtml(html);

    /*
     * ---------------------------------------------------------
     * 10. Upload PDF to Cloudinary
     * ---------------------------------------------------------
     */

    const pdfUrl =
      await uploadPdfToCloudinary(
        pdfBuffer,
        docNumber
      );

    /*
     * ---------------------------------------------------------
     * 11. Save document metadata in PostgreSQL
     * ---------------------------------------------------------
     */

    const document =
      await prisma.generatedDocument.create({
        data: {
          tenantId:
            employee.tenantId,

          employeeId:
            employee.id,

          docNumber,

          docType:
            data.docType,

          verificationHash,

          pdfUrl,

          metadataJson: {
            ...data.metadata,

            employeeName,

            employeeCode:
              employee.employeeCode,

            companyName:
              employee.tenant.name,

            verificationUrl,

            generatedAt:
              timestamp
          }
        }
      });

    /*
     * ---------------------------------------------------------
     * 12. Return response
     * ---------------------------------------------------------
     */

    res.status(201).json({
      success: true,

      message:
        "Experience letter generated successfully",

      data: {
        id: document.id,

        docNumber:
          document.docNumber,

        docType:
          document.docType,

        verificationHash:
          document.verificationHash,

        verificationUrl,

        pdfUrl:
          document.pdfUrl,

        createdAt:
          document.createdAt
      }
    });
  }
);