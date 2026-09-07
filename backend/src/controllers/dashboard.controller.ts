import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthRequest } from "../types/auth.js";

export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const tenantId = auth.tenantId;
    const employeeScope = auth.role === "MANAGER"
      ? { managerAssignments: { some: { managerId: auth.userId } } }
      : {};

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
        where: { tenantId, ...employeeScope }
      }),

      prisma.employee.count({
        where: {
          tenantId,
          ...employeeScope,
          status: "INVITED"
        }
      }),

      prisma.employee.count({
        where: {
          tenantId,
          ...employeeScope,
          status: "ONBOARDING"
        }
      }),

      prisma.employee.count({
        where: {
          tenantId,
          ...employeeScope,
          status: "ACTIVE"
        }
      }),

      prisma.employee.count({
        where: {
          tenantId,
          ...employeeScope,
          status: "RESIGNED"
        }
      }),

      prisma.employee.count({
        where: {
          tenantId,
          ...employeeScope,
          status: "OFFBOARDED"
        }
      }),

      prisma.generatedDocument.count({
        where: {
          tenantId,
          ...(auth.role === "MANAGER"
            ? { employee: employeeScope }
            : {})
        }
      }),

      prisma.generatedDocument.count({
        where: {
          tenantId,
          ...(auth.role === "MANAGER"
            ? { employee: employeeScope }
            : {}),
          status: "VALID"
        }
      }),

      prisma.generatedDocument.count({
        where: {
          tenantId,
          ...(auth.role === "MANAGER"
            ? { employee: employeeScope }
            : {}),
          status: "REVOKED"
        }
      }),

      prisma.departmentClearance.count({
        where: {
          employee: {
            tenantId,
            ...employeeScope
          },
          status: "PENDING"
        }
      }),

      prisma.departmentClearance.count({
        where: {
          employee: {
            tenantId,
            ...employeeScope
          },
          status: "APPROVED"
        }
      }),

      prisma.departmentClearance.count({
        where: {
          employee: {
            tenantId,
            ...employeeScope
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