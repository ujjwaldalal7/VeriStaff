import { useState } from "react";
import type {
  ChangeEvent,
  FormEvent
} from "react";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  useAppDispatch,
  useAppSelector
} from "../hooks/redux";
import { register } from "../store/slices/authSlice";
import { fetchTenant } from "../store/slices/tenantSlice";

interface RegisterForm {
  organizationName: string;
  domain: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const initialForm: RegisterForm = {
  organizationName: "",
  domain: "",
  email: "",
  password: "",
  firstName: "",
  lastName: ""
};

const normalizeDomain = (value: string) =>
  value.trim().toLowerCase();

export default function RegisterOrganization() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { loading, error } = useAppSelector(
    (state) => state.auth
  );

  const [form, setForm] =
    useState<RegisterForm>(initialForm);
  const [formError, setFormError] =
    useState<string | null>(null);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const validate = () => {
    if (
      !form.organizationName.trim() ||
      !form.domain.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      return "Please complete all fields.";
    }

    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (
      !/^[a-z0-9.-]+$/.test(
        normalizeDomain(form.domain)
      )
    ) {
      return "Domain can contain lowercase letters, numbers, dots, and hyphens.";
    }

    return null;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const validationError = validate();
    setFormError(validationError);

    if (validationError) {
      return;
    }

    const result = await dispatch(
      register({
        organizationName:
          form.organizationName.trim(),
        domain: normalizeDomain(form.domain),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim()
      })
    );

    if (register.fulfilled.match(result)) {
      await dispatch(fetchTenant());
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <Logo
            variant="full"
            size="sm"
            linkTo="/"
          />

          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Login
          </Link>
        </header>

        <main className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="pt-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">
              Register organization
            </p>

            <h1 className="mt-4 max-w-xl text-3xl font-bold leading-tight sm:text-5xl">
              Create your tenant and first super admin.
            </h1>

            <p className="mt-5 max-w-lg leading-7 text-slate-300">
              This starts the company workspace used for
              branding, employees, onboarding invitations,
              documents, and future clearance workflows.
            </p>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    id="organizationName"
                    name="organizationName"
                    label="Organization Name"
                    value={form.organizationName}
                    onChange={handleChange}
                    placeholder="Acme Operations Pvt Ltd"
                    required
                  />
                </div>

                <Input
                  id="domain"
                  name="domain"
                  label="Domain"
                  value={form.domain}
                  onChange={handleChange}
                  placeholder="acme.com"
                  required
                />

                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Admin Email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@acme.com"
                  required
                />

                <Input
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Aarav"
                  required
                />

                <Input
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Mehta"
                  required
                />

                <div className="sm:col-span-2">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {(formError || error) && (
                <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                  {formError || error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full"
              >
                {loading
                  ? "Creating workspace..."
                  : "Create Organization"}
                <ArrowRight size={18} />
              </Button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
