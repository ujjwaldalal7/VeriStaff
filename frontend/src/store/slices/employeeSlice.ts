import {
  createAsyncThunk,
  createSlice,
  type PayloadAction
} from "@reduxjs/toolkit";

import api from "../../services/api";
import type {
  Employee,
  EmployeeListResponse,
  EmployeeListParams,
  EmployeeStatus
} from "../../types/employee";

interface EmployeeState {
  employees: Employee[];

  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  search: string;
  status: EmployeeStatus | "";
  department: string;

  loading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  employees: [],

  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,

  search: "",
  status: "",
  department: "",

  loading: false,
  error: null
};

export const fetchEmployees = createAsyncThunk<
  EmployeeListResponse,
  EmployeeListParams | undefined,
  { rejectValue: string }
>(
  "employees/fetchEmployees",
  async (params, { rejectWithValue }) => {
    try {
      const response =
        await api.get<EmployeeListResponse>(
          "/employees",
          {
            params
          }
        );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Unable to load employees."
      );
    }
  }
);

const employeeSlice = createSlice({
  name: "employees",

  initialState,

  reducers: {
    setSearch: (
      state,
      action: PayloadAction<string>
    ) => {
      state.search = action.payload;
    },

    setStatus: (
      state,
      action: PayloadAction<EmployeeStatus | "">
    ) => {
      state.status = action.payload;
    },

    setDepartment: (
      state,
      action: PayloadAction<string>
    ) => {
      state.department = action.payload;
    },

    setPage: (
      state,
      action: PayloadAction<number>
    ) => {
      state.page = action.payload;
    },

    clearEmployeeError: (state) => {
      state.error = null;
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        fetchEmployees.fulfilled,
        (state, action) => {
          state.loading = false;

          state.employees =
            action.payload.data;

          state.page =
            action.payload.pagination.page;

          state.limit =
            action.payload.pagination.limit;

          state.total =
            action.payload.pagination.total;

          state.totalPages =
            action.payload.pagination.totalPages;

          state.hasNextPage =
            action.payload.pagination.hasNextPage;

          state.hasPreviousPage =
            action.payload.pagination.hasPreviousPage;
        }
      )

      .addCase(
        fetchEmployees.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Unable to load employees.";
        }
      );
  }
});

export const {
  setSearch,
  setStatus,
  setDepartment,
  setPage,
  clearEmployeeError
} = employeeSlice.actions;

export default employeeSlice.reducer;