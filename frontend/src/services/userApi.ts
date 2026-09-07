import api from "./api";

export interface TenantUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE";
  isActive: boolean;
  createdAt: string;
  employee?: { id: string; employeeCode: string; firstName: string; lastName: string } | null;
  managedEmployees?: Array<{ employeeId: string; employee: { id: string; employeeCode: string; firstName: string; lastName: string } }>;
}

export const getUsers = async (params?: { search?: string; role?: string; page?: number; limit?: number }) => {
  const response = await api.get<{ success: boolean; data: TenantUser[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } }>("/users", { params });
  return response.data;
};

export const createUser = async (data: { email: string; firstName: string; lastName: string; password: string; role: "HR_ADMIN" | "MANAGER" }) => {
  const response = await api.post<{ success: boolean; data: TenantUser }>("/users", data);
  return response.data;
};

export const updateUserRole = async (id: string, role: "HR_ADMIN" | "MANAGER" | "EMPLOYEE") => {
  const response = await api.patch<{ success: boolean; data: TenantUser }>(`/users/${id}/role`, { role });
  return response.data;
};

export const updateUserStatus = async (id: string, isActive: boolean) => {
  const response = await api.patch<{ success: boolean; data: TenantUser }>(`/users/${id}/status`, { isActive });
  return response.data;
};

export const resetUserPassword = async (id: string, newPassword: string, confirmPassword: string) => {
  const response = await api.post(`/users/${id}/reset-password`, { newPassword, confirmPassword });
  return response.data;
};

export const assignManagerEmployee = async (managerId: string, employeeId: string) => {
  const response = await api.post(`/users/${managerId}/assignments`, { employeeId });
  return response.data;
};
