import { LogOut, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { logout } from "../../store/slices/authSlice";
import ThemeToggle from "../ui/ThemeToggle";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector(
    (state) => state.auth.user
  );

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[73px] items-center justify-end border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8 dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center gap-3">
        {/* Theme */}
        <ThemeToggle />

        {/* User */}
        <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex dark:border-slate-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
            <UserCircle size={20} />
          </div>

          <div className="max-w-48">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
              {user?.email}
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        >
          <LogOut size={18} />

          <span className="hidden md:inline">
            Logout
          </span>
        </button>
      </div>
    </header>
  );
}