import api from "./api";
import type {
  LoginRequest,
  LoginResponse
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

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};