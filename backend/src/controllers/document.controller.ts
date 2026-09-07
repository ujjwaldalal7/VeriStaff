import type { Request, Response } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import QRCode from "qrcode";
import { Readable } from "node:stream";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSha256 } from "../utils/tokens.js";
import { env } from "../config/env.js";
import type { AuthRequest } from "../types/auth.js";
import { Prisma } from "../generated/prisma/client.js";
import { getRequiredParam } from "../utils/requestParams.js";
import {ensureEmployeeAccess} from "../utils/employeeAccess.js";
import { generatePdfFromHtml } from "../services/pdf.service.js";
import {
  deletePdfFromCloudinary,
  uploadPdfToCloudinary
} from "../services/cloudinary.service.js";
import { createAuditLog } from "../utils/auditLog.js";
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

const documentListQuerySchema = z.object({
  docType: z.enum([
    "OFFER_LETTER",
    "PAYSLIP",
    "RELIEVING_LETTER",
    "EXPERIENCE_LETTER"
  ]).optional(),

  employeeId: z.string().uuid().optional()
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
      `${env.PUBLIC_APP_URL}/verify-doc/${verificationHash}`;

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

    const totalSalary = new Prisma.Decimal(employee.basicSalary)
      .add(employee.hra)
      .add(employee.allowances)
      .sub(employee.deductions);

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
          Number(employee.basicSalary).toLocaleString(
            "en-IN"
          ),

        hra:
          Number(employee.hra).toLocaleString(
            "en-IN"
          ),

        allowances:
          Number(employee.allowances).toLocaleString(
            "en-IN"
          ),

        deductions:
          Number(employee.deductions).toLocaleString(
            "en-IN"
          ),

        totalSalary:
          totalSalary.toFixed(2)
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

    let document;
    try {
      document = await prisma.generatedDocument.create({
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
    } catch (error) {
      await deletePdfFromCloudinary(pdfUrl);
      throw error;
    }

    await createAuditLog({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: "DOCUMENT_CREATE",
      entityType: "GeneratedDocument",
      entityId: document.id,
      metadata: {
        docNumber: document.docNumber,
        docType: document.docType,
        employeeId: employee.id,
        employeeCode: employee.employeeCode
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
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

        createdAt:
          document.createdAt
      }
    });
  }
);



export const getDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const query = documentListQuerySchema.parse(req.query);

    const documents = await prisma.generatedDocument.findMany({
      where: {
        tenantId: auth.tenantId,

        ...(query.docType
          ? {
              docType: query.docType
            }
          : {}),

        ...(query.employeeId
          ? {
              employeeId: query.employeeId
            }
          : {})
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
        }
      },

      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      success: true,
      count: documents.length,
      data: documents.map(({ pdfUrl: _pdfUrl, ...document }) => document)
    });
  }
);

export const getDocumentById = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const documentId = getRequiredParam(req, "id");

    const document =
      await prisma.generatedDocument.findFirst({
        where: {
          id: documentId,
          tenantId: auth.tenantId
        },

        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              department: true,
              designation: true
            }
          },

          tenant: {
            select: {
              id: true,
              name: true,
              logoUrl: true
            }
          }
        }
      });

    if (!document) {
      throw new ApiError(
        404,
        "Document not found"
      );
    }

    res.json({
      success: true,
      data: (({ pdfUrl: _pdfUrl, ...document }) => document)(document)
    });
  }
);

export const getEmployeeDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const employeeId =getRequiredParam(req, "employeeId");

    const employee =
      await prisma.employee.findFirst({
        where: {
          id: employeeId,
          tenantId: auth.tenantId
        },

        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          department: true,
          designation: true,
          status: true
        }
      });

    if (!employee) {
      throw new ApiError(
        404,
        "Employee not found"
      );
    }

    const documents =
      await prisma.generatedDocument.findMany({
        where: {
          employeeId: employee.id,
          tenantId: auth.tenantId
        },

        orderBy: {
          createdAt: "desc"
        }
      });

    res.json({
      success: true,

      data: {
        employee,
        documents: documents.map(({ pdfUrl: _pdfUrl, ...document }) => document)
      }
    });
  }
);

export const deleteDocument = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const documentId =getRequiredParam(req, "id");

    const document =
      await prisma.generatedDocument.findFirst({
        where: {
          id: documentId,
          tenantId: auth.tenantId
        }
      });

    if (!document) {
      throw new ApiError(
        404,
        "Document not found"
      );
    }

    await prisma.generatedDocument.delete({
      where: {
        id: document.id
      }
    });

    if (document.pdfUrl) {
      await deletePdfFromCloudinary(document.pdfUrl);
    }

    await createAuditLog({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: "DOCUMENT_DELETE",
      entityType: "GeneratedDocument",
      entityId: document.id,
      metadata: {
        docNumber: document.docNumber,
        docType: document.docType
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
    });

    res.json({
      success: true,
      message:
        "Document deleted successfully"
    });
  }
);



