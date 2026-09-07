import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/slices/authSlice";
import themeReducer from "../store/slices/themeSlice";
import employeeReducer from "../store/slices/employeeSlice";
import tenantReducer from "../store/slices/tenantSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    theme: themeReducer,
    employees: employeeReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
