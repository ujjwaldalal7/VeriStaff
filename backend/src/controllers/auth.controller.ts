import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import type { AuthRequest } from "../types/auth.js";
import { createAuditLog } from "../utils/auditLog.js";

const registerSchema = z.object({
  organizationName: z.string().min(2).max(100),
  domain: z.string().min(2).max(100).regex(/^[a-z0-9.-]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const registerTenant = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const normalizedEmail = data.email.toLowerCase();
  const normalizedDomain = data.domain.toLowerCase();

  const existingDomain = await prisma.tenant.findUnique({
    where: { domain: normalizedDomain }
  });

  if (existingDomain) {
    throw new ApiError(409, "Organization domain is already registered");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const passwordHash = await hashPassword(data.password);

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: data.organizationName,
        domain: normalizedDomain,
        footerAddress: ""
      }
    });

    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: normalizedEmail,
        passwordHash,
        role: "SUPER_ADMIN"
      }
    });

    return { tenant, user };
  });

  const token = signAccessToken({
    userId: result.user.id,
    tenantId: result.tenant.id,
    role: result.user.role,
    email: result.user.email
  });

  res.status(201).json({
    success: true,
    message: "Organization and super admin created",
    data: {
      accessToken: token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        domain: result.tenant.domain
      }
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    include: { tenant: true }
  });

  if (!user || !(await comparePassword(data.password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signAccessToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email
  });

  await createAuditLog({
    tenantId: user.tenantId,
    actorId: user.id,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    metadata: {
      email: user.email,
      role: user.role
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined
  });

  res.json({
    success: true,
    data: {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        domain: user.tenant.domain,
        logoUrl: user.tenant.logoUrl,
        primaryColor: user.tenant.primaryColor,
        secondaryColor: user.tenant.secondaryColor
      }
    }
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;

  const user = await prisma.user.findFirst({
    where: {
      id: auth.userId,
      tenantId: auth.tenantId
    },
    include: {
      tenant: true,
      employee: true
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant: user.tenant,
      employee: user.employee
    }
  });
});
