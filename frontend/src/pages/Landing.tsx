import {
  ArrowRight,
  Building2,
  FileCheck2,
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";

import Logo from "../components/ui/Logo";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo
          variant="full"
          size="sm"
          linkTo="/"
        />

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Register
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 px-5 pb-10 pt-4 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-300">
            Multi-tenant HR operations
          </p>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            VeriStaff
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Register your organization, invite employees,
            manage HR records, and issue verifiable documents
            with tenant-specific branding from the first login.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              Register Organization
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Login
            </Link>
          </div>
        </section>

        <section className="grid gap-4">
          {[
            {
              icon: Building2,
              title: "Organization first",
              text: "Create a tenant and initial super admin before any employee workflow."
            },
            {
              icon: ShieldCheck,
              title: "Strict tenant context",
              text: "Authenticated sessions load the company profile used across the app shell."
            },
            {
              icon: FileCheck2,
              title: "Branded operations",
              text: "Logos, colors, and document settings follow the authenticated tenant."
            }
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-lg border border-slate-800 bg-slate-900/70 p-5"
              >
                <Icon className="text-blue-300" size={24} />

                <h2 className="mt-4 text-lg font-semibold">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.text}
                </p>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
