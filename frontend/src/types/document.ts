export type DocumentType =
  | "OFFER_LETTER"
  | "PAYSLIP"
  | "RELIEVING_LETTER"
  | "EXPERIENCE_LETTER";

export type DocumentStatus =
  | "VALID"
  | "REVOKED";

export interface GeneratedDocument {
  id: string;
  tenantId: string;
  employeeId: string;
  docNumber: string;
  docType: DocumentType;
  verificationHash: string;
  pdfUrl?: string | null;
  status: DocumentStatus;
  revokedAt?: string | null;
  createdAt: string;
}