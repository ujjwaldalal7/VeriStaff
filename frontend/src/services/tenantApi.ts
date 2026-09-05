import api from "./api";

export interface TenantBranding {
  id: string;
  name: string;
  domain: string;
  logoUrl: string | null;
  watermarkUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  footerAddress: string;
  authorizedSignUrl: string | null;
}

export const getTenant = async () => {
  const response = await api.get<{
    success: boolean;
    data: TenantBranding;
  }>("/tenant/me");

  return response.data;
};

export const updateTenantBranding = async (
  data: Partial<TenantBranding>
) => {
  const response = await api.patch(
    "/tenant/me",
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
    `/tenant/me/branding/${assetType}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );

  return response.data;
};