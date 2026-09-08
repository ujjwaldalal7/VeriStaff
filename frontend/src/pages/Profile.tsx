import { useEffect, useState } from "react";
import type {
  ChangeEvent,
  FormEvent
} from "react";
import { Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import {
  getMyProfile,
  updateMyProfile
} from "../services/employeeApi";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { logout } from "../store/slices/authSlice";
import type { Employee } from "../types/employee";
import { getApiErrorMessage } from "../utils/apiError";
import { changePassword } from "../services/passwordApi";

interface ProfileForm {
  firstName: string;
  lastName: string;
  bankAccountNo: string;
  bankIfsc: string;
  panCard: string;
}

const toForm = (
  employee: Employee | null
): ProfileForm => ({
  firstName: employee?.firstName || "",
  lastName: employee?.lastName || "",
  bankAccountNo: employee?.bankAccountNo || "",
  bankIfsc: employee?.bankIfsc || "",
  panCard: employee?.panCard || ""
});

export default function Profile() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(
    (state) => state.auth.user
  );
  const tenant = useAppSelector(
    (state) => state.tenant.current
  );
  const [employee, setEmployee] =
    useState<Employee | null>(null);
  const [form, setForm] =
    useState<ProfileForm>(() => toForm(null));
  const [loading, setLoading] =
    useState(user?.role === "EMPLOYEE");
  const [saving, setSaving] = useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [message, setMessage] =
    useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.role !== "EMPLOYEE") {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getMyProfile();
        setEmployee(response.data);
        setForm(toForm(response.data));
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "Unable to load employee profile."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [user?.role]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setPasswordSaving(true);
      setError(null);
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Password changed. Please sign in again.");
      window.setTimeout(() => {
        dispatch(logout());
        navigate("/login", { replace: true });
      }, 700);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to change password."));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const response = await updateMyProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        bankAccountNo:
          form.bankAccountNo.trim() || null,
        bankIfsc:
          form.bankIfsc.trim().toUpperCase() || null,
        panCard:
          form.panCard.trim().toUpperCase() || null
      });
      setEmployee(response.data);
      setMessage("Profile updated.");
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to update profile."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {user?.email}
          </p>
          {user?.employeeStatus === "OFFBOARDED" && (
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
              Your employment has ended. You can continue accessing your profile, payslips and employment documents.
            </p>
          )}
        </div>

        {(error || message) && (
          <Card
            className={[
              "mb-6 p-4 text-sm",
              error
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
            ].join(" ")}
          >
            {error || message}
          </Card>
        )}

        {user?.role !== "EMPLOYEE" ? (
          <Card className="p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">
                  Role
                </dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                  {user?.role}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">
                  Tenant
                </dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                  {tenant?.name || "Workspace"}
                </dd>
              </div>
            </dl>
          </Card>
        ) : loading ? (
          <Card className="p-8 text-center text-sm text-slate-500">
            Loading profile...
          </Card>
        ) : (
          <Card className="p-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="firstName"
                  label="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="lastName"
                  label="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="bankAccountNo"
                  label="Bank Account Number"
                  value={form.bankAccountNo}
                  onChange={handleChange}
                />
                <Input
                  name="bankIfsc"
                  label="IFSC"
                  value={form.bankIfsc}
                  onChange={handleChange}
                />
                <Input
                  name="panCard"
                  label="PAN"
                  value={form.panCard}
                  onChange={handleChange}
                />
                <Input
                  label="Employee Code"
                  value={employee?.employeeCode || ""}
                  disabled
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </Card>
        )}

        <Card className="mt-6 p-6"><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Change Password</h2><form onSubmit={handlePasswordChange} className="mt-4 grid gap-4 sm:grid-cols-3"><Input label="Current Password" type="password" required value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /><Input label="New Password" type="password" minLength={8} required value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /><Input label="Confirm Password" type="password" minLength={8} required value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /><div className="sm:col-span-3"><Button type="submit" disabled={passwordSaving}>{passwordSaving ? "Changing..." : "Change Password"}</Button></div></form></Card>
      </div>
    </div>
  );
}
