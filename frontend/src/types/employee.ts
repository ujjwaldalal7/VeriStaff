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
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  bankAccountNo: string | null;
  bankIfsc: string | null;
  panCard: string | null;
  nationalIdUrl: string | null;
  createdAt: string;
  updatedAt: string;
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