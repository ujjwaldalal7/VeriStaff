import {
  Moon,
  Sun
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { toggleTheme } from "../../store/slices/themeSlice";

export default function ThemeToggle() {
  const dispatch = useAppDispatch();

  const theme = useAppSelector(
    (state) => state.theme.mode
  );

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {isDark ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </button>
  );
}