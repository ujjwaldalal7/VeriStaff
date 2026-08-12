import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthRequest } from "../types/auth.js";

const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(30),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().optional(),
  department: z.string().min(1).max(100),
  designation: z.string().min(1).max(100),
  joiningDate: z.coerce.date(),
  basicSalary: z.number().nonnegative().default(0),
  hra: z.number().nonnegative().default(0),
  allowances: z.number().nonnegative().default(0),
  deductions: z.number().nonnegative().default(0)
});

const updateEmployeeSchema = createEmployeeSchema.partial();

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const data = createEmployeeSchema.parse(req.body);

  const duplicate = await prisma.employee.findFirst({
    where: {
      tenantId: auth.tenantId,
      employeeCode: data.employeeCode
    }
  });

  if (duplicate) {
    throw new ApiError(409, "Employee code already exists in this organization");
  }

  let userId: string | undefined;

  if (data.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
      throw new ApiError(409, "Email is already registered");
    }
  }

  const employee = await prisma.employee.create({
    data: {
      tenantId: auth.tenantId,
      employeeCode: data.employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      department: data.department,
      designation: data.designation,
      joiningDate: data.joiningDate,
      basicSalary: data.basicSalary,
      hra: data.hra,
      allowances: data.allowances,
      deductions: data.deductions
    }
  });

  res.status(201).json({
    success: true,
    message: "Employee created",
    data: { ...employee, userId }
  });
});

export const listEmployees = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const employees = await prisma.employee.findMany({
    where: {
      tenantId: auth.tenantId,
      ...(status ? { status: status as any } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { employeeCode: { contains: search, mode: "insensitive" } },
              { department: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    success: true,
    data: employees
  });
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;

  const employee = await prisma.employee.findFirst({
    where: {
      id: req.params.id,
      tenantId: auth.tenantId
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true
        }
      },
      clearances: true,
      documents: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!employee) throw new ApiError(404, "Employee not found");

  res.json({ success: true, data: employee });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const data = updateEmployeeSchema.parse(req.body);

  const employee = await prisma.employee.findFirst({
    where: {
      id: req.params.id,
      tenantId: auth.tenantId
    }
  });

  if (!employee) throw new ApiError(404, "Employee not found");

  const updated = await prisma.employee.update({
    where: { id: employee.id },
    data
  });

  res.json({
    success: true,
    message: "Employee updated",
    data: updated
  });
});

export const resignEmployee = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;

  const schema = z.object({
    resignationDate: z.coerce.date(),
    lastWorkingDay: z.coerce.date()
  });

  const data = schema.parse(req.body);

  const employee = await prisma.employee.findFirst({
    where: {
      id: req.params.id,
      tenantId: auth.tenantId
    }
  });

  if (!employee) throw new ApiError(404, "Employee not found");

  const updated = await prisma.$transaction(async (tx) => {
    const updatedEmployee = await tx.employee.update({
      where: { id: employee.id },
      data: {
        resignationDate: data.resignationDate,
        lastWorkingDay: data.lastWorkingDay,
        status: "RESIGNED"
      }
    });

    await tx.departmentClearance.deleteMany({
      where: { employeeId: employee.id }
    });

    await tx.departmentClearance.createMany({
      data: [
        { employeeId: employee.id, department: "IT" },
        { employeeId: employee.id, department: "FINANCE" },
        { employeeId: employee.id, department: "HR" }
      ]
    });

    return updatedEmployee;
  });

  res.json({
    success: true,
    message: "Employee resigned and clearance workflow started",
    data: updated
  });
});
