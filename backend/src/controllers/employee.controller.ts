import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthRequest } from "../types/auth.js";
import { getRequiredParam } from "../utils/requestParams.js";
import { ensureEmployeeAccess } from "../utils/employeeAccess.js";
import type { EmployeeStatus } from "../generated/prisma/client.js";
import { createAuditLog } from "../utils/auditLog.js";

const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(30),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  department: z.string().min(1).max(100),
  designation: z.string().min(1).max(100),
  joiningDate: z.coerce.date(),
  basicSalary: z.number().nonnegative().default(0),
  hra: z.number().nonnegative().default(0),
  allowances: z.number().nonnegative().default(0),
  deductions: z.number().nonnegative().default(0)
});

const updateEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(30).optional(),
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  department: z.string().trim().min(1).max(100).optional(),
  designation: z.string().trim().min(1).max(100).optional(),
  joiningDate: z.coerce.date().optional(),
  basicSalary: z.number().nonnegative().optional(),
  hra: z.number().nonnegative().optional(),
  allowances: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional()
});

const updateMyProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),

  bankAccountNo: z
    .string()
    .trim()
    .min(4)
    .max(30)
    .optional()
    .nullable(),

  bankIfsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .optional()
    .nullable(),

  panCard: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
    .optional()
    .nullable()
});

const employeeListQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  status: z
    .enum([
      "INVITED",
      "ONBOARDING",
      "ACTIVE",
      "RESIGNED",
      "OFFBOARDED"
    ])
    .optional(),

  department: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10)
});

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

  await createAuditLog({
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: "EMPLOYEE_CREATE",
    entityType: "Employee",
    entityId: employee.id,
    metadata: {
      employeeCode: employee.employeeCode,
      department: employee.department,
      designation: employee.designation
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined
  });

  res.status(201).json({
    success: true,
    message: "Employee created",
    data: employee
  });
});

export const listEmployees = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const parsed = employeeListQuerySchema.safeParse(
      req.query
    );

    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ??
          "Invalid query parameters"
      );
    }

    const {
      search,
      status,
      department,
      page,
      limit
    } = parsed.data;

    const skip = (page - 1) * limit;

    const where = {
      tenantId: auth.tenantId,

      ...(status
        ? {
            status: status as EmployeeStatus
          }
        : {}),

      ...(department
        ? {
            department: {
              equals: department,
              mode: "insensitive" as const
            }
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                firstName: {
                  contains: search,
                  mode: "insensitive" as const
                }
              },
              {
                lastName: {
                  contains: search,
                  mode: "insensitive" as const
                }
              },
              {
                employeeCode: {
                  contains: search,
                  mode: "insensitive" as const
                }
              },
              {
                department: {
                  contains: search,
                  mode: "insensitive" as const
                }
              },
              {
                designation: {
                  contains: search,
                  mode: "insensitive" as const
                }
              }
            ]
          }
        : {})
    };

    const [employees, total] =
      await prisma.$transaction([
        prisma.employee.findMany({
          where,
          orderBy: {
            createdAt: "desc"
          },
          skip,
          take: limit
        }),

        prisma.employee.count({
          where
        })
      ]);

    const totalPages = Math.ceil(
      total / limit
    );

    res.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  }
);

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;

  const employee = await prisma.employee.findFirst({
    where: {
      id: getRequiredParam(req, "id"),
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
        select: {
          id: true,
          employeeId: true,
          docNumber: true,
          docType: true,
          verificationHash: true,
          status: true,
          revokedAt: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  ensureEmployeeAccess(employee, auth);

  res.json({
    success: true,
    data: employee
  });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const data = updateEmployeeSchema.parse(req.body);

  const employee = await prisma.employee.findFirst({
    where: {
      id: getRequiredParam(req, "id"),
      tenantId: auth.tenantId
    }
  });

  if (!employee) throw new ApiError(404, "Employee not found");

  const updated = await prisma.employee.update({
    where: { id: employee.id },
    data
  });

  await createAuditLog({
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: "EMPLOYEE_UPDATE",
    entityType: "Employee",
    entityId: updated.id,
    metadata: {
      employeeCode: updated.employeeCode
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined
  });

  res.json({
    success: true,
    message: "Employee updated",
    data: updated
  });
});

export const getMyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const employee = await prisma.employee.findFirst({
      where: {
        userId: auth.userId,
        tenantId: auth.tenantId
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        department: true,
        designation: true,
        joiningDate: true,
        resignationDate: true,
        lastWorkingDay: true,
        status: true,
        bankAccountNo: true,
        bankIfsc: true,
        panCard: true,
        nationalIdUrl: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    });

    if (!employee) {
      throw new ApiError(
        404,
        "Employee profile not found"
      );
    }

    res.json({
      success: true,
      data: employee
    });
  }
);


export const updateMyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const data = updateMyProfileSchema.parse(req.body);

    const employee = await prisma.employee.findFirst({
      where: {
        userId: auth.userId,
        tenantId: auth.tenantId
      }
    });

    if (!employee) {
      throw new ApiError(
        404,
        "Employee profile not found"
      );
    }

    const updated = await prisma.employee.update({
      where: {
        id: employee.id
      },
      data
    });

    await createAuditLog({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: "EMPLOYEE_UPDATE",
      entityType: "Employee",
      entityId: updated.id,
      metadata: {
        employeeCode: updated.employeeCode,
        source: "EMPLOYEE_SELF_SERVICE"
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updated.id,
        employeeCode: updated.employeeCode,
        firstName: updated.firstName,
        lastName: updated.lastName,
        department: updated.department,
        designation: updated.designation,
        joiningDate: updated.joiningDate,
        status: updated.status,
        bankAccountNo: updated.bankAccountNo,
        bankIfsc: updated.bankIfsc,
        panCard: updated.panCard,
        nationalIdUrl: updated.nationalIdUrl,
        updatedAt: updated.updatedAt
      }
    });
  }
);
