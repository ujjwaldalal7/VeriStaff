import type { NextFunction, Request, Response } from "express";
import type { Role } from "../generated/prisma/client.js";
import { ApiError } from "../utils/apiError.js";
import type { AuthRequest } from "../types/auth.js";

export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;

    if (!user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!roles.includes(user.role)) {
      return next(new ApiError(403, "You do not have permission for this action"));
    }

    next();
  };
};
