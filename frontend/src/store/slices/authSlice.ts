import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import type {
  AuthResponseData,
  AuthUser,
  LoginRequest,
  RegisterOrganizationRequest
} from "../../types/auth";
import {
  loginUser,
  registerOrganization
} from "../../services/authApi";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const storedToken = localStorage.getItem("veristaff_token");
const storedUser = localStorage.getItem("veristaff_user");

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
  loading: false,
  error: null
};

const getErrorMessage = (
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

  return fallback;
};

const normalizeAuthData = (
  data: AuthResponseData
): AuthResponseData => ({
  ...data,
  user: {
    ...data.user,
    tenantId:
      data.user.tenantId ||
      data.tenant?.id ||
      ""
  }
});

export const login = createAsyncThunk<
  AuthResponseData,
  LoginRequest,
  { rejectValue: string }
>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginUser(credentials);

      return normalizeAuthData(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Unable to login. Please check your credentials."
        )
      );
    }
  }
);

export const register = createAsyncThunk<
  AuthResponseData,
  RegisterOrganizationRequest,
  { rejectValue: string }
>(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const response =
        await registerOrganization(payload);

      return normalizeAuthData(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Unable to register organization."
        )
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem("veristaff_token");
      localStorage.removeItem("veristaff_user");
    },

    clearAuthError: (state) => {
      state.error = null;
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;

        localStorage.setItem(
          "veristaff_token",
          action.payload.accessToken
        );

        localStorage.setItem(
          "veristaff_user",
          JSON.stringify(action.payload.user)
        );
      })

      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unable to login";
      })

      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;

        localStorage.setItem(
          "veristaff_token",
          action.payload.accessToken
        );

        localStorage.setItem(
          "veristaff_user",
          JSON.stringify(action.payload.user)
        );
      })

      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          "Unable to register organization";
      });
  }
});

export const {
  logout,
  clearAuthError
} = authSlice.actions;

export default authSlice.reducer;
