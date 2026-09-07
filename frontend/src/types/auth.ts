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

export interface AuthTenant {
  id: string;
  name: string;
  domain?: string;
  logoUrl?: string | null;
  watermarkUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  footerAddress?: string;
  authorizedSignUrl?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterOrganizationRequest {
  organizationName: string;
  domain: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponseData {
  accessToken: string;
  user: AuthUser;
  tenant?: AuthTenant;
}

export interface LoginResponse {
  success: boolean;
  data: AuthResponseData;
}

export type RegisterOrganizationResponse = LoginResponse;
