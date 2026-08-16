import type { Request, Response } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSecureToken } from "../utils/tokens.js";
import type { AuthRequest } from "../types/auth.js";
import { getRequiredParam } from "../utils/requestParams.js";


const inviteSchema = z.object({
  employeeId: z.string().uuid(),
  email: z.string().email(),
  expiresInHours: z.number().int().min(1).max(168).default(48)
});

const onboardingSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  bankAccountNo: z.string().min(4).max(30),
  bankIfsc: z.string().min(4).max(20),
  panCard: z.string().min(4).max(20)
});

export const createInvite = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const data = inviteSchema.parse(req.body);

  const employee = await prisma.employee.findFirst({
    where: {
      id: data.employeeId,
      tenantId: auth.tenantId
    }
  });

  if (!employee) throw new ApiError(404, "Employee not found");

  const token = createSecureToken(32);
  const expiresAt = new Date(
    Date.now() + data.expiresInHours * 60 * 60 * 1000
  );

  const invite = await prisma.onboardingInvite.create({
    data: {
      tenantId: auth.tenantId,
      employeeId: employee.id,
      email: data.email.toLowerCase(),
      token,
      expiresAt
    }
  });

  res.status(201).json({
    success: true,
    message: "Onboarding invitation created",
    data: {
      inviteId: invite.id,
      token: invite.token,
      expiresAt: invite.expiresAt
    }
  });
});

export const validateInvite = asyncHandler(async (req: Request, res: Response) => {
  const invite = await prisma.onboardingInvite.findUnique({
    where: {
  token: getRequiredParam(req, "token")
},
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true
        }
      }
    }
  });

  if (!invite || invite.isUsed || invite.expiresAt <= new Date()) {
    throw new ApiError(400, "Invitation is invalid or expired");
  }

  res.json({
    success: true,
    data: {
      email: invite.email,
      tenant: invite.tenant,
      expiresAt: invite.expiresAt
    }
  });
});

export const completeOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const data = onboardingSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx) => {
    const invite = await tx.onboardingInvite.findUnique({
      where: {
            token: getRequiredParam(req, "token")
}
    });

    if (!invite || invite.isUsed || invite.expiresAt <= new Date()) {
      throw new ApiError(400, "Invitation is invalid or expired");
    }

    if (!invite.employeeId) {
      throw new ApiError(400, "Invitation is not linked to an employee");
    }

    const employee = await tx.employee.findFirst({
      where: {
        id: invite.employeeId,
        tenantId: invite.tenantId
      }
    });

    if (!employee) throw new ApiError(404, "Employee not found");

    const password = crypto.randomBytes(12).toString("base64url");
    const { hashPassword } = await import("../utils/password.js");
    const passwordHash = await hashPassword(password);

    const user = await tx.user.create({
      data: {
        tenantId: invite.tenantId,
        email: invite.email,
        passwordHash,
        role: "EMPLOYEE"
      }
    });

    const updatedEmployee = await tx.employee.update({
      where: { id: employee.id },
      data: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        bankAccountNo: data.bankAccountNo,
        bankIfsc: data.bankIfsc,
        panCard: data.panCard,
        status: "ACTIVE"
      }
    });

    await tx.onboardingInvite.update({
      where: { id: invite.id },
      data: { isUsed: true }
    });

    return {
      employee: updatedEmployee,
      temporaryPassword: password
    };
  });

  res.status(201).json({
    success: true,
    message: "Onboarding completed",
    data: result
  });
});
