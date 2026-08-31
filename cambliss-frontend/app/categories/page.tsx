"use client";

import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";

export default function CategoriesDirectoryPage() {
  const departments = [
    {
      title: "Electronics, Audio & Wearables",
      slug: "electronics",
      icon: "⚡",
      itemCount: "1,420 Items",
      description: "Hi-Res noise cancelling headphones, smartwatches, studio microphones & fast chargers.",
      subcategories: ["Wireless Headphones", "Smartwatches & Wearables", "Studio Microphones", "Fast Charging Adapters"],
    },
    {
      title: "Enterprise Computing & Workstations",
      slug: "computing",
      icon: "💻",
      itemCount: "980 Items",
      description: "Custom mechanical keyboards, 4K Thunderbolt monitors, NVMe SSD storage, and GPU clusters.",
      subcategories: ["Mechanical Keyboards", "4K Thunderbolt Displays", "NVMe SSD Storage", "Enterprise Workstations"],
    },
    {
      title: "Luxury Skincare & French Botanicals",
      slug: "beauty",
      icon: "🌸",
      itemCount: "890 Items",
      description: "Cold-pressed Damask Rose extracts, botanical lip elixirs, certified organic serums.",
      subcategories: ["Botanical Facial Serums", "Lip Peptide Balms", "Anti-Aging Night Concentrates", "Organic Cleansers"],
    },
    {
      title: "Automotive Motorsport & OEM Spares",
      slug: "automotive",
      icon: "🚘",
      itemCount: "620 Items",
      description: "Fully synthetic motor oils, ceramic brake pad sets, and workshop diagnostic tools.",
      subcategories: ["Full Synthetic Motor Oils", "Ceramic Brake Systems", "Diagnostic Scanners", "OEM Filters"],
    },
    {
      title: "Enterprise Cloud Servers & SaaS",
      slug: "cloud",
      icon: "☁️",
      itemCount: "340 Plans",
      description: "Dedicated Kubernetes NVMe server clusters, private VPS cloud hosting with 99.99% SLA.",
      subcategories: ["Kubernetes Clusters", "High-Memory Dedicated VPS", "Anycast Storage Nodes", "Managed SSL"],
    },
    {
      title: "Ergonomic Office & Executive Workspace",
      slug: "workspace",
      icon: "🪑",
      itemCount: "470 Items",
      description: "Herman Miller ergonomic seating, motorised standing desks, intelligent sun-tracking lamps.",
      subcategories: ["Ergonomic Seating", "Motorised Standing Desks", "Intelligent Desk Lights", "Laptop Risers"],
    },
  ];

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-28 select-none">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/storefront" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">All Departments</span>
        </nav>

        <div className="space-y-2 pb-6 border-b border-slate-200">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Browse All Marketplace Departments
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Explore thousands of verified manufacturer and merchant products with 100% buyer escrow protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((d) => (
            <div
              key={d.slug}
              className="p-6 rounded-[8px] border border-slate-200 bg-white hover:border-slate-400 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{d.icon}</span>
                  <span className="text-[11px] font-extrabold text-[#404d85] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {d.itemCount}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#404d85] transition">
                  {d.title}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {d.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap gap-1.5">
                  {d.subcategories.map((sub, i) => (
                    <span key={i} className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {sub}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/category/${d.slug}`}
                  className="block w-full py-2 rounded-[6px] bg-slate-100 hover:bg-[#404d85] text-slate-800 hover:text-white text-center font-bold text-xs transition"
                >
                  Explore {d.title} →
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </StorefrontShell>
  );
}
