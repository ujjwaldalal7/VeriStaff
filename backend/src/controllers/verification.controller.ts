import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await prisma.generatedDocument.findUnique({
    where: {
      verificationHash: req.params.hash
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          logoUrl: true
        }
      },
      employee: {
        select: {
          employeeCode: true,
          firstName: true,
          lastName: true,
          department: true,
          designation: true
        }
      }
    }
  });

  if (!document) {
    throw new ApiError(404, "Document not found or invalid verification hash");
  }

  res.json({
    success: true,
    data: {
      status: "VALID",
      documentNumber: document.docNumber,
      documentType: document.docType,
      verificationHash: document.verificationHash,
      issuedAt: document.createdAt,
      company: document.tenant,
      employee: document.employee
    }
  });
});
