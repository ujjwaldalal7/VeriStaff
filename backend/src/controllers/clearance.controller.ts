import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthRequest } from "../types/auth.js";
import { getRequiredParam } from "../utils/requestParams.js";

const resignationSchema = z.object({
  resignationDate: z.coerce.date(),
  lastWorkingDay: z.coerce.date()
});

const clearanceUpdateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  remarks: z.string().trim().max(500).optional()
});

const allowedDepartments = ["IT", "FINANCE", "HR"] as const;

type ClearanceDepartment = (typeof allowedDepartments)[number];

const getDepartmentForRole = (
  role: string
): ClearanceDepartment | null => {
  if (role === "HR_ADMIN") {
    return "HR";
  }

  return null;
};

/**
 * Submit resignation and create the three required
 * department clearance records.
 */
export const submitResignation = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const employeeId = getRequiredParam(req, "employeeId");

    const data = resignationSchema.parse(req.body);

    if (data.lastWorkingDay < data.resignationDate) {
      throw new ApiError(
        400,
        "Last working day cannot be before resignation date"
      );
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: auth.tenantId
      }
    });

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    if (employee.status === "OFFBOARDED") {
      throw new ApiError(
        400,
        "Employee has already been offboarded"
      );
    }

    if (employee.status === "RESIGNED") {
      throw new ApiError(
        400,
        "Resignation has already been submitted"
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedEmployee = await tx.employee.update({
        where: {
          id: employee.id
        },
        data: {
          resignationDate: data.resignationDate,
          lastWorkingDay: data.lastWorkingDay,
          status: "RESIGNED"
        }
      });

      await tx.departmentClearance.createMany({
        data: allowedDepartments.map((department) => ({
          employeeId: employee.id,
          department,
          status: "PENDING"
        })),
        skipDuplicates: true
      });

      const clearances = await tx.departmentClearance.findMany({
        where: {
          employeeId: employee.id
        },
        orderBy: {
          department: "asc"
        }
      });

      return {
        employee: updatedEmployee,
        clearances
      };
    });

    res.status(201).json({
      success: true,
      message: "Resignation submitted and clearance process started",
      data: result
    });
  }
);

/**
 * Get all clearance records for an employee.
 */
export const getEmployeeClearances = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const employeeId = getRequiredParam(req, "employeeId");

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: auth.tenantId
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        status: true,
        resignationDate: true,
        lastWorkingDay: true
      }
    });

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    const clearances = await prisma.departmentClearance.findMany({
      where: {
        employeeId: employee.id
      },
      include: {
        clearedBy: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        department: "asc"
      }
    });

    res.json({
      success: true,
      data: {
        employee,
        clearances
      }
    });
  }
);

/**
 * Approve or reject one department clearance.
 *
 * HR_ADMIN and SUPER_ADMIN can update IT, FINANCE and HR
 * clearance records.
 *
 * When all three departments are APPROVED, the employee
 * is automatically moved from RESIGNED to OFFBOARDED.
 */
export const updateClearance = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const employeeId = getRequiredParam(req, "employeeId");

    const departmentParam = getRequiredParam(
      req,
      "department"
    );

    if (
      !allowedDepartments.includes(
        departmentParam as ClearanceDepartment
      )
    ) {
      throw new ApiError(
        400,
        "Invalid clearance department"
      );
    }

    const department =
      departmentParam as ClearanceDepartment;

    const data = clearanceUpdateSchema.parse(req.body);

    // Only HR and Super Admin can update clearances.
    if (
      auth.role !== "SUPER_ADMIN" &&
      auth.role !== "HR_ADMIN"
    ) {
      throw new ApiError(
        403,
        "You are not authorized to update clearance"
      );
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: auth.tenantId
      }
    });

    if (!employee) {
      throw new ApiError(
        404,
        "Employee not found"
      );
    }

    if (employee.status !== "RESIGNED") {
      throw new ApiError(
        400,
        "Clearance can only be updated for a resigned employee"
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const clearance =
          await tx.departmentClearance.findUnique({
            where: {
              employeeId_department: {
                employeeId: employee.id,
                department
              }
            }
          });

        if (!clearance) {
          throw new ApiError(
            404,
            "Clearance record not found"
          );
        }

        if (clearance.status === "APPROVED") {
          throw new ApiError(
            400,
            "This clearance has already been approved"
          );
        }

        const updatedClearance =
          await tx.departmentClearance.update({
            where: {
              id: clearance.id
            },
            data: {
              status: data.status,
              remarks: data.remarks,
              clearedById: auth.userId,
              clearedAt: new Date()
            },
            include: {
              clearedBy: {
                select: {
                  id: true,
                  email: true,
                  role: true
                }
              }
            }
          });

        // Check all three departments after this update.
        const allClearances =
          await tx.departmentClearance.findMany({
            where: {
              employeeId: employee.id
            }
          });

        const allApproved =
          allClearances.length ===
            allowedDepartments.length &&
          allClearances.every(
            (item) => item.status === "APPROVED"
          );

        let updatedEmployee = employee;

        if (allApproved) {
          updatedEmployee =
            await tx.employee.update({
              where: {
                id: employee.id
              },
              data: {
                status: "OFFBOARDED"
              }
            });
        }

        return {
          updatedClearance,
          updatedEmployee,
          allApproved
        };
      }
    );

    res.json({
      success: true,
      message: result.allApproved
        ? "Clearance approved and employee successfully offboarded"
        : `Clearance ${data.status.toLowerCase()} successfully`,
      data: {
        clearance: result.updatedClearance,
        employee: result.updatedEmployee,
        allApproved: result.allApproved,
        exitDocumentsUnlocked: result.allApproved
      }
    });
  }
);

/**
 * Check whether all three departments have approved
 * the employee's offboarding clearance.
 */
export const getClearanceStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const employeeId = getRequiredParam(req, "employeeId");

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: auth.tenantId
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        status: true
      }
    });

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    const clearances =
      await prisma.departmentClearance.findMany({
        where: {
          employeeId: employee.id
        }
      });

    const approvedCount = clearances.filter(
      (clearance) => clearance.status === "APPROVED"
    ).length;

    const rejectedCount = clearances.filter(
      (clearance) => clearance.status === "REJECTED"
    ).length;

    const pendingCount = clearances.filter(
      (clearance) => clearance.status === "PENDING"
    ).length;

    const allApproved =
      clearances.length === 3 &&
      clearances.every(
        (clearance) => clearance.status === "APPROVED"
      );

    res.json({
      success: true,
      data: {
        employee,
        clearances,
        summary: {
          total: clearances.length,
          approved: approvedCount,
          rejected: rejectedCount,
          pending: pendingCount,
          allApproved
        },
        exitDocumentsUnlocked: allApproved
      }
    });
  }
);