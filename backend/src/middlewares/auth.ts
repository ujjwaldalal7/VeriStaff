import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import type { AuthRequest } from "../types/auth.js";

export const authenticate = (
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
    (req as AuthRequest).user = verifyAccessToken(token);
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired access token"));
  }
};
