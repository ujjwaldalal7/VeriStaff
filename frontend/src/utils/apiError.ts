import { isAxiosError } from "axios";

export const getApiErrorMessage = (
  error: unknown,
  fallback: string
) => {
  if (
    isAxiosError<{
      message?: string;
    }>(error)
  ) {
    return error.response?.data?.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
