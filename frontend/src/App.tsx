import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import Login from "./pages/Login";
import Landing from "./pages/Landing";
import RegisterOrganization from "./pages/RegisterOrganization";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppShell from "./layouts/AppShell";
import Employees from "./pages/Employees";
import EmployeeDetails from "./pages/EmployeeDetails";
import Documents from "./pages/Documents";
import Payslips from "./pages/Payslips";
import Clearances from "./pages/Clearances";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import VerifyDocument from "./pages/VerifyDocument";
import RoleRoute from "./components/auth/RoleRoute";
import UsersAccess from "./pages/UsersAccess";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./hooks/redux";
import { validateSession } from "./store/slices/authSlice";

function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const loading = useAppSelector((state) => state.auth.loading);

  useEffect(() => {
    if (token) void dispatch(validateSession());
  }, [dispatch, token]);

  return (
    <BrowserRouter>
      {loading && token ? <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Checking session...</div> : <Routes>
        {/* Public */}
        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/register"
          element={<RegisterOrganization />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/onboarding/:token"
          element={<Onboarding />}
        />

        <Route
          path="/verify-doc/:hash"
          element={<VerifyDocument />}
        />

        {/* Protected application */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell>
                  <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                </RoleRoute>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                  <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                  <Dashboard />
                </RoleRoute>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <AppShell>
                  <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]}>
                  <Employees />
                </RoleRoute>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                  <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"]}>
                  <EmployeeDetails />
                </RoleRoute>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <AppShell>
                  <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"]}>
                  <Documents />
                </RoleRoute>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payslips"
          element={
            <ProtectedRoute>
              <AppShell>
                <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"]}>
                  <Payslips />
                </RoleRoute>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clearances"
          element={
            <ProtectedRoute>
              <AppShell>
                <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN"]}>
                  <Clearances />
                </RoleRoute>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AppShell>
                <RoleRoute roles={["SUPER_ADMIN"]}>
                  <UsersAccess />
                </RoleRoute>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AppShell>
                <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN"]}>
                  <AuditLogs />
                </RoleRoute>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppShell>
                <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN"]}>
                  <Settings />
                </RoleRoute>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <Profile />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>}
    </BrowserRouter>
  );
}

export default App;
