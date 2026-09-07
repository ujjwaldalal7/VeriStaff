import api from "./api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterOrganizationRequest,
  RegisterOrganizationResponse
} from "../types/auth";

export const loginUser = async (
  credentials: LoginRequest
) => {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    credentials
  );

  return response.data;
};

export const registerOrganization = async (
  payload: RegisterOrganizationRequest
) => {
  const response =
    await api.post<RegisterOrganizationResponse>(
      "/auth/register-tenant",
      payload
    );

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};
