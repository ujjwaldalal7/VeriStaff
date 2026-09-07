import api from "./api";
import type {
  TenantBranding,
  TenantResponse
} from "../types/tenant";

export const getTenant = async () => {
  const response = await api.get<TenantResponse>(
    "/tenants/me"
  );

  return response.data;
};

export const updateTenantBranding = async (
  data: Partial<TenantBranding>
) => {
  const response = await api.patch(
    "/tenants/me",
    data
  );

  return response.data;
};

export const uploadBrandingAsset = async (
  assetType: "logo" | "watermark" | "signature",
  file: File
) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    `/tenants/me/branding/${assetType}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );

  return response.data;
};
