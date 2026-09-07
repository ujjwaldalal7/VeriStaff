import api from "./api";
import type {
  DocumentStatus,
  DocumentType
} from "../types/document";

export interface VerificationResponse {
  success: boolean;
  data: {
    status: DocumentStatus;
    documentNumber: string;
    documentType: DocumentType;
    verificationHash: string;
    issuedAt: string;
    revokedAt: string | null;
    company: {
      name: string;
      logoUrl: string | null;
    };
    employee: {
      employeeCode: string;
      firstName: string;
      lastName: string;
      department: string;
      designation: string;
    };
  };
}

export const verifyDocumentHash = async (
  hash: string
) => {
  const response = await api.get<VerificationResponse>(
    `/verify-doc/${hash}`
  );

  return response.data;
};
