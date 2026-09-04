import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthRequest } from "../types/auth.js";

export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const tenantId = auth.tenantId;

    const [
      totalEmployees,
      invitedEmployees,
      onboardingEmployees,
      activeEmployees,
      resignedEmployees,
      offboardedEmployees,
      totalDocuments,
      validDocuments,
      revokedDocuments,
      pendingClearances,
      approvedClearances,
      rejectedClearances
    ] = await prisma.$transaction([
      prisma.employee.count({
        where: { tenantId }
      }),

      prisma.employee.count({
        where: {
          tenantId,
          status: "INVITED"
        }
      }),

      prisma.employee.count({
        where: {
          tenantId,
          status: "ONBOARDING"
        }
      }),

      prisma.employee.count({
        where: {
          tenantId,
          status: "ACTIVE"
        }
      }),

      prisma.employee.count({
        where: {
          tenantId,
          status: "RESIGNED"
        }
      }),

      prisma.employee.count({
        where: {
          tenantId,
          status: "OFFBOARDED"
        }
      }),

      prisma.generatedDocument.count({
        where: { tenantId }
      }),

      prisma.generatedDocument.count({
        where: {
          tenantId,
          status: "VALID"
        }
      }),

      prisma.generatedDocument.count({
        where: {
          tenantId,
          status: "REVOKED"
        }
      }),

      prisma.departmentClearance.count({
        where: {
          employee: {
            tenantId
          },
          status: "PENDING"
        }
      }),

      prisma.departmentClearance.count({
        where: {
          employee: {
            tenantId
          },
          status: "APPROVED"
        }
      }),

      prisma.departmentClearance.count({
        where: {
          employee: {
            tenantId
          },
          status: "REJECTED"
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          invited: invitedEmployees,
          onboarding: onboardingEmployees,
          active: activeEmployees,
          resigned: resignedEmployees,
          offboarded: offboardedEmployees
        },

        documents: {
          total: totalDocuments,
          valid: validDocuments,
          revoked: revokedDocuments
        },

        clearances: {
          pending: pendingClearances,
          approved: approvedClearances,
          rejected: rejectedClearances
        }
      }
    });
  }
);