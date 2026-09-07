import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashPassword } from "../utils/password.js";
import type { AuthRequest } from "../types/auth.js";
import { getRequiredParam } from "../utils/requestParams.js";
import { createAuditLog } from "../utils/auditLog.js";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72)
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: "New passwords do not match",
      path: ["confirmPassword"]
    }
  );

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72)
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    }
  );

/**
 * Change password for the currently authenticated user.
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user;

    if (!auth) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        id: auth.userId,
        tenantId: auth.tenantId
      }
    });

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    const currentPasswordValid =
      await bcrypt.compare(
        data.currentPassword,
        user.passwordHash
      );

    if (!currentPasswordValid) {
      throw new ApiError(
        401,
        "Current password is incorrect"
      );
    }

    const samePassword =
      await bcrypt.compare(
        data.newPassword,
        user.passwordHash
      );

    if (samePassword) {
      throw new ApiError(
        400,
        "New password must be different from the current password"
      );
    }

    const passwordHash =
      await hashPassword(data.newPassword);

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 }
      }
    });

    await createAuditLog({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: "PASSWORD_CHANGE",
      entityType: "User",
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
    });

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  }
);

/**
 * HR/Admin reset an employee's password.
 */
export const resetEmployeePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user;

    if (!auth) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const employeeId =
      getRequiredParam(
        req,
        "employeeId"
      );

    const data =
      resetPasswordSchema.parse(req.body);

    const employee =
      await prisma.employee.findFirst({
        where: {
          id: employeeId,
          tenantId: auth.tenantId
        },
        include: {
          user: true
        }
      });

    if (!employee) {
      throw new ApiError(
        404,
        "Employee not found"
      );
    }

    if (!employee.user) {
      throw new ApiError(
        400,
        "This employee does not have a login account"
      );
    }

    const passwordHash =
      await hashPassword(
        data.newPassword
      );

    await prisma.user.update({
      where: {
        id: employee.user.id
      },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 }
      }
    });

    await createAuditLog({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: "PASSWORD_RESET",
      entityType: "User",
      entityId: employee.user.id,
      metadata: {
        employeeId: employee.id,
        employeeCode: employee.employeeCode
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined
    });

    res.json({
      success: true,
      message:
        "Employee password reset successfully"
    });
  }
);
