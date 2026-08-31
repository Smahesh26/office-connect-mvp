"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const StorefrontMobileBottomNav = ({ onOpenCart }: { onOpenCart: () => void }) => {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/storefront", icon: "🏠" },
    { label: "Categories", href: "/categories", icon: "☰" },
    { label: "Search", href: "/search", icon: "🔍" },
    { label: "Orders", href: "/orders", icon: "📦" },
    { label: "Account", href: "/profile", icon: "👤" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 lg:hidden shadow-lg select-none">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center p-1 rounded transition text-center ${
                isActive ? "text-[#404d85] font-black" : "text-slate-500 font-semibold"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
