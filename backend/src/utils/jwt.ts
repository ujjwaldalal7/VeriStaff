import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthPayload } from "../types/auth.js";

export const signAccessToken = (payload: AuthPayload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): AuthPayload => {
  return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
};
