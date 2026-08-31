"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  isFullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, isFullWidth = true, disabled, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, "-") : undefined);

    return (
      <div className={isFullWidth ? "w-full" : "inline-block"}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-800 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">{leftAddon}</div>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={[
              "h-10 w-full rounded-[6px] border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              leftAddon ? "pl-9" : "",
              rightAddon ? "pr-9" : "",
              error
                ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                : "border-slate-300 hover:border-slate-400 focus:border-[#404d85] focus:ring-[#404d85]/15",
              disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200" : "",
              className,
            ].join(" ")}
            {...props}
          />
          {rightAddon && <div className="absolute right-3 text-slate-400 flex items-center">{rightAddon}</div>}
        </div>
        {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface SearchInputProps extends InputProps {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, placeholder = "Search catalog, SKU, or brands...", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        value={value}
        placeholder={placeholder}
        leftAddon={
          <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        }
        rightAddon={
          value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : null
        }
        {...props}
      />
    );
  }
);
SearchInput.displayName = "SearchInput";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, disabled, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-800 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={[
            "w-full rounded-[6px] border bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400",
            "transition-colors duration-150 min-h-[90px]",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-red-500 focus:border-red-600 focus:ring-red-100"
              : "border-slate-300 hover:border-slate-400 focus:border-[#404d85] focus:ring-[#404d85]/15",
            disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
