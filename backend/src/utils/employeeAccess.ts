import { ApiError } from "./apiError.js";
import type { AuthPayload } from "../types/auth.js";

interface EmployeeAccessRecord {
  id: string;
  tenantId: string;
  userId: string | null;
}

export const ensureEmployeeAccess = (
  employee: EmployeeAccessRecord,
  auth: AuthPayload
) => {
  // Tenant isolation is mandatory for every authenticated user.
  if (employee.tenantId !== auth.tenantId) {
    throw new ApiError(403, "You do not have access to this employee");
  }

  // Super admin and HR admin can access employees in their tenant.
  if (auth.role === "SUPER_ADMIN" || auth.role === "HR_ADMIN") {
    return;
  }

  // Employees can only access their own employee record.
  if (auth.role === "EMPLOYEE") {
    if (employee.userId !== auth.userId) {
      throw new ApiError(403, "Employees can only access their own information");
    }

    return;
  }

  // Manager team access will be implemented when manager/team
  // assignment is introduced.
  if (auth.role === "MANAGER") {
    throw new ApiError(
      403,
      "Manager team access is not configured yet"
    );
  }

  throw new ApiError(403, "You do not have access to this employee");
};