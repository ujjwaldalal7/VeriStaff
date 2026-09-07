import { useState } from "react";
import type { FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { login } from "../store/slices/authSlice";
import { fetchTenant } from "../store/slices/tenantSlice";
import Logo from "../components/ui/Logo";

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error } = useAppSelector(
    (state) => state.auth
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const result = await dispatch(
      login({
        email,
        password
      })
    );

    if (login.fulfilled.match(result)) {
      await dispatch(fetchTenant());

      const defaultPath =
        result.payload.user.role === "SUPER_ADMIN" ||
        result.payload.user.role === "HR_ADMIN"
          ? "/dashboard"
          : "/profile";

      const from =
        location.state &&
        typeof location.state === "object" &&
        "from" in location.state
          ? (
              location.state.from as {
                pathname?: string;
              }
            ).pathname
          : defaultPath;

      navigate(from || defaultPath);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

        <div className="mb-8 text-center">
          <div className="mb-8 flex justify-center">
            <Logo
              variant="full"
              size="lg"
              linkTo=""
            />
          </div>

          <p className="mt-2 text-sm text-slate-400">
            HR Operations & Document Verification
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@company.com"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure HR management powered by VeriStaff
        </p>

        <p className="mt-4 text-center text-sm text-slate-400">
          New organization?{" "}
          <Link
            to="/register"
            className="font-medium text-blue-300 hover:text-blue-200"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