export const getMyDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const user = await prisma.user.findUnique({
      where: {
        id: auth.userId
      },
      select: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
            designation: true
          }
        }
      }
    });

    if (!user?.employee) {
      throw new ApiError(
        404,
        "Employee profile not found"
      );
    }

    const documents =
      await prisma.generatedDocument.findMany({
        where: {
          employeeId: user.employee.id,
          tenantId: auth.tenantId
        },
        select: {
          id: true,
          docNumber: true,
          docType: true,
          verificationHash: true,
          status: true,
          revokedAt: true,
          createdAt: true
        },
        orderBy: {
          createdAt: "desc"
        }
      });

    res.json({
      success: true,
      data: {
        employee: user.employee,
        documents
      }
    });
  }
);


export const revokeDocument = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user;

    if (!auth) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const documentId = getRequiredParam(
      req,
      "id"
    );

    const document =
      await prisma.generatedDocument.findFirst({
        where: {
          id: documentId,
          tenantId: auth.tenantId
        }
      });

    if (!document) {
      throw new ApiError(
        404,
        "Document not found"
      );
    }

    if (document.status === "REVOKED") {
      throw new ApiError(
        400,
        "Document is already revoked"
      );
    }

    const revokedDocument =
      await prisma.generatedDocument.update({
        where: {
          id: document.id
        },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          revokedById: auth.userId
        },
        select: {
          id: true,
          docNumber: true,
          docType: true,
          status: true,
          revokedAt: true,
          revokedById: true
        }
      });

    await createAuditLog({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: "DOCUMENT_REVOKE",
      entityType: "GeneratedDocument",
      entityId: document.id,
      metadata: {
        docNumber: document.docNumber,
        docType: document.docType
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
    });

    res.json({
      success: true,
      message: "Document revoked successfully",
      data: revokedDocument
    });
  }
);


const streamDocument = async (
  req: Request,
  res: Response,
  disposition: "attachment" | "inline"
) => {
    const auth = (req as AuthRequest).user;

    if (!auth) {
      throw new ApiError(401, "Authentication required");
    }

    const documentId = getRequiredParam(req, "id");

    const document = await prisma.generatedDocument.findFirst({
      where: {
        id: documentId,
        tenantId: auth.tenantId
      },
      select: {
        id: true,
        docNumber: true,
        docType: true,
        status: true,
        pdfUrl: true,
        employee: {
          select: {
            id: true,
            tenantId: true,
            userId: true
          }
        }
      }
    });

    if (!document) {
      throw new ApiError(404, "Document not found");
    }

    ensureEmployeeAccess(document.employee, auth);

    
    
    if (document.status === "REVOKED") {
      throw new ApiError(
        403,
        "This document has been revoked and is no longer available"
      );
    }

    if (!document.pdfUrl) {
      throw new ApiError(
        404,
        "PDF file is not available for this document"
      );
    }


    await createAuditLog({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: "DOCUMENT_DOWNLOAD",
      entityType: "GeneratedDocument",
      entityId: document.id,
      metadata: {
        docNumber: document.docNumber,
        docType: document.docType,
        documentStatus: document.status
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
    });
    let pdfResponse: globalThis.Response;

    try {
      pdfResponse = await fetch(document.pdfUrl);
    } catch {
      throw new ApiError(
        502,
        "Unable to retrieve the document file"
      );
    }

    if (!pdfResponse.ok || !pdfResponse.body) {
      throw new ApiError(
        502,
        "Unable to retrieve the document file"
      );
    }

    const filename = `${document.docNumber}.pdf`;

    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${filename}"`
    );

    if (pdfResponse.headers.get("content-length")) {
      res.setHeader(
        "Content-Length",
        pdfResponse.headers.get("content-length")!
      );
    }

    Readable.fromWeb(
      pdfResponse.body as import("node:stream/web").ReadableStream
    ).pipe(res);
  };

export const getDocumentDownload = asyncHandler(
  async (req: Request, res: Response) => {
    await streamDocument(req, res, "attachment");
  }
);

export const getDocumentView = asyncHandler(
  async (req: Request, res: Response) => {
    await streamDocument(req, res, "inline");
  }
);
