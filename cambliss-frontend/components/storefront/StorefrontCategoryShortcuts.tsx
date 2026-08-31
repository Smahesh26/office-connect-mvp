"use client";

import Link from "next/link";

export const StorefrontCategoryShortcuts = () => {
  const shortcuts = [
    { label: "Electronics", icon: "⚡", count: "1,420 Items", href: "/category/electronics", color: "bg-blue-50 text-blue-700 border-blue-100" },
    { label: "Skincare", icon: "🌸", count: "890 Items", href: "/category/beauty", color: "bg-pink-50 text-pink-700 border-pink-100" },
    { label: "Cloud SaaS", icon: "☁️", count: "340 Plans", href: "/category/cloud", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
    { label: "Auto Spares", icon: "🚘", count: "620 Parts", href: "/category/automotive", color: "bg-amber-50 text-amber-700 border-amber-100" },
    { label: "Computing", icon: "💻", count: "980 Items", href: "/category/computing", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    { label: "Audio Gear", icon: "🎧", count: "410 Items", href: "/category/electronics", color: "bg-purple-50 text-purple-700 border-purple-100" },
    { label: "All Stores", icon: "🏬", count: "48 Verified", href: "/storefront?vendor=All", color: "bg-slate-50 text-slate-700 border-slate-200" },
  ];

  return (
    <section className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
          Department Shortcuts
        </h2>
        <Link href="/categories" className="text-xs font-bold text-[#404d85] hover:underline">
          View All Departments →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {shortcuts.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className={`p-3.5 rounded-[10px] border ${cat.color} hover:shadow-sm hover:border-slate-300 transition-all flex flex-col items-center text-center space-y-1 group`}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
            <span className="font-extrabold text-xs text-slate-900 group-hover:text-[#404d85] transition">
              {cat.label}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">{cat.count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};
