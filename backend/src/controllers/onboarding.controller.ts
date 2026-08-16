import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSecureToken } from "../utils/tokens.js";
import { hashPassword } from "../utils/password.js";
import type { AuthRequest } from "../types/auth.js";
import { getRequiredParam } from "../utils/requestParams.js";

const inviteSchema = z.object({
  employeeId: z.string().uuid(),
  email: z.string().email(),
  expiresInHours: z.number().int().min(1).max(168).default(48)
});

const onboardingSchema = z
  .object({
    firstName: z.string().trim().min(1).max(50),

    lastName: z.string().trim().min(1).max(50),

    bankAccountNo: z.string().trim().min(4).max(30),

    bankIfsc: z
      .string()
      .trim()
      .toUpperCase()
      .min(4)
      .max(20),

    panCard: z
      .string()
      .trim()
      .toUpperCase()
      .min(4)
      .max(20),

    password: z
      .string()
      .min(8)
      .max(72),

    confirmPassword: z
      .string()
      .min(8)
      .max(72)
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    }
  );

export const createInvite = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    const data = inviteSchema.parse(req.body);

    const employee = await prisma.employee.findFirst({
      where: {
        id: data.employeeId,
        tenantId: auth.tenantId
      }
    });

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    if (employee.userId) {
      throw new ApiError(
        400,
        "Employee account already exists"
      );
    }

    const existingInvite = await prisma.onboardingInvite.findFirst({
      where: {
        employeeId: employee.id,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingInvite) {
      throw new ApiError(
        400,
        "An active onboarding invitation already exists for this employee"
      );
    }

    const token = createSecureToken(32);

    const expiresAt = new Date(
      Date.now() + data.expiresInHours * 60 * 60 * 1000
    );

    const invite = await prisma.$transaction(async (tx) => {
      const createdInvite = await tx.onboardingInvite.create({
        data: {
          tenantId: auth.tenantId,
          employeeId: employee.id,
          email: data.email.toLowerCase(),
          token,
          expiresAt
        }
      });

      await tx.employee.update({
        where: {
          id: employee.id
        },
        data: {
          status: "ONBOARDING"
        }
      });

      return createdInvite;
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
  }
);

export const validateInvite = asyncHandler(
  async (req: Request, res: Response) => {
    const token = getRequiredParam(req, "token");

    const invite = await prisma.onboardingInvite.findUnique({
      where: {
        token
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

    if (
      !invite ||
      invite.isUsed ||
      invite.expiresAt <= new Date()
    ) {
      throw new ApiError(
        400,
        "Invitation is invalid or expired"
      );
    }

    res.json({
      success: true,
      data: {
        email: invite.email,
        tenant: invite.tenant,
        expiresAt: invite.expiresAt
      }
    });
  }
);

export const completeOnboarding = asyncHandler(
  async (req: Request, res: Response) => {
    const data = onboardingSchema.parse(req.body);

    const token = getRequiredParam(req, "token");

    const result = await prisma.$transaction(async (tx) => {
      const invite = await tx.onboardingInvite.findUnique({
        where: {
          token
        }
      });

      if (
        !invite ||
        invite.isUsed ||
        invite.expiresAt <= new Date()
      ) {
        throw new ApiError(
          400,
          "Invitation is invalid or expired"
        );
      }

      if (!invite.employeeId) {
        throw new ApiError(
          400,
          "Invitation is not linked to an employee"
        );
      }

      const employee = await tx.employee.findFirst({
        where: {
          id: invite.employeeId,
          tenantId: invite.tenantId
        }
      });

      if (!employee) {
        throw new ApiError(
          404,
          "Employee not found"
        );
      }

      if (employee.userId) {
        throw new ApiError(
          400,
          "Employee account already exists"
        );
      }

      const existingUser = await tx.user.findUnique({
        where: {
          email: invite.email
        }
      });

      if (existingUser) {
        throw new ApiError(
          409,
          "An account already exists for this email"
        );
      }

      const passwordHash = await hashPassword(
        data.password
      );

      const user = await tx.user.create({
        data: {
          tenantId: invite.tenantId,
          email: invite.email,
          passwordHash,
          role: "EMPLOYEE"
        }
      });

      const updatedEmployee = await tx.employee.update({
        where: {
          id: employee.id
        },
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
        where: {
          id: invite.id
        },
        data: {
          isUsed: true
        }
      });

      return {
        employee: updatedEmployee
      };
    });

    res.status(201).json({
      success: true,
      message: "Onboarding completed successfully",
      data: result
    });
  }
);