import {
  X
} from "lucide-react";

import type {
  ReactNode
} from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md"
}: ModalProps) {
  if (!open) {
    return null;
  }

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl"
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div
        className={[
          "relative z-10 w-full overflow-hidden rounded-2xl",
          "border border-slate-200 bg-white shadow-2xl",
          "dark:border-slate-800 dark:bg-slate-900",
          sizeClasses[size]
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div>
            <h2
              id="modal-title"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}