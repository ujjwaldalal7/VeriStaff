import type { ReactNode } from "react";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

export default function Badge({
  children,
  variant = "neutral"
}: BadgeProps) {
  const variants = {
    success:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",

    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",

    danger:
      "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",

    info:
      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",

    neutral:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full",
        "px-2.5 py-1 text-xs font-medium",
        variants[variant]
      ].join(" ")}
    >
      {children}
    </span>
  );
}