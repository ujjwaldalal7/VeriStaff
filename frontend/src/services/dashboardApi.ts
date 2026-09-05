import api from "./api";
import type {
  DashboardResponse
} from "../types/dashboard";

export const getDashboardStats = async () => {
  const response =
    await api.get<DashboardResponse>(
      "/dashboard/stats"
    );

  return response.data;
};