export interface DashboardStats {
  employees: {
    total: number;
    invited: number;
    onboarding: number;
    active: number;
    resigned: number;
    offboarded: number;
  };

  documents: {
    total: number;
    valid: number;
    revoked: number;
  };

  clearances: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardStats;
}