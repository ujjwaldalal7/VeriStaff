import type {
  SelectHTMLAttributes
} from "react";

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export default function Select({
  label,
  id,
  children,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <select
        id={id}
        {...props}
        className={[
          "w-full rounded-lg border border-slate-300",
          "bg-white px-4 py-2.5 text-sm text-slate-900",
          "outline-none transition",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
          "dark:border-slate-700 dark:bg-slate-900",
          "dark:text-white dark:focus:border-blue-400",
          className
        ].join(" ")}
      >
        {children}
      </select>
    </div>
  );
}