import type {
  InputHTMLAttributes
} from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
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

      <input
        id={id}
        {...props}
        className={[
          "w-full rounded-lg border bg-white px-4 py-2.5",
          "text-slate-900 placeholder:text-slate-400",
          "outline-none transition",
          "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
          "dark:border-slate-700 dark:bg-slate-900",
          "dark:text-white dark:placeholder:text-slate-500",
          "dark:focus:border-blue-400",
          error
            ? "border-red-500 focus:border-red-500"
            : "",
          className
        ].join(" ")}
      />

      {error && (
        <p className="mt-1.5 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}