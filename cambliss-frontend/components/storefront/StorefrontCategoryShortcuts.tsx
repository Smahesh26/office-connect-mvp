"use client";

import Link from "next/link";

export const StorefrontCategoryShortcuts = () => {
  const shortcuts = [
    { label: "Electronics & Audio", icon: "⚡", href: "/category/electronics" },
    { label: "Skincare & Cosmetics", icon: "🌸", href: "/category/beauty" },
    { label: "Cloud Servers & SaaS", icon: "☁️", href: "/category/cloud" },
    { label: "Auto Motors & Spares", icon: "🚘", href: "/category/automotive" },
    { label: "Enterprise Computing", icon: "💻", href: "/category/computing" },
    { label: "Verified Stores Directory", icon: "🏬", href: "/storefront?vendor=All" },
  ];

  return (
    <section className="py-2 border-b border-slate-200 select-none">
      <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none py-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 shrink-0">
          Departments:
        </span>

        <div className="flex items-center gap-6 shrink-0">
          {shortcuts.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#404d85] hover:underline underline-offset-4 transition group whitespace-nowrap"
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.label}</span>
            </Link>
          ))}
        </div>

        <Link
          href="/categories"
          className="text-xs font-bold text-[#404d85] hover:underline shrink-0 whitespace-nowrap pl-4 border-l border-slate-200"
        >
          All Categories →
        </Link>
      </div>
    </section>
  );
};
