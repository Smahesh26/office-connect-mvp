"use client";

import { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "default" | "brand" | "success" | "warning" | "destructive" | "info" | "outline";
export type BadgeSize = "xs" | "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: ReactNode;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-800 border-slate-200",
  brand: "bg-[#404d85]/10 text-[#404d85] border-[#404d85]/20",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  destructive: "bg-red-50 text-red-700 border-red-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  outline: "bg-white text-slate-700 border-slate-300",
};

const badgeSizes: Record<BadgeSize, string> = {
  xs: "px-1.5 py-0.2 text-[10px] font-bold rounded-[4px]",
  sm: "px-2 py-0.5 text-[11px] font-bold rounded-[4px]",
  md: "px-2.5 py-1 text-xs font-extrabold rounded-[6px]",
};

export const Badge = ({ variant = "default", size = "sm", dot = false, className = "", children, ...props }: BadgeProps) => {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 border leading-none whitespace-nowrap font-sans",
        badgeVariants[variant],
        badgeSizes[size],
        className,
      ].join(" ")}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
};

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export const Chip = ({ label, selected = false, onClick, onRemove, disabled = false }: ChipProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all select-none",
        selected
          ? "bg-[#404d85] text-white border-[#404d85] shadow-2xs"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <span>{label}</span>
      {onRemove && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-red-500 ml-0.5 text-xs font-bold"
        >
          ✕
        </span>
      )}
    </button>
  );
};

export type MarketplaceStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "ACTIVE"
  | "INACTIVE"
  | "DRAFT";

export const StatusBadge = ({ status }: { status: MarketplaceStatus | string }) => {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case "DELIVERED":
    case "ACTIVE":
    case "PAID":
      return <Badge variant="success" dot>{status}</Badge>;
    case "SHIPPED":
    case "PROCESSING":
      return <Badge variant="info" dot>{status}</Badge>;
    case "PENDING":
    case "DRAFT":
      return <Badge variant="warning" dot>{status}</Badge>;
    case "CANCELLED":
    case "REFUNDED":
    case "INACTIVE":
      return <Badge variant="destructive" dot>{status}</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};
