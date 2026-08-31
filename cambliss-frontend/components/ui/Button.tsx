"use client";

import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isFullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#404d85] text-white hover:bg-[#323d6a] active:bg-[#252f5a] shadow-sm border border-transparent",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 border border-slate-200",
  outline: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 shadow-2xs",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200",
  destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-transparent",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-[11px] font-semibold rounded-[4px] gap-1",
  sm: "h-8 px-3 text-xs font-semibold rounded-[6px] gap-1.5",
  md: "h-10 px-4 text-sm font-semibold rounded-[6px] gap-2",
  lg: "h-12 px-6 text-base font-bold rounded-[8px] gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      isFullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={[
          "inline-flex items-center justify-center font-sans transition-all duration-150 select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#404d85] focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          isFullWidth ? "w-full" : "",
          className,
        ].join(" ")}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  ariaLabel: string;
  isLoading?: boolean;
}

const iconSizeClasses: Record<ButtonSize, string> = {
  xs: "h-7 w-7 rounded-[4px] text-xs",
  sm: "h-8 w-8 rounded-[6px] text-sm",
  md: "h-10 w-10 rounded-[6px] text-base",
  lg: "h-12 w-12 rounded-[8px] text-lg",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = "outline", size = "md", ariaLabel, isLoading, disabled, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled || isLoading}
        className={[
          "inline-flex items-center justify-center transition-all duration-150 select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#404d85] focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          iconSizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          icon
        )}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
