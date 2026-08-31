"use client";

import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, disabled, className = "", id, ...props }, ref) => {
    const inputId = id || (typeof label === "string" ? label.toLowerCase().replace(/[^a-z0-9]/g, "-") : undefined);

    return (
      <div className="flex items-start gap-2.5 select-none">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          className={[
            "h-4 w-4 mt-0.5 rounded-[4px] border-slate-300 text-[#404d85]",
            "focus:ring-2 focus:ring-[#404d85]/20 focus:ring-offset-0 transition-colors cursor-pointer",
            disabled ? "cursor-not-allowed opacity-50" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {(label || description) && (
          <div className="text-xs">
            {label && (
              <label htmlFor={inputId} className="font-semibold text-slate-800 cursor-pointer block">
                {label}
              </label>
            )}
            {description && <p className="text-slate-500 mt-0.5">{description}</p>}
            {error && <p className="text-red-600 font-semibold mt-0.5">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, disabled, className = "", id, ...props }, ref) => {
    const inputId = id || (typeof label === "string" ? label.toLowerCase().replace(/[^a-z0-9]/g, "-") : undefined);

    return (
      <div className="flex items-start gap-2.5 select-none">
        <input
          ref={ref}
          id={inputId}
          type="radio"
          disabled={disabled}
          className={[
            "h-4 w-4 mt-0.5 border-slate-300 text-[#404d85]",
            "focus:ring-2 focus:ring-[#404d85]/20 focus:ring-offset-0 transition-colors cursor-pointer",
            disabled ? "cursor-not-allowed opacity-50" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {(label || description) && (
          <div className="text-xs">
            {label && (
              <label htmlFor={inputId} className="font-semibold text-slate-800 cursor-pointer block">
                {label}
              </label>
            )}
            {description && <p className="text-slate-500 mt-0.5">{description}</p>}
          </div>
        )}
      </div>
    );
  }
);
Radio.displayName = "Radio";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const Switch = ({ checked, onChange, label, description, disabled = false }: SwitchProps) => {
  return (
    <div className="flex items-center justify-between gap-4 select-none">
      {(label || description) && (
        <div className="text-xs">
          {label && <span className="font-bold text-slate-800 block">{label}</span>}
          {description && <span className="text-slate-500">{description}</span>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
          "transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#404d85]/20",
          checked ? "bg-[#404d85]" : "bg-slate-200",
          disabled ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0",
            "transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
};
