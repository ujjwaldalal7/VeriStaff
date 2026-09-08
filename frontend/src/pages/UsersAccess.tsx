import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Plus, RefreshCw, UserCheck, UserX } from "lucide-react";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import { getEmployees } from "../services/employeeApi";
import {
  assignManagerEmployee,
  createUser,
  getUsers,
  resetUserPassword,
  unassignManagerEmployee,
  updateUserRole,
  updateUserStatus,
  type TenantUser
} from "../services/userApi";
import type { Employee } from "../types/employee";
import { getApiErrorMessage } from "../utils/apiError";

interface NewUserForm {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: "HR_ADMIN" | "MANAGER";
  employeeCode: string;
  department: string;
  designation: string;
  joiningDate: string;
}

const emptyUserForm: NewUserForm = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  role: "HR_ADMIN",
  employeeCode: "",
  department: "",
  designation: "",
  joiningDate: ""
};

export default function UsersAccess() {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<TenantUser | null>(null);
  const [teamManager, setTeamManager] = useState<TenantUser | null>(null);
  const [teamSelection, setTeamSelection] = useState<string[]>([]);
  const [teamSearch, setTeamSearch] = useState("");
  const [form, setForm] = useState<NewUserForm>(emptyUserForm);
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [userResponse, employeeResponse] = await Promise.all([
        getUsers({ limit: 100 }),
        getEmployees({ limit: 100 })
      ]);
      setUsers(userResponse.data);
      setEmployees(employeeResponse.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to load users."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setWorking("create");
      setError(null);
      await createUser(form);
      setMessage("User and linked employee created successfully.");
      setCreateOpen(false);
      setForm(emptyUserForm);
      await loadUsers();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to create user."));
    } finally {
      setWorking(null);
    }
  };

  const toggleStatus = async (user: TenantUser) => {
    try {
      setWorking(user.id);
      setError(null);
      await updateUserStatus(user.id, !user.isActive);
      setMessage(user.isActive ? "User disabled." : "User enabled.");
      await loadUsers();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to update user status."));
    } finally {
      setWorking(null);
    }
  };

  const changeRole = async (user: TenantUser, role: "HR_ADMIN" | "MANAGER" | "EMPLOYEE") => {
    try {
      setWorking(user.id);
      await updateUserRole(user.id, role);
      setMessage("Role updated.");
      await loadUsers();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to update role."));
    } finally {
      setWorking(null);
    }
  };

  const openTeam = (manager: TenantUser) => {
    setTeamManager(manager);
    setTeamSelection(manager.managedEmployees?.map((item) => item.employeeId) || []);
    setTeamSearch("");
  };

  const saveTeam = async () => {
    if (!teamManager) return;
    try {
      setWorking(teamManager.id);
      const existing = teamManager.managedEmployees?.map((item) => item.employeeId) || [];
      await Promise.all(
        teamSelection.filter((id) => !existing.includes(id)).map((id) => assignManagerEmployee(teamManager.id, id))
      );
      await Promise.all(
        existing.filter((id) => !teamSelection.includes(id)).map((id) => unassignManagerEmployee(teamManager.id, id))
      );
      setMessage("Manager team updated.");
      setTeamManager(null);
      await loadUsers();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to update manager team."));
    } finally {
      setWorking(null);
    }
  };

  const submitReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!resetUser) return;
    try {
      setWorking(resetUser.id);
      await resetUserPassword(resetUser.id, resetForm.password, resetForm.confirmPassword);
      setMessage("Password reset successfully.");
      setResetUser(null);
      setResetForm({ password: "", confirmPassword: "" });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to reset password."));
    } finally {
      setWorking(null);
    }
  };

  const filteredEmployees = employees.filter((employee) =>
    `${employee.firstName} ${employee.lastName} ${employee.employeeCode}`
      .toLowerCase()
      .includes(teamSearch.toLowerCase())
  );

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users & Access</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage tenant accounts, linked employee profiles, and manager teams.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void loadUsers()} disabled={loading}><RefreshCw size={16} />Refresh</Button>
            <Button onClick={() => setCreateOpen(true)}><Plus size={16} />Add User</Button>
          </div>
        </div>

        {(error || message) && <Card className={`mb-6 p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || message}</Card>}

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>{["Name", "Email", "Employee", "Role", "Status", "Created", "Actions"].map((heading) => <th key={heading} className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">Loading users...</td></tr>}
                {!loading && users.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">No users found.</td></tr>}
                {users.map((user) => <tr key={user.id}>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">{user.firstName || user.employee?.firstName || ""} {user.lastName || user.employee?.lastName || ""}</td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{user.employee ? `${user.employee.employeeCode} · ${user.employee.firstName} ${user.employee.lastName}` : "Standalone account"}</td>
                  <td className="px-5 py-4"><Select aria-label="Role" value={user.role} disabled={user.role === "SUPER_ADMIN" || working === user.id} onChange={(event) => void changeRole(user, event.target.value as "HR_ADMIN" | "MANAGER" | "EMPLOYEE")}><option value="SUPER_ADMIN">SUPER_ADMIN</option><option value="HR_ADMIN">HR_ADMIN</option><option value="MANAGER">MANAGER</option><option value="EMPLOYEE">EMPLOYEE</option></Select></td>
                  <td className="px-5 py-4"><Badge variant={user.isActive ? "success" : "danger"}>{user.isActive ? "ACTIVE" : "DISABLED"}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{new Date(user.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-5 py-4"><div className="flex gap-2">{user.role !== "SUPER_ADMIN" && <><Button size="sm" variant="secondary" onClick={() => void toggleStatus(user)} disabled={working === user.id}>{user.isActive ? <UserX size={15} /> : <UserCheck size={15} />}{user.isActive ? "Disable" : "Enable"}</Button><Button size="sm" variant="secondary" onClick={() => setResetUser(user)}><KeyRound size={15} />Reset</Button>{user.role === "MANAGER" && <Button size="sm" variant="secondary" onClick={() => openTeam(user)}><UserCheck size={15} />Manage Team</Button>}</>}</div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal open={createOpen} onClose={() => !working && setCreateOpen(false)} title="Add User and Employee">
          <form onSubmit={submitCreate} className="grid gap-4 sm:grid-cols-2">
            <Input label="First Name" required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
            <Input label="Last Name" required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
            <Input label="Email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <Input label="Employee Code" required value={form.employeeCode} onChange={(event) => setForm({ ...form, employeeCode: event.target.value })} />
            <Input label="Department" required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
            <Input label="Designation" required value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} />
            <Input label="Joining Date" type="date" required value={form.joiningDate} onChange={(event) => setForm({ ...form, joiningDate: event.target.value })} />
            <Select label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as "HR_ADMIN" | "MANAGER" })}><option value="HR_ADMIN">HR Admin</option><option value="MANAGER">Manager</option></Select>
            <Input label="Temporary Password" type="password" minLength={8} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <div className="flex justify-end sm:col-span-2"><Button type="submit" disabled={working === "create"}>{working === "create" ? "Creating..." : "Create User"}</Button></div>
          </form>
        </Modal>

        <Modal open={Boolean(teamManager)} onClose={() => !working && setTeamManager(null)} title={`Manage Team${teamManager ? ` - ${teamManager.firstName || teamManager.email}` : ""}`}>
          <div className="space-y-4">
            <Input label="Search employees" value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} placeholder="Search by name or employee code" />
            <div className="max-h-72 space-y-2 overflow-y-auto">{filteredEmployees.map((employee) => <label key={employee.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"><input type="checkbox" checked={teamSelection.includes(employee.id)} onChange={(event) => setTeamSelection((current) => event.target.checked ? [...current, employee.id] : current.filter((id) => id !== employee.id))} /><span className="text-sm text-slate-700 dark:text-slate-200">{employee.firstName} {employee.lastName} <span className="text-slate-400">({employee.employeeCode})</span></span></label>)}</div>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setTeamManager(null)}>Cancel</Button><Button onClick={() => void saveTeam()} disabled={Boolean(working)}>{working ? "Saving..." : "Save Team"}</Button></div>
          </div>
        </Modal>

        <Modal open={Boolean(resetUser)} onClose={() => !working && setResetUser(null)} title="Reset Password">
          <form onSubmit={submitReset} className="space-y-4"><Input label="New Password" type="password" minLength={8} required value={resetForm.password} onChange={(event) => setResetForm({ ...resetForm, password: event.target.value })} /><Input label="Confirm Password" type="password" minLength={8} required value={resetForm.confirmPassword} onChange={(event) => setResetForm({ ...resetForm, confirmPassword: event.target.value })} /><div className="flex justify-end"><Button type="submit" disabled={Boolean(working)}>{working ? "Resetting..." : "Reset Password"}</Button></div></form>
        </Modal>
      </div>
    </div>
  );
}
