import api from "./api";

export interface CreatePayslipRequest {
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
}

export const getPayslips = async (params?: { page?: number; limit?: number; employeeId?: string; month?: number; year?: number; status?: "VALID" | "REVOKED" }) => {
  const response = await api.get("/payslips", { params });

  return response.data;
};

export const getMyPayslips = async () => {
  const response = await api.get("/payslips/me");

  return response.data;
};

export const createPayslip = async (
  data: CreatePayslipRequest
) => {
  const response = await api.post(
    "/payslips",
    data
  );

  return response.data;
};

export const generatePayslipDocument = async (
  payslipId: string
) => {
  const response = await api.post(
    `/payslips/${payslipId}/generate`
  );

  return response.data;
};
