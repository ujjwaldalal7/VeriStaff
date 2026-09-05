import api from "./api";

export interface AuditLog {
  id: string;
  tenantId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;

  actor: {
    id: string;
    email: string;
    role: string;
  } | null;
}

export interface AuditLogParams {
  action?: string;
  entityType?: string;
  page?: number;
  limit?: number;
}

export const getAuditLogs = async (
  params?: AuditLogParams
) => {
  const response = await api.get<{
    success: boolean;
    data: AuditLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>("/audit-logs", {
    params
  });

  return response.data;
};