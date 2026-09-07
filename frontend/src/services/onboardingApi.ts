import api from "./api";
import type { AuthTenant } from "../types/auth";

export interface OnboardingInviteResponse {
  success: boolean;
  message: string;
  data: {
    inviteId: string;
    token: string;
    expiresAt: string;
  };
}

export interface OnboardingValidationResponse {
  success: boolean;
  data: {
    email: string;
    tenant: AuthTenant;
    expiresAt: string;
  };
}

export interface CompleteOnboardingRequest {
  firstName: string;
  lastName: string;
  bankAccountNo: string;
  bankIfsc: string;
  panCard: string;
  password: string;
  confirmPassword: string;
}

export const createOnboardingInvite = async (
  data: {
    employeeId: string;
    email: string;
    expiresInHours?: number;
  }
) => {
  const response =
    await api.post<OnboardingInviteResponse>(
      "/onboarding/invite",
      data
    );

  return response.data;
};

export const validateOnboardingInvite = async (
  token: string
) => {
  const response =
    await api.post<OnboardingValidationResponse>(
      `/onboarding/validate/${token}`
    );

  return response.data;
};

export const completeOnboarding = async (
  token: string,
  data: CompleteOnboardingRequest
) => {
  const response = await api.post(
    `/onboarding/complete/${token}`,
    data
  );

  return response.data;
};
