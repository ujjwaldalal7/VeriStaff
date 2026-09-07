import api from "./api";
import type {
  DocumentType,
  GeneratedDocument
} from "../types/document";

export const getDocuments = async (params?: {
  page?: number;
  limit?: number;
  docType?: DocumentType;
  employeeId?: string;
}) => {
  const response = await api.get<{
    success: boolean;
    data: GeneratedDocument[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>("/documents", {
    params
  });

  return response.data;
};

export const getEmployeeDocuments = async (
  employeeId: string
) => {
  const response = await api.get<{
    success: boolean;
    data: {
      employee: unknown;
      documents: GeneratedDocument[];
    };
  }>(`/documents/employee/${employeeId}`);

  return response.data;
};

export const getMyDocuments = async () => {
  const response = await api.get<{
    success: boolean;
    data: {
      employee: unknown;
      documents: GeneratedDocument[];
    };
  }>("/documents/me");

  return response.data;
};

export const getDocument = async (
  documentId: string
) => {
  const response = await api.get<{
    success: boolean;
    data: GeneratedDocument;
  }>(`/documents/${documentId}`);

  return response.data;
};

export const createDocument = async (data: {
  employeeId: string;
  docType: DocumentType;
  metadata?: Record<string, unknown>;
}) => {
  const response = await api.post(
    "/documents",
    data
  );

  return response.data;
};

export const revokeDocument = async (
  documentId: string
) => {
  const response = await api.patch(
    `/documents/${documentId}/revoke`
  );

  return response.data;
};

export const downloadDocument = async (
  documentId: string
) => {
  const response = await api.get(
    `/documents/${documentId}/download`,
    {
      responseType: "blob"
    }
  );

  return response.data;
};
