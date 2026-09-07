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

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
                <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN"]}>
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
                <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN"]}>
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
                <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN"]}>
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
                <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"]}>
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
                <RoleRoute roles={["SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"]}>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
