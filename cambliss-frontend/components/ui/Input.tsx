import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-[var(--ink)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full h-10 px-3 rounded-[6px] text-[14px] text-[var(--ink)]",
            "bg-white border transition-colors",
            "placeholder:text-[var(--muted)]",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-[var(--sale)] focus:ring-red-200"
              : "border-[var(--border)] focus:border-[var(--brand-400)] focus:ring-[var(--brand-400)]/20",
            className,
          ].join(" ")}
          {...props}
        />
        {error && (
          <p className="text-[12px] text-[var(--sale)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[12px] text-[var(--muted)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
export type { InputProps };
