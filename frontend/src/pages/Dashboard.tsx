import { useAppSelector } from "../hooks/redux";
import ThemeToggle from "../components/ui/ThemeToggle";
export default function Dashboard() {
  const user = useAppSelector(
    (state) => state.auth.user
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-3xl font-bold text-slate-900">
        Dashboard
      </h1>
      <ThemeToggle />

      <p className="mt-2 text-slate-600">
        Welcome, {user?.email}
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <p className="font-medium text-slate-800">
          Role
        </p>

        <p className="mt-1 text-slate-500">
          {user?.role}
        </p>
      </div>
    </div>
  );
}