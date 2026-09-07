import api from "./api";

export const getClearanceStatus = async (
  employeeId: string
) => {
  const response = await api.get(
    `/clearances/employees/${employeeId}`
  );

  return response.data;
};

export const updateClearance = async (
  employeeId: string,
  department: "IT" | "FINANCE" | "HR",
  data: {
    status: "PENDING" | "APPROVED" | "REJECTED";
    remarks?: string;
  }
) => {
  const response = await api.patch(
    `/clearances/employees/${employeeId}/${department}`,
    data
  );

  return response.data;
};

export const resignEmployeeWithClearances = async (
  employeeId: string,
  data?: {
    resignationDate?: string;
    lastWorkingDay?: string;
  }
) => {
  const response = await api.post(
    `/clearances/employees/${employeeId}/resignation`,
    data
  );

  return response.data;
};
