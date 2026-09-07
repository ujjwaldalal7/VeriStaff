import {
  AlertCircle,
  ClipboardCheck,
  FileText,
  RefreshCw,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";

import { useAppSelector } from "../hooks/redux";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getDashboardStats } from "../services/dashboardApi";
import type { DashboardStats } from "../types/dashboard";
import { getApiErrorMessage } from "../utils/apiError";

const StatCard = ({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) => (
  <Card className="p-5">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {label}
        </p>

        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>

      <div
        className="flex h-11 w-11 items-center justify-center rounded-lg text-white"
        style={{
          backgroundColor:
            "var(--tenant-primary-color)"
        }}
      >
        <Icon size={21} />
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const user = useAppSelector(
    (state) => state.auth.user
  );
  const tenant = useAppSelector(
    (state) => state.tenant.current
  );

  const [stats, setStats] =
    useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getDashboardStats();
      setStats(response.data);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load dashboard statistics."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Welcome to {tenant?.name || "your workspace"},{" "}
              {user?.email}
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={loadStats}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
            <div className="flex gap-3">
              <AlertCircle
                size={20}
                className="text-red-500"
              />
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </Card>
        )}

        {loading && !stats ? (
          <Card className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading dashboard...
          </Card>
        ) : stats ? (
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Employees
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  label="Total Employees"
                  value={stats.employees.total}
                  icon={Users}
                />
                <StatCard
                  label="Invited"
                  value={stats.employees.invited}
                  icon={Users}
                />
                <StatCard
                  label="Onboarding"
                  value={stats.employees.onboarding}
                  icon={Users}
                />
                <StatCard
                  label="Active"
                  value={stats.employees.active}
                  icon={Users}
                />
                <StatCard
                  label="Resigned"
                  value={stats.employees.resigned}
                  icon={Users}
                />
                <StatCard
                  label="Offboarded"
                  value={stats.employees.offboarded}
                  icon={Users}
                />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Documents
                </h2>

                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <StatCard
                    label="Total"
                    value={stats.documents.total}
                    icon={FileText}
                  />
                  <StatCard
                    label="Valid"
                    value={stats.documents.valid}
                    icon={FileText}
                  />
                  <StatCard
                    label="Revoked"
                    value={stats.documents.revoked}
                    icon={FileText}
                  />
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Clearances
                </h2>

                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <StatCard
                    label="Pending"
                    value={stats.clearances.pending}
                    icon={ClipboardCheck}
                  />
                  <StatCard
                    label="Approved"
                    value={stats.clearances.approved}
                    icon={ClipboardCheck}
                  />
                  <StatCard
                    label="Rejected"
                    value={stats.clearances.rejected}
                    icon={ClipboardCheck}
                  />
                </div>
              </div>
            </section>
          </div>
        ) : (
          <Card className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No dashboard data available.
          </Card>
        )}
      </div>
    </div>
  );
}
