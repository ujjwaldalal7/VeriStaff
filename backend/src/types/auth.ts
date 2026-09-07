import type { Role } from "../generated/prisma/client.js";

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: Role;
  email: string;
  tokenVersion: number;
}

export interface AuthRequest extends Express.Request {
  user?: AuthPayload;
}
