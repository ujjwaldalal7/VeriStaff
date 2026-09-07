export type EmployeeStatus =
  | "INVITED"
  | "ONBOARDING"
  | "ACTIVE"
  | "RESIGNED"
  | "OFFBOARDED";

export interface Employee {
  id: string;
  tenantId: string;
  userId: string | null;

  employeeCode: string;
  firstName: string;
  lastName: string;

  department: string;
  designation: string;

  joiningDate: string;
  resignationDate: string | null;
  lastWorkingDay: string | null;

  status: EmployeeStatus;

  basicSalary: string | number;
  hra: string | number;
  allowances: string | number;
  deductions: string | number;

  bankAccountNo: string | null;
  bankIfsc: string | null;
  panCard: string | null;
  nationalIdUrl: string | null;
  user?: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
  } | null;

  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListParams {
  search?: string;
  status?: EmployeeStatus;
  department?: string;
  page?: number;
  limit?: number;
}

export interface EmployeeListResponse {
  success: boolean;
  data: Employee[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
