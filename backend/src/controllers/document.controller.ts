import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSha256 } from "../utils/tokens.js";
import { env } from "../config/env.js";
import QRCode from "qrcode";
import type { AuthRequest } from "../types/auth.js";

const documentSchema = z.object({
  employeeId: z.string().uuid(),
  docType: z.enum([
    "OFFER_LETTER",
    "PAYSLIP",
    "RELIEVING_LETTER",
    "EXPERIENCE_LETTER"
  ]),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const createDocumentRecord = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const data = documentSchema.parse(req.body);

  const employee = await prisma.employee.findFirst({
    where: {
      id: data.employeeId,
      tenantId: auth.tenantId
    },
    include: { tenant: true }
  });

  if (!employee) throw new ApiError(404, "Employee not found");

  const docNumber = `VS-${new Date().getFullYear()}-${Date.now()}`;
  const timestamp = new Date().toISOString();
  const payload = [
    auth.tenantId,
    employee.id,
    data.docType,
    docNumber,
    timestamp
  ].join(":");

  const verificationHash = createSha256(payload);
  const verificationUrl =
    `${env.PUBLIC_API_URL}/verify-doc/${verificationHash}`;

  const qrDataUrl = await QRCode.toDataURL(verificationUrl);

  const document = await prisma.generatedDocument.create({
    data: {
      tenantId: auth.tenantId,
      employeeId: employee.id,
      docNumber,
      docType: data.docType,
      verificationHash,
      metadataJson: {
        ...data.metadata,
        verificationUrl,
        qrDataUrl
      }
    }
  });

  res.status(201).json({
    success: true,
    message: "Document verification record created",
    data: {
      id: document.id,
      docNumber: document.docNumber,
      docType: document.docType,
      verificationHash: document.verificationHash,
      verificationUrl,
      qrDataUrl
    }
  });
});
