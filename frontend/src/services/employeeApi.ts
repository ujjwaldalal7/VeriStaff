import api from "./api";
import type {
  Employee,
  EmployeeListResponse,
    EmployeeListParams
} from "../types/employee";



export interface CreateEmployeeRequest {
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  joiningDate: string;
  basicSalary?: number;
  hra?: number;
  allowances?: number;
  deductions?: number;
}

export type UpdateEmployeeRequest =
  Partial<CreateEmployeeRequest>;

export interface UpdateMyProfileRequest {
  firstName?: string;
  lastName?: string;
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  panCard?: string | null;
}

export const getEmployees = async (
  params?: EmployeeListParams
) => {
  const response = await api.get<EmployeeListResponse>(
    "/employees",
    { params }
  );

  return response.data;
};

export const getEmployee = async (
  employeeId: string
) => {
  const response = await api.get<{
    success: boolean;
    data: Employee;
  }>(`/employees/${employeeId}`);

  return response.data;
};

export const getMyProfile = async () => {
  const response = await api.get<{
    success: boolean;
    data: Employee;
  }>("/employees/me");

  return response.data;
};

export const createEmployee = async (
  data: CreateEmployeeRequest
) => {
  const response = await api.post<{
    success: boolean;
    data: Employee;
  }>("/employees", data);

  return response.data;
};

export const updateEmployee = async (
  employeeId: string,
  data: UpdateEmployeeRequest
) => {
  const response = await api.patch<{
    success: boolean;
    data: Employee;
  }>(`/employees/${employeeId}`, data);

  return response.data;
};

export const updateMyProfile = async (
  data: UpdateMyProfileRequest
) => {
  const response = await api.patch<{
    success: boolean;
    data: Employee;
  }>("/employees/me", data);

  return response.data;
};

