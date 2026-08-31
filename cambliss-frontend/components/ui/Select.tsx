"use client";

import { SelectHTMLAttributes, forwardRef, ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
  isFullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, isFullWidth = true, disabled, className = "", children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, "-") : undefined);

    return (
      <div className={isFullWidth ? "w-full" : "inline-block"}>
        {label && (
          <label htmlFor={selectId} className="block text-xs font-bold text-slate-800 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={[
              "h-10 w-full appearance-none rounded-[6px] border bg-white pl-3 pr-8 text-sm text-slate-900",
              "transition-colors duration-150 cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              error
                ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                : "border-slate-300 hover:border-slate-400 focus:border-[#404d85] focus:ring-[#404d85]/15",
              disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200" : "",
              className,
            ].join(" ")}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
