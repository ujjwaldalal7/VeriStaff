import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import type { AuthRequest } from "../types/auth.js";
import { prisma } from "../lib/prisma.js";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        tenantId: payload.tenantId
      },
      select: {
        isActive: true,
        tokenVersion: true,
        role: true,
        email: true
      }
    });

    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
      return next(new ApiError(401, "Your session is no longer valid"));
    }

    (req as AuthRequest).user = {
      ...payload,
      role: user.role,
      email: user.email
    };
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired access token"));
  }
};
