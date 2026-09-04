import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = ""
}: CardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-slate-200",
        "bg-white shadow-sm",
        "dark:border-slate-800 dark:bg-slate-900",
        className
      ].join(" ")}
    >
      {children}
    </div>
  );
}