import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Mail,
  UserRound,
  Send
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getEmployee } from "../services/employeeApi";
import { createOnboardingInvite } from "../services/onboardingApi";

import type {
  Employee
} from "../types/employee";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { getApiErrorMessage } from "../utils/apiError";

const statusVariant = (
  status: Employee["status"]
) => {
  switch (status) {
    case "ACTIVE":
      return "success" as const;

    case "ONBOARDING":
      return "info" as const;

    case "INVITED":
      return "warning" as const;

    case "RESIGNED":
      return "danger" as const;

    case "OFFBOARDED":
      return "neutral" as const;

    default:
      return "neutral" as const;
  }
};

const formatDate = (date: string | null) => {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
};

export default function EmployeeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] =
    useState<string | null>(null);
  const [inviteError, setInviteError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Employee ID is missing.");
      setLoading(false);
      return;
    }

    const fetchEmployee = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getEmployee(id);

        setEmployee(response.data);
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "Unable to load employee."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleInvite = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!employee) {
      return;
    }

    try {
      setInviteLoading(true);
      setInviteError(null);
      setInviteMessage(null);

      const response = await createOnboardingInvite({
        employeeId: employee.id,
        email: inviteEmail.trim().toLowerCase()
      });

      const inviteUrl = `${window.location.origin}/onboarding/${response.data.token}`;

      await navigator.clipboard.writeText(inviteUrl);
      setInviteMessage(
        "Onboarding link created and copied to clipboard."
      );
    } catch (err: unknown) {
      setInviteError(
        getApiErrorMessage(
          err,
          "Unable to create onboarding invite."
        )
      );
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading employee...
        </p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/employees")}
          >
            <ArrowLeft size={18} />
            Back to Employees
          </Button>

          <Card className="mt-6 border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
            <h2 className="font-semibold text-red-700 dark:text-red-400">
              Unable to load employee
            </h2>

            <p className="mt-2 text-sm text-red-600 dark:text-red-500">
              {error || "Employee not found."}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">

        {/* Back */}
        <Link
          to="/employees"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to Employees
        </Link>

        {/* Header */}
        <Card className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                <UserRound size={27} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {employee.firstName}{" "}
                  {employee.lastName}
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {employee.employeeCode}
                </p>
              </div>
            </div>

            <Badge
              variant={statusVariant(
                employee.status
              )}
            >
              {employee.status}
            </Badge>

            {!employee.userId && (
              <Button
                type="button"
                onClick={() => {
                  setInviteOpen(true);
                  setInviteEmail("");
                  setInviteError(null);
                  setInviteMessage(null);
                }}
              >
                <Send size={17} />
                Issue Invite
              </Button>
            )}
          </div>
        </Card>

        {/* Basic information */}
        <section className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Employee Information
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <UserRound
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Employee Code
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                    {employee.employeeCode}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <Mail
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Account
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-white">
                    {employee.user?.email ||
                      "No employee account yet"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <UserRound
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Department
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                    {employee.department}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <UserRound
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Designation
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                    {employee.designation}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Employment dates */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Employment Timeline
          </h2>

          <Card className="p-5">
            <div className="grid gap-6 sm:grid-cols-3">

              <div className="flex gap-3">
                <CalendarDays
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Joining Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(
                      employee.joiningDate
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CalendarDays
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Resignation Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(
                      employee.resignationDate
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CalendarDays
                  size={19}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Last Working Day
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(
                      employee.lastWorkingDay
                    )}
                  </p>
                </div>
              </div>

            </div>
          </Card>
        </section>

        {/* Salary */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Compensation
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Basic Salary
              </p>

              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                {formatCurrency(
                  employee.basicSalary
                )}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                HRA
              </p>

              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                {formatCurrency(employee.hra)}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Allowances
              </p>

              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                {formatCurrency(
                  employee.allowances
                )}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Deductions
              </p>

              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                {formatCurrency(
                  employee.deductions
                )}
              </p>
            </Card>
          </div>
        </section>

        {/* Sensitive information */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Additional Information
          </h2>

          <Card className="p-5">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Bank Account
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <CreditCard
                    size={17}
                    className="text-slate-400"
                  />

                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {employee.bankAccountNo ||
                      "Not provided"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  IFSC
                </p>

                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  {employee.bankIfsc ||
                    "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  PAN
                </p>

                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  {employee.panCard ||
                    "Not provided"}
                </p>
              </div>

            </div>
          </Card>
        </section>

      </div>

      <Modal
        open={inviteOpen}
        onClose={() => {
          if (!inviteLoading) {
            setInviteOpen(false);
          }
        }}
        title="Issue Onboarding Invite"
        description="Enter the employee email once to create a public onboarding link."
      >
        <form
          onSubmit={handleInvite}
          className="space-y-5"
        >
          {(inviteError || inviteMessage) && (
            <div
              className={[
                "rounded-lg border px-4 py-3 text-sm",
                inviteError
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
              ].join(" ")}
            >
              {inviteError || inviteMessage}
            </div>
          )}

          <Input
            label="Employee Email"
            type="email"
            value={inviteEmail}
            onChange={(event) =>
              setInviteEmail(event.target.value)
            }
            placeholder="employee@company.com"
            required
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setInviteOpen(false)}
              disabled={inviteLoading}
            >
              Close
            </Button>
            <Button
              type="submit"
              disabled={inviteLoading}
            >
              <Send size={17} />
              {inviteLoading
                ? "Creating..."
                : "Create Invite"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
