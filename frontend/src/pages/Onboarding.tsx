import { useEffect, useState } from "react";
import type {
  ChangeEvent,
  FormEvent
} from "react";
import { CheckCircle2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import {
  completeOnboarding,
  validateOnboardingInvite
} from "../services/onboardingApi";
import type { AuthTenant } from "../types/auth";
import { getApiErrorMessage } from "../utils/apiError";

interface OnboardingForm {
  firstName: string;
  lastName: string;
  bankAccountNo: string;
  bankIfsc: string;
  panCard: string;
  password: string;
  confirmPassword: string;
}

const initialForm: OnboardingForm = {
  firstName: "",
  lastName: "",
  bankAccountNo: "",
  bankIfsc: "",
  panCard: "",
  password: "",
  confirmPassword: ""
};

export default function Onboarding() {
  const { token } = useParams<{ token: string }>();
  const [tenant, setTenant] =
    useState<AuthTenant | null>(null);
  const [email, setEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [form, setForm] =
    useState<OnboardingForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setError("Onboarding token is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response =
          await validateOnboardingInvite(token);
        setTenant(response.data.tenant);
        setEmail(response.data.email);
        setExpiresAt(response.data.expiresAt);
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "Invitation is invalid or expired."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    void validate();
  }, [token]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await completeOnboarding(token, {
        ...form,
        bankIfsc: form.bankIfsc.toUpperCase(),
        panCard: form.panCard.toUpperCase()
      });

      setCompleted(true);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to complete onboarding."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950"
      style={{
        borderTop:
          "4px solid " +
          (tenant?.primaryColor || "#1E40AF")
      }}
    >
      <div className="mx-auto max-w-3xl">
        <Card className="p-6 sm:p-8">
          {tenant && (
            <div className="mb-6 flex items-center gap-3">
              {tenant.logoUrl && (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="h-12 max-w-32 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {tenant.name}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Employee onboarding
                </p>
              </div>
            </div>
          )}

          {loading && (
            <p className="text-sm text-slate-500">
              Validating invitation...
            </p>
          )}

          {!loading && error && !tenant && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {completed && (
            <div className="text-center">
              <CheckCircle2
                size={44}
                className="mx-auto text-emerald-500"
              />
              <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                Onboarding completed
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Your employee account is active. You can now
                sign in with your email and password.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Go to Login
              </Link>
            </div>
          )}

          {!loading && tenant && !completed && (
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Invitation for <strong>{email}</strong>
                {expiresAt &&
                  `, expires ${new Date(
                    expiresAt
                  ).toLocaleString("en-IN")}`}
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}

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
                  required
                />
                <Input
                  name="bankIfsc"
                  label="IFSC"
                  value={form.bankIfsc}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="panCard"
                  label="PAN"
                  value={form.panCard}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="password"
                  type="password"
                  label="Password"
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <div className="sm:col-span-2">
                  <Input
                    name="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    minLength={8}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Completing..."
                  : "Complete Onboarding"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
