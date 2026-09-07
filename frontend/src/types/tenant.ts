export interface TenantBranding {
  id: string;
  name: string;
  domain?: string;
  logoUrl: string | null;
  watermarkUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  footerAddress: string;
  authorizedSignUrl: string | null;
}

export interface TenantResponse {
  success: boolean;
  data: TenantBranding;
}
