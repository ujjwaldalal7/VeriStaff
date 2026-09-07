import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Plus, RefreshCw, UserCheck, UserX } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import { createUser, getUsers, resetUserPassword, updateUserRole, updateUserStatus, type TenantUser } from "../services/userApi";
import { getApiErrorMessage } from "../utils/apiError";

export default function UsersAccess() {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<TenantUser | null>(null);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", password: "", role: "HR_ADMIN" as "HR_ADMIN" | "MANAGER" });
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });

  const loadUsers = async () => {
    try { setLoading(true); setError(null); const response = await getUsers({ limit: 100 }); setUsers(response.data); }
    catch (err: unknown) { setError(getApiErrorMessage(err, "Unable to load users.")); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadUsers(); }, []);

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    try { setWorking("create"); setError(null); await createUser(form); setMessage("User created successfully."); setCreateOpen(false); setForm({ email: "", firstName: "", lastName: "", password: "", role: "HR_ADMIN" }); await loadUsers(); }
    catch (err: unknown) { setError(getApiErrorMessage(err, "Unable to create user.")); }
    finally { setWorking(null); }
  };

  const toggleStatus = async (user: TenantUser) => {
    try { setWorking(user.id); setError(null); await updateUserStatus(user.id, !user.isActive); setMessage(user.isActive ? "User disabled." : "User enabled."); await loadUsers(); }
    catch (err: unknown) { setError(getApiErrorMessage(err, "Unable to update user status.")); }
    finally { setWorking(null); }
  };

  const changeRole = async (user: TenantUser, role: "HR_ADMIN" | "MANAGER" | "EMPLOYEE") => {
    try { setWorking(user.id); await updateUserRole(user.id, role); setMessage("Role updated."); await loadUsers(); }
    catch (err: unknown) { setError(getApiErrorMessage(err, "Unable to update role.")); }
    finally { setWorking(null); }
  };

  const submitReset = async (event: FormEvent) => {
    event.preventDefault(); if (!resetUser) return;
    try { setWorking(resetUser.id); await resetUserPassword(resetUser.id, resetForm.password, resetForm.confirmPassword); setMessage("Password reset successfully."); setResetUser(null); setResetForm({ password: "", confirmPassword: "" }); }
    catch (err: unknown) { setError(getApiErrorMessage(err, "Unable to reset password.")); }
    finally { setWorking(null); }
  };

  return <div className="min-h-full bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <div className="mb-6 flex items-end justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users & Access</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage tenant administrators and managers.</p></div><div className="flex gap-2"><Button variant="secondary" onClick={loadUsers} disabled={loading}><RefreshCw size={16} />Refresh</Button><Button onClick={() => setCreateOpen(true)}><Plus size={16} />Add User</Button></div></div>
    {(error || message) && <Card className={`mb-6 p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || message}</Card>}
    <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"><tr>{["Name", "Email", "Role", "Status", "Created", "Actions"].map((heading) => <th key={heading} className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{loading && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">Loading users...</td></tr>}{!loading && users.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">No users found.</td></tr>}{users.map((user) => <tr key={user.id}><td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">{user.firstName || user.employee?.firstName || ""} {user.lastName || user.employee?.lastName || ""}</td><td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{user.email}</td><td className="px-5 py-4"><Select aria-label="Role" value={user.role} disabled={user.role === "SUPER_ADMIN" || working === user.id} onChange={(event) => void changeRole(user, event.target.value as "HR_ADMIN" | "MANAGER" | "EMPLOYEE")}><option value="SUPER_ADMIN">SUPER_ADMIN</option><option value="HR_ADMIN">HR_ADMIN</option><option value="MANAGER">MANAGER</option><option value="EMPLOYEE">EMPLOYEE</option></Select></td><td className="px-5 py-4"><Badge variant={user.isActive ? "success" : "danger"}>{user.isActive ? "ACTIVE" : "DISABLED"}</Badge></td><td className="px-5 py-4 text-sm text-slate-600">{new Date(user.createdAt).toLocaleDateString("en-IN")}</td><td className="px-5 py-4"><div className="flex gap-2">{user.role !== "SUPER_ADMIN" && <><Button size="sm" variant="secondary" onClick={() => void toggleStatus(user)} disabled={working === user.id}>{user.isActive ? <UserX size={15} /> : <UserCheck size={15} />}{user.isActive ? "Disable" : "Enable"}</Button><Button size="sm" variant="secondary" onClick={() => setResetUser(user)}><KeyRound size={15} />Reset</Button></>}</div></td></tr>)}</tbody></table></div></Card>
    <Modal open={createOpen} onClose={() => !working && setCreateOpen(false)} title="Add User"><form onSubmit={submitCreate} className="space-y-4"><Input label="First Name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /><Input label="Last Name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /><Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "HR_ADMIN" | "MANAGER" })}><option value="HR_ADMIN">HR Admin</option><option value="MANAGER">Manager</option></Select><Input label="Temporary Password" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><div className="flex justify-end"><Button type="submit" disabled={working === "create"}>{working === "create" ? "Creating..." : "Create User"}</Button></div></form></Modal>
    <Modal open={Boolean(resetUser)} onClose={() => !working && setResetUser(null)} title="Reset Password"><form onSubmit={submitReset} className="space-y-4"><Input label="New Password" type="password" minLength={8} required value={resetForm.password} onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })} /><Input label="Confirm Password" type="password" minLength={8} required value={resetForm.confirmPassword} onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })} /><div className="flex justify-end"><Button type="submit" disabled={Boolean(working)}>{working ? "Resetting..." : "Reset Password"}</Button></div></form></Modal>
  </div></div>;
}
