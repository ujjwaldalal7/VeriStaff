import { prisma } from "../lib/prisma.js";
import type {
  AuditAction,
  Prisma
} from "../generated/prisma/client.js";

interface CreateAuditLogParams {
  tenantId: string;
  actorId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async ({
  tenantId,
  actorId,
  action,
  entityType,
  entityId,
  metadata,
  ipAddress,
  userAgent
}: CreateAuditLogParams) => {
  await prisma.auditLog.create({
    data: {
      tenantId,
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress,
      userAgent
    }
  });
};