"use client";

import { ReactNode, useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "line" | "pill";
}

export const Tabs = ({ tabs, activeTab, onChange, variant = "line" }: TabsProps) => {
  return (
    <div className={variant === "line" ? "border-b border-slate-200 flex gap-6" : "flex gap-1.5 p-1 bg-slate-100 rounded-[8px]"}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        if (variant === "pill") {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={[
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-xs font-bold transition-all select-none",
                isActive ? "bg-white text-[#404d85] shadow-xs" : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-extrabold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              "flex items-center gap-2 py-3 text-xs font-bold border-b-2 transition-all select-none -mb-px",
              isActive
                ? "border-[#404d85] text-[#404d85]"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
            ].join(" ")}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-extrabold">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export const AccordionItem = ({ title, children, defaultOpen = false }: AccordionItemProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-[8px] bg-white overflow-hidden mb-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-slate-900 hover:bg-slate-50 transition select-none"
      >
        <span>{title}</span>
        <span className={`text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>
      {isOpen && <div className="p-4 pt-0 text-xs text-slate-600 border-t border-slate-100">{children}</div>}
    </div>
  );
};

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const Breadcrumb = ({ items }: { items: BreadcrumbItem[] }) => {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 py-2">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={idx} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <a href={item.href} className="hover:text-slate-900 transition-colors font-medium">
                {item.label}
              </a>
            ) : (
              <span className="font-bold text-slate-900">{item.label}</span>
            )}
            {!isLast && <span className="text-slate-300">/</span>}
          </div>
        );
      })}
    </nav>
  );
};

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-4 text-xs font-semibold text-slate-700">
      <div>
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-7 w-7 rounded font-bold ${
              currentPage === p ? "bg-[#404d85] text-white" : "border border-slate-300 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};
