"use client";

import { ReactNode } from "react";
import { Button } from "../ui/Button";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: string | ReactNode;
  hint?: string;
}

export const StatCard = ({ title, value, change, trend = "up", icon, hint }: StatCardProps) => {
  return (
    <div className="p-5 rounded-[10px] border border-slate-200 bg-white shadow-2xs space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
        <span>{title}</span>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
      {(change || hint) && (
        <div className="flex items-center gap-1.5 text-xs">
          {change && (
            <span
              className={`font-bold ${
                trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-slate-600"
              }`}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "•"} {change}
            </span>
          )}
          {hint && <span className="text-slate-400">{hint}</span>}
        </div>
      )}
    </div>
  );
};

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const PageHeader = ({ title, subtitle, action }: PageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
      <div>
        <h1 className="text-xl font-black text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  isLoading = false,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="p-8 text-center border border-slate-200 rounded-[8px] bg-white text-xs text-slate-500">
        Loading data...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center border border-slate-200 rounded-[8px] bg-white text-xs text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-[8px] border border-slate-200 bg-white shadow-2xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
            {columns.map((col, idx) => (
              <th key={idx} className={`py-3 px-4 ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800">
          {data.map((row) => (
            <tr key={String(row[keyField])} className="hover:bg-slate-50/80 transition-colors">
              {columns.map((col, idx) => (
                <td key={idx} className={`py-3 px-4 ${col.className || ""}`}>
                  {typeof col.accessor === "function" ? col.accessor(row) : (row[col.accessor] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const BulkActionsBar = ({
  selectedCount,
  onClear,
  actions,
}: {
  selectedCount: number;
  onClear: () => void;
  actions: ReactNode;
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
      <span>{selectedCount} item(s) selected</span>
      <div className="h-4 w-px bg-slate-700" />
      <div className="flex items-center gap-2">{actions}</div>
      <button onClick={onClear} className="text-slate-400 hover:text-white ml-2 text-xs">
        ✕
      </button>
    </div>
  );
};
