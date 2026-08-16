import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthRequest } from "../types/auth.js";
import { getRequiredParam } from "../utils/requestParams.js";
const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  remarks: z.string().max(1000).optional()
});

const departmentForRole: Record<string, "IT" | "FINANCE" | "HR" | null> = {
  SUPER_ADMIN: null,
  HR_ADMIN: "HR",
  MANAGER: null,
  EMPLOYEE: null
};

export const listClearances = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;

  const employee = await prisma.employee.findFirst({
    where: {
      id: getRequiredParam(req, "employeeId"),
      tenantId: auth.tenantId
    }
  });

  if (!employee) throw new ApiError(404, "Employee not found");

  const clearances = await prisma.departmentClearance.findMany({
    where: { employeeId: employee.id },
    include: {
      clearedBy: {
        select: { id: true, email: true, role: true }
      }
    },
    orderBy: { department: "asc" }
  });

  res.json({ success: true, data: clearances });
});

export const updateClearance = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const data = updateSchema.parse(req.body);

  const departmentParam = getRequiredParam(req, "department");

if (!["IT", "FINANCE", "HR"].includes(departmentParam)) {
  throw new ApiError(400, "Invalid clearance department");
}

const department = departmentParam as "IT" | "FINANCE" | "HR";

  const employee = await prisma.employee.findFirst({
    where: {
      id: getRequiredParam(req, "employeeId"),
      tenantId: auth.tenantId
    }
  });

  if (!employee) throw new ApiError(404, "Employee not found");

  const allowedDepartment = departmentForRole[auth.role];

  if (auth.role !== "SUPER_ADMIN" && auth.role !== "HR_ADMIN") {
    throw new ApiError(403, "You cannot approve clearance");
  }

  if (auth.role === "HR_ADMIN" && department !== allowedDepartment) {
    throw new ApiError(403, "HR admin can only approve HR clearance");
  }

  const clearance = await prisma.departmentClearance.upsert({
    where: {
      employeeId_department: {
        employeeId: employee.id,
        department
      }
    },
    update: {
      status: data.status,
      remarks: data.remarks,
      clearedById: auth.userId,
      clearedAt: new Date()
    },
    create: {
      employeeId: employee.id,
      department,
      status: data.status,
      remarks: data.remarks,
      clearedById: auth.userId,
      clearedAt: new Date()
    }
  });

  const allClearances = await prisma.departmentClearance.findMany({
    where: { employeeId: employee.id }
  });

  const fullyApproved =
    allClearances.length === 3 &&
    allClearances.every((item) => item.status === "APPROVED");

  if (fullyApproved) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: { status: "OFFBOARDED" }
    });
  }

  res.json({
    success: true,
    message: fullyApproved
      ? "Clearance approved. Employee is fully offboarded."
      : "Clearance updated",
    data: clearance
  });
});
