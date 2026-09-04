import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  AuthUser,
  LoginRequest,
  LoginResponse
} from "../../types/auth";
import api from "../../services/api";

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

export const login = createAsyncThunk<
  LoginResponse["data"],
  LoginRequest,
  { rejectValue: string }
>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post<LoginResponse>(
        "/auth/login",
        credentials
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Unable to login. Please check your credentials."
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
      });
  }
});

export const {
  logout,
  clearAuthError
} = authSlice.actions;

export default authSlice.reducer;