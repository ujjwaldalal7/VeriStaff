export type UserRole =
  | "SUPER_ADMIN"
  | "HR_ADMIN"
  | "MANAGER"
  | "EMPLOYEE";

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}