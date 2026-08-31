"use client";

import { ReactNode } from "react";
import { Button } from "./Button";

export type AlertVariant = "info" | "success" | "warning" | "destructive";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

const alertVariants: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
  info: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-900", icon: "ℹ️" },
  success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", icon: "✓" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", icon: "⚠️" },
  destructive: { bg: "bg-red-50", border: "border-red-200", text: "text-red-900", icon: "✕" },
};

export const Alert = ({ variant = "info", title, children, onClose }: AlertProps) => {
  const cfg = alertVariants[variant];

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-[8px] border ${cfg.bg} ${cfg.border} ${cfg.text} text-xs`}>
      <span className="font-bold text-sm leading-none">{cfg.icon}</span>
      <div className="flex-1">
        {title && <h5 className="font-bold mb-0.5">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 font-bold">
          ✕
        </button>
      )}
    </div>
  );
};

export const Spinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6";
  return (
    <svg className={`animate-spin ${sizeClass} text-[#404d85]`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
};

export const Skeleton = ({ className = "" }: { className?: string }) => {
  return <div className={`animate-pulse bg-slate-200 rounded-[6px] ${className}`} />;
};

export interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon = "📦", title, description, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-[12px] bg-slate-50/50">
      <div className="text-4xl mb-3">{icon}</div>
      <h4 className="text-sm font-black text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ title = "Something went wrong", message, onRetry }: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-red-200 rounded-[12px] bg-red-50/50">
      <div className="text-3xl mb-2">⚠️</div>
      <h4 className="text-sm font-black text-red-900">{title}</h4>
      <p className="text-xs text-red-700 max-w-sm mt-1 mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again ↺
        </Button>
      )}
    </div>
  );
};
