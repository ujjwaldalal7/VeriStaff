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
import { relievingLetterTemplate } from "../templates/relievingLetter.template.js";
import { offerLetterTemplate } from "../templates/offerLetter.template.js";

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

const supportedDocumentTypes = [
  "OFFER_LETTER",
  "RELIEVING_LETTER",
  "EXPERIENCE_LETTER"
] as const;

type SupportedDocumentType =
  (typeof supportedDocumentTypes)[number];

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

    /*
     * ---------------------------------------------------------
     * 1. Validate request body
     * ---------------------------------------------------------
     */

    const data = documentSchema.parse(req.body);

    /*
     * ---------------------------------------------------------
     * 2. Find employee inside authenticated tenant
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
      throw new ApiError(
        404,
        "Employee not found"
      );
    }

    /*
     * ---------------------------------------------------------
     * 3. Validate supported document type
     * ---------------------------------------------------------
     */

    if (
      !supportedDocumentTypes.includes(
        data.docType as SupportedDocumentType
      )
    ) {
      throw new ApiError(
        400,
        `${data.docType} document generation will be implemented next`
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Offer Letter eligibility
     * ---------------------------------------------------------
     */

    if (data.docType === "OFFER_LETTER") {
      if (
        employee.status !== "INVITED" &&
        employee.status !== "ONBOARDING"
      ) {
        throw new ApiError(
          400,
          "Offer letter can only be generated for an invited or onboarding employee"
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 5. Exit document clearance validation
     * ---------------------------------------------------------
     */

    if (
      clearanceRequiredDocTypes.has(
        data.docType
      )
    ) {
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

      const allApproved =
        requiredDepartments.every(
          (department) =>
            clearances.some(
              (clearance) =>
                clearance.department ===
                  department &&
                clearance.status ===
                  "APPROVED"
            )
        );

      if (!allApproved) {
        throw new ApiError(
          403,
          "All IT, Finance and HR clearances must be approved before generating this document"
        );
      }

      if (
        employee.status !== "OFFBOARDED"
      ) {
        throw new ApiError(
          403,
          "Employee must be offboarded before generating exit documents"
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 6. Generate document number
     * ---------------------------------------------------------
     */

    const docNumber =
      generateDocumentNumber();

    /*
     * ---------------------------------------------------------
     * 7. Generate verification hash
     * ---------------------------------------------------------
     */

    const timestamp =
      new Date().toISOString();

    const hashPayload = [
      employee.tenantId,
      employee.id,
      data.docType,
      docNumber,
      timestamp
    ].join(":");

    const verificationHash =
      createSha256(hashPayload);

    /*
     * ---------------------------------------------------------
     * 8. Generate verification URL
     * ---------------------------------------------------------
     */

    const verificationUrl =
      `${env.PUBLIC_API_URL}/verify-doc/${verificationHash}`;

    /*
     * ---------------------------------------------------------
     * 9. Generate QR code
     * ---------------------------------------------------------
     */

    const qrDataUrl =
      await QRCode.toDataURL(
        verificationUrl,
        {
          errorCorrectionLevel: "H",
          margin: 1,
          width: 300
        }
      );

    /*
     * ---------------------------------------------------------
     * 10. Common branded data
     * ---------------------------------------------------------
     */

    const employeeName =
      `${employee.firstName} ${employee.lastName}`;

    const totalSalary =
      employee.basicSalary +
      employee.hra +
      employee.allowances -
      employee.deductions;

    const commonTemplateData = {
      companyName:
        employee.tenant.name,

      logoUrl:
        employee.tenant.logoUrl,

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
        formatDate(
          employee.joiningDate
        ),

      lastWorkingDay:
        employee.lastWorkingDay
          ? formatDate(
              employee.lastWorkingDay
            )
          : "N/A",

      documentNumber:
        docNumber,

      issueDate:
        formatDate(new Date()),

      verificationUrl,

      qrDataUrl
    };

    /*
     * ---------------------------------------------------------
     * 11. Generate document HTML
     * ---------------------------------------------------------
     */

    let html: string;

    if (data.docType === "EXPERIENCE_LETTER") {
      html = experienceLetterTemplate(
        commonTemplateData
      );
    } else if (
      data.docType === "RELIEVING_LETTER"
    ) {
      html = relievingLetterTemplate({
        ...commonTemplateData,

        resignationDate:
          employee.resignationDate
            ? formatDate(
                employee.resignationDate
              )
            : "N/A"
      });
    } else {
      html = offerLetterTemplate({
        ...commonTemplateData,

        basicSalary:
          employee.basicSalary.toLocaleString(
            "en-IN"
          ),

        hra:
          employee.hra.toLocaleString(
            "en-IN"
          ),

        allowances:
          employee.allowances.toLocaleString(
            "en-IN"
          ),

        deductions:
          employee.deductions.toLocaleString(
            "en-IN"
          ),

        totalSalary:
          totalSalary.toLocaleString(
            "en-IN"
          )
      });
    }

    /*
     * ---------------------------------------------------------
     * 12. Generate PDF using Puppeteer
     * ---------------------------------------------------------
     */

    const pdfBuffer =
      await generatePdfFromHtml(
        html
      );

    /*
     * ---------------------------------------------------------
     * 13. Upload PDF to Cloudinary
     * ---------------------------------------------------------
     */

    const pdfUrl =
      await uploadPdfToCloudinary(
        pdfBuffer,
        docNumber
      );

    /*
     * ---------------------------------------------------------
     * 14. Save document metadata
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
     * 15. Response
     * ---------------------------------------------------------
     */

    const documentName =
      data.docType
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(
          /\b\w/g,
          (char) => char.toUpperCase()
        );

    res.status(201).json({
      success: true,

      message:
        `${documentName} generated successfully`,

      data: {
        id:
          document.id,

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