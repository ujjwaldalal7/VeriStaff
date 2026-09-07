import type { Request, Response } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthRequest } from "../types/auth.js";
import { Prisma } from "../generated/prisma/client.js";

import crypto from "node:crypto";
import QRCode from "qrcode";

import { createSha256 } from "../utils/tokens.js";
import { env } from "../config/env.js";

import { generatePdfFromHtml } from "../services/pdf.service.js";
import {
  deletePdfFromCloudinary,
  uploadPdfToCloudinary
} from "../services/cloudinary.service.js";

import { payslipTemplate } from "../templates/payslip.template.js";

import { getRequiredParam } from "../utils/requestParams.js";
import { createAuditLog } from "../utils/auditLog.js";


const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const generateDocumentNumber = (): string => {
  const year = new Date().getFullYear();

  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `VS-${year}-${randomPart}`;
};

const formatMoney = (
  value: { toString(): string }
): string => {
  return Number(value.toString()).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
};



const moneySchema = z.union([
  z.number().finite().nonnegative(),
  z.string().trim().regex(/^\d+(\.\d{1,2})?$/)
]).transform((value) => new Prisma.Decimal(value));

const createPayslipSchema = z.object({
  employeeId: z.string().uuid(),

  month: z
    .number()
    .int()
    .min(1)
    .max(12),

  year: z
    .number()
    .int()
    .min(2000)
    .max(2100),
  basicSalary: moneySchema,
  hra: moneySchema,
  allowances: moneySchema,
  deductions: moneySchema
});

export const listPayslips = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const payslips = await prisma.payslip.findMany({
      where: {
        employee: {
          tenantId: auth.tenantId
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
            designation: true,
            status: true
          }
        },
        generatedDocument: {
          select: {
            id: true,
            docNumber: true,
            status: true,
            verificationHash: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        {
          year: "desc"
        },
        {
          month: "desc"
        }
      ]
    });

    res.json({
      success: true,
      count: payslips.length,
      data: payslips
    });
  }
);

export const getMyPayslips = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const employee = await prisma.employee.findFirst({
      where: {
        userId: auth.userId,
        tenantId: auth.tenantId
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        department: true,
        designation: true
      }
    });

    if (!employee) {
      throw new ApiError(
        404,
        "Employee profile not found"
      );
    }

    const payslips = await prisma.payslip.findMany({
      where: {
        employeeId: employee.id
      },
      include: {
        generatedDocument: {
          select: {
            id: true,
            docNumber: true,
            status: true,
            verificationHash: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        {
          year: "desc"
        },
        {
          month: "desc"
        }
      ]
    });

    res.json({
      success: true,
      data: {
        employee,
        payslips
      }
    });
  }
);

export const createPayslip = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const data = createPayslipSchema.parse(
      req.body
    );

    /*
     * ---------------------------------------------------------
     * 1. Find employee inside authenticated tenant
     * ---------------------------------------------------------
     */

    const employee =
      await prisma.employee.findFirst({
        where: {
          id: data.employeeId,
          tenantId: auth.tenantId
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
     * 2. Validate employee status
     * ---------------------------------------------------------
     */

        if (
            employee.status === "INVITED" ||
            employee.status === "ONBOARDING"
        ) {
            throw new ApiError(
                400,
                "Payslip cannot be generated for an employee who has not joined"
            );
        }

        if (employee.status === "OFFBOARDED") {
            throw new ApiError(
                400,
                "Payslip cannot be generated for an offboarded employee"
            );
        }

    /*
     * ---------------------------------------------------------
     * 3. Prevent duplicate payslip
     * ---------------------------------------------------------
     */

    const existingPayslip =
      await prisma.payslip.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: employee.id,
            month: data.month,
            year: data.year
          }
        }
      });

    if (existingPayslip) {
      throw new ApiError(
        409,
        `Payslip already exists for ${data.month}/${data.year}`
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Calculate salary
     * ---------------------------------------------------------
     */

    const { basicSalary, hra, allowances, deductions } = data;

    const grossSalary = basicSalary
      .add(hra)
      .add(allowances);

    const netSalary = grossSalary.sub(deductions);

    if (netSalary.isNegative()) {
      throw new ApiError(
        400,
        "Net salary cannot be negative"
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. Create historical payslip snapshot
     * ---------------------------------------------------------
     */

    const payslip =
      await prisma.payslip.create({
        data: {
          employeeId:
            employee.id,

          month:
            data.month,

          year:
            data.year,

          basicSalary:
            basicSalary,

          hra:
            hra,

          allowances:
            allowances,

          deductions:
            deductions,

          grossSalary:
            grossSalary,

          netSalary:
            netSalary
        }
      });

    /*
     * ---------------------------------------------------------
     * 6. Return payslip
     * ---------------------------------------------------------
     */

    res.status(201).json({
      success: true,

      message:
        "Payslip created successfully",

      data: {
        id:
          payslip.id,

        employeeId:
          payslip.employeeId,

        month:
          payslip.month,

        year:
          payslip.year,

        basicSalary:
          payslip.basicSalary,

        hra:
          payslip.hra,

        allowances:
          payslip.allowances,

        deductions:
          payslip.deductions,

        grossSalary:
          payslip.grossSalary,

        netSalary:
          payslip.netSalary,

        createdAt:
          payslip.createdAt
      }
    });
  }
);



export const generatePayslipDocument = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const payslipId =
      getRequiredParam(req, "payslipId");

    /*
     * Find payslip + employee + tenant
     */

    const payslip =
      await prisma.payslip.findFirst({
        where: {
          id: payslipId,

          employee: {
            tenantId: auth.tenantId
          }
        },

        include: {
          employee: {
            include: {
              tenant: true
            }
          },

          generatedDocument: true
        }
      });

    if (!payslip) {
      throw new ApiError(
        404,
        "Payslip not found"
      );
    }

    /*
     * Do not generate the same payslip PDF twice
     */

    if (payslip.generatedDocument) {
      throw new ApiError(
        409,
        "Document has already been generated for this payslip"
      );
    }

    const employee = payslip.employee;
    const tenant = employee.tenant;

    /*
     * Generate document identity
     */

    const docNumber =
      generateDocumentNumber();

    const timestamp =
      new Date().toISOString();

    const hashPayload = [
      employee.tenantId,
      employee.id,
      "PAYSLIP",
      payslip.id,
      docNumber,
      timestamp
    ].join(":");

    const verificationHash =
      createSha256(hashPayload);

    const verificationUrl =
      `${env.PUBLIC_APP_URL}/verify-doc/${verificationHash}`;

    /*
     * QR
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

    const employeeName =
      `${employee.firstName} ${employee.lastName}`;

    const monthYear =
      `${monthNames[payslip.month - 1]} ${payslip.year}`;

    /*
     * Generate branded HTML
     */

    const html = payslipTemplate({
      companyName:
        tenant.name,

      logoUrl:
        tenant.logoUrl,

      watermarkUrl:
        tenant.watermarkUrl,

      primaryColor:
        tenant.primaryColor,

      secondaryColor:
        tenant.secondaryColor,

      footerAddress:
        tenant.footerAddress,

      authorizedSignUrl:
        tenant.authorizedSignUrl,

      employeeName,

      employeeCode:
        employee.employeeCode,

      designation:
        employee.designation,

      department:
        employee.department,

      monthYear,

      basicSalary:
        formatMoney(payslip.basicSalary),

      hra:
        formatMoney(payslip.hra),

      allowances:
        formatMoney(payslip.allowances),

      deductions:
        formatMoney(payslip.deductions),

      grossSalary:
        formatMoney(payslip.grossSalary),

      netSalary:
        formatMoney(payslip.netSalary),

      documentNumber:
        docNumber,

      issueDate:
        formatDate(new Date()),

      verificationUrl,

      qrDataUrl
    });

    /*
     * Puppeteer → PDF
     */

    const pdfBuffer =
      await generatePdfFromHtml(html);

    /*
     * PDF → Cloudinary
     */

    const pdfUrl =
      await uploadPdfToCloudinary(
        pdfBuffer,
        docNumber
      );

    /*
     * Create GeneratedDocument and link it to Payslip
     *
     * Transaction ensures both DB operations succeed together.
     */

    let result;
    try {
      result = await prisma.$transaction(
        async (tx) => {
          const document =
            await tx.generatedDocument.create({
              data: {
                tenantId:
                  employee.tenantId,

                employeeId:
                  employee.id,

                docNumber,

                docType:
                  "PAYSLIP",

                verificationHash,

                pdfUrl,

                metadataJson: {
                  payslipId:
                    payslip.id,

                  employeeName,

                  employeeCode:
                    employee.employeeCode,

                  month:
                    payslip.month,

                  year:
                    payslip.year,

                  monthYear,

                  verificationUrl,

                  generatedAt:
                    timestamp
                }
              }
            });

          const updatedPayslip =
            await tx.payslip.update({
              where: {
                id: payslip.id
              },

              data: {
                generatedDocumentId:
                  document.id
              }
            });

          return {
            document,
            payslip:
              updatedPayslip
          };
        }
      );
    } catch (error) {
      await deletePdfFromCloudinary(pdfUrl);
      throw error;
    }

    await createAuditLog({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: "DOCUMENT_CREATE",
      entityType: "GeneratedDocument",
      entityId: result.document.id,
      metadata: {
        docNumber: result.document.docNumber,
        docType: result.document.docType,
        payslipId: result.payslip.id,
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        month: payslip.month,
        year: payslip.year
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
    });

    res.status(201).json({
      success: true,

      message:
        "Payslip PDF generated successfully",

      data: {
        payslipId:
          result.payslip.id,

        documentId:
          result.document.id,

        docNumber:
          result.document.docNumber,

        month:
          payslip.month,

        year:
          payslip.year,

        verificationHash:
          result.document.verificationHash,

        verificationUrl,

        createdAt:
          result.document.createdAt
      }
    });
  }
);
