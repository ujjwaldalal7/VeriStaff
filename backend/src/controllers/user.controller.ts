import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashPassword } from "../utils/password.js";
import { getRequiredParam } from "../utils/requestParams.js";
import type { AuthRequest } from "../types/auth.js";
import { createAuditLog } from "../utils/auditLog.js";

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  password: z.string().min(8).max(72),
  role: z.enum(["HR_ADMIN", "MANAGER"])
});

const updateRoleSchema = z.object({
  role: z.enum(["HR_ADMIN", "MANAGER", "EMPLOYEE"])
});

const statusSchema = z.object({
  isActive: z.boolean()
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(72),
  confirmPassword: z.string().min(8).max(72)
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const assignmentSchema = z.object({
  employeeId: z.string().uuid()
});

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  employee: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true
    }
  },
  managedEmployees: {
    select: {
      employeeId: true,
      employee: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true
        }
      }
    }
  }
} as const;

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const query = z.object({
    search: z.string().trim().optional(),
    role: z.enum(["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }).parse(req.query);

  const where = {
    tenantId: auth.tenantId,
    ...(query.role ? { role: query.role } : {}),
    ...(query.search ? {
      OR: [
        { email: { contains: query.search, mode: "insensitive" as const } },
        { firstName: { contains: query.search, mode: "insensitive" as const } },
        { lastName: { contains: query.search, mode: "insensitive" as const } }
      ]
    } : {})
  };
  const skip = (query.page - 1) * query.limit;
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: "desc" }, skip, take: query.limit }),
    prisma.user.count({ where })
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNextPage: query.page * query.limit < total,
      hasPreviousPage: query.page > 1
    }
  });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const data = createUserSchema.parse(req.body);
  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "Email is already registered");

  const user = await prisma.user.create({
    data: {
      tenantId: auth.tenantId,
      email,
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash: await hashPassword(data.password),
      role: data.role
    },
    select: userSelect
  });

  await createAuditLog({ tenantId: auth.tenantId, actorId: auth.userId, action: "USER_CREATE", entityType: "User", entityId: user.id, metadata: { role: data.role, email } });
  res.status(201).json({ success: true, message: "User created", data: user });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const userId = getRequiredParam(req, "id");
  const data = updateRoleSchema.parse(req.body);
  if (userId === auth.userId) throw new ApiError(400, "You cannot change your own role");

  const user = await prisma.user.findFirst({ where: { id: userId, tenantId: auth.tenantId } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "SUPER_ADMIN") throw new ApiError(400, "Super admin roles cannot be changed here");

  const updated = await prisma.user.update({ where: { id: user.id }, data: { role: data.role, tokenVersion: { increment: 1 } }, select: userSelect });
  await createAuditLog({ tenantId: auth.tenantId, actorId: auth.userId, action: "USER_ROLE_CHANGE", entityType: "User", entityId: user.id, metadata: { from: user.role, to: data.role } });
  res.json({ success: true, message: "User role updated", data: updated });
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const userId = getRequiredParam(req, "id");
  const data = statusSchema.parse(req.body);
  if (userId === auth.userId && !data.isActive) throw new ApiError(400, "You cannot disable your own account");

  const user = await prisma.user.findFirst({ where: { id: userId, tenantId: auth.tenantId } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "SUPER_ADMIN" && !data.isActive) {
    const activeAdmins = await prisma.user.count({ where: { tenantId: auth.tenantId, role: "SUPER_ADMIN", isActive: true } });
    if (activeAdmins <= 1) throw new ApiError(400, "The only active super admin cannot be disabled");
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { isActive: data.isActive, tokenVersion: { increment: 1 } }, select: userSelect });
  await createAuditLog({ tenantId: auth.tenantId, actorId: auth.userId, action: data.isActive ? "USER_ENABLE" : "USER_DISABLE", entityType: "User", entityId: user.id });
  res.json({ success: true, message: data.isActive ? "User enabled" : "User disabled", data: updated });
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const userId = getRequiredParam(req, "id");
  const data = resetPasswordSchema.parse(req.body);
  const user = await prisma.user.findFirst({ where: { id: userId, tenantId: auth.tenantId } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "SUPER_ADMIN") throw new ApiError(403, "Super admin passwords must be changed by the account owner");

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(data.newPassword), tokenVersion: { increment: 1 } } });
  await createAuditLog({ tenantId: auth.tenantId, actorId: auth.userId, action: "PASSWORD_RESET", entityType: "User", entityId: user.id });
  res.json({ success: true, message: "Password reset successfully" });
});

export const assignManagerEmployee = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const managerId = getRequiredParam(req, "id");
  const { employeeId } = assignmentSchema.parse(req.body);
  const [manager, employee] = await prisma.$transaction([
    prisma.user.findFirst({ where: { id: managerId, tenantId: auth.tenantId, role: "MANAGER" } }),
    prisma.employee.findFirst({ where: { id: employeeId, tenantId: auth.tenantId } })
  ]);
  if (!manager || !employee) throw new ApiError(404, "Manager or employee not found");
  const assignment = await prisma.managerAssignment.create({ data: { managerId, employeeId }, include: { employee: true } });
  await createAuditLog({ tenantId: auth.tenantId, actorId: auth.userId, action: "MANAGER_ASSIGNMENT", entityType: "ManagerAssignment", entityId: assignment.id, metadata: { managerId, employeeId } });
  res.status(201).json({ success: true, message: "Employee assigned to manager", data: assignment });
});

export const unassignManagerEmployee = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const managerId = getRequiredParam(req, "id");
  const employeeId = getRequiredParam(req, "employeeId");
  const assignment = await prisma.managerAssignment.findFirst({ where: { managerId, employeeId, manager: { tenantId: auth.tenantId } } });
  if (!assignment) throw new ApiError(404, "Assignment not found");
  await prisma.managerAssignment.delete({ where: { id: assignment.id } });
  await createAuditLog({ tenantId: auth.tenantId, actorId: auth.userId, action: "MANAGER_ASSIGNMENT", entityType: "ManagerAssignment", entityId: assignment.id, metadata: { managerId, employeeId, removed: true } });
  res.json({ success: true, message: "Employee unassigned" });
});
