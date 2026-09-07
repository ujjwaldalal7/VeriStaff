import api from "./api";

export const changePassword = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
  const response = await api.patch("/password/change", data);
  return response.data;
};
