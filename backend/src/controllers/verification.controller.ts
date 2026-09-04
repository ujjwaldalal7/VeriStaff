import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";

import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getRequiredParam } from "../utils/requestParams.js";


export const verifyDocument = asyncHandler(
  async (req: Request, res: Response) => {

    const verificationHash =
      getRequiredParam(req, "hash");

    const document =
      await prisma.generatedDocument.findUnique({
        where: {
          verificationHash
        },

        include: {
          tenant: {
            select: {
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
      throw new ApiError(
        404,
        "Document not found or invalid verification hash"
      );
    }


    res.json({
      success: true,

      data: {
        status: document.status,
        documentNumber:  document.docNumber,
        documentType:  document.docType,
        verificationHash:  document.verificationHash,
        issuedAt:  document.createdAt,
        revokedAt: document.revokedAt,
        company:  document.tenant,
        employee:  document.employee
      }
    });
  }
);