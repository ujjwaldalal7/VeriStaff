import {
  createAsyncThunk,
  createSlice,
  type PayloadAction
} from "@reduxjs/toolkit";
import { isAxiosError } from "axios";

import { login, logout, register } from "./authSlice";
import { getTenant } from "../../services/tenantApi";
import type { AuthTenant } from "../../types/auth";
import type { TenantBranding } from "../../types/tenant";

interface TenantState {
  current: TenantBranding | null;
  loading: boolean;
  error: string | null;
}

const defaultPrimaryColor = "#1E40AF";
const defaultSecondaryColor = "#3B82F6";

const storedTenant = localStorage.getItem(
  "veristaff_tenant"
);

const toTenantBranding = (
  tenant: AuthTenant | TenantBranding
): TenantBranding => ({
  id: tenant.id,
  name: tenant.name,
  domain: tenant.domain,
  logoUrl: tenant.logoUrl ?? null,
  watermarkUrl: tenant.watermarkUrl ?? null,
  primaryColor:
    tenant.primaryColor || defaultPrimaryColor,
  secondaryColor:
    tenant.secondaryColor || defaultSecondaryColor,
  footerAddress: tenant.footerAddress ?? "",
  authorizedSignUrl:
    tenant.authorizedSignUrl ?? null
});

const persistTenant = (
  tenant: TenantBranding | null
) => {
  if (tenant) {
    localStorage.setItem(
      "veristaff_tenant",
      JSON.stringify(tenant)
    );

    return;
  }

  localStorage.removeItem("veristaff_tenant");
};

const initialState: TenantState = {
  current: storedTenant
    ? JSON.parse(storedTenant)
    : null,
  loading: false,
  error: null
};

export const fetchTenant = createAsyncThunk<
  TenantBranding,
  void,
  { rejectValue: string }
>(
  "tenant/fetchCurrent",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getTenant();

      return toTenantBranding(response.data);
    } catch (error: unknown) {
      if (
        isAxiosError<{
          message?: string;
        }>(error)
      ) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Unable to load tenant configuration."
        );
      }

      return rejectWithValue(
        "Unable to load tenant configuration."
      );
    }
  }
);

const tenantSlice = createSlice({
  name: "tenant",
  initialState,
  reducers: {
    setTenant: (
      state,
      action: PayloadAction<TenantBranding>
    ) => {
      state.current = action.payload;
      state.error = null;
      persistTenant(action.payload);
    },
    clearTenant: (state) => {
      state.current = null;
      state.error = null;
      persistTenant(null);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
        state.error = null;
        persistTenant(action.payload);
      })
      .addCase(fetchTenant.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          "Unable to load tenant configuration.";
      })
      .addCase(login.fulfilled, (state, action) => {
        if (action.payload.tenant) {
          state.current = toTenantBranding(
            action.payload.tenant
          );
          state.error = null;
          persistTenant(state.current);
        }
      })
      .addCase(register.fulfilled, (state, action) => {
        if (action.payload.tenant) {
          state.current = toTenantBranding(
            action.payload.tenant
          );
          state.error = null;
          persistTenant(state.current);
        }
      })
      .addCase(logout, (state) => {
        state.current = null;
        state.error = null;
        persistTenant(null);
      });
  }
});

export const {
  setTenant,
  clearTenant
} = tenantSlice.actions;

export default tenantSlice.reducer;
