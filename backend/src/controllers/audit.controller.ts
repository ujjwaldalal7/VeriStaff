import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthRequest } from "../types/auth.js";
import type { AuditAction } from "../generated/prisma/client.js";

const auditQuerySchema = z.object({
  action: z.enum([
    "LOGIN",
    "PASSWORD_CHANGE",
    "PASSWORD_RESET",
    "EMPLOYEE_CREATE",
    "EMPLOYEE_UPDATE",
    "EMPLOYEE_RESIGN",
    "CLEARANCE_UPDATE",
    "DOCUMENT_CREATE",
    "DOCUMENT_DOWNLOAD",
    "DOCUMENT_REVOKE",
    "DOCUMENT_DELETE"
  ]).optional(),
  entityType: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const getAuditLogs = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const query = auditQuerySchema.parse(req.query);

    const skip = (query.page - 1) * query.limit;

    const where = {
      tenantId: auth.tenantId,
      ...(query.action
        ? {
            action: query.action as AuditAction
          }
        : {}),
      ...(query.entityType
        ? {
            entityType: query.entityType
          }
        : {})
    };

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          createdAt: "desc"
        },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({
        where
      })
    ]);

    const totalPages = Math.ceil(total / query.limit);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1
      }
    });
  }
);
