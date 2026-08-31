"use client";

export const StorefrontFeaturedBrands = () => {
  const brands = [
    { name: "Office Connect", tag: "Authorized 1P", icon: "👑" },
    { name: "Glow Beauty Grasse", tag: "Certified Organic", icon: "🌸" },
    { name: "Acme Cloud Infrastructure", tag: "Direct Partner", icon: "☁️" },
    { name: "AutoCare Motors USA", tag: "OEM Certified", icon: "🚘" },
    { name: "Sony Electronics", tag: "Authorized Partner", icon: "🎧" },
    { name: "Apple Commercial", tag: "Enterprise", icon: "💻" },
  ];

  return (
    <section className="py-6 border-t border-b border-slate-200 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Authorized Marketplace Brands
        </h2>
        <span className="text-[11px] text-slate-400 font-medium">100% Genuine Manufacturer Warranties</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {brands.map((b) => (
          <div
            key={b.name}
            className="p-3 border border-slate-200 rounded-[6px] bg-white hover:border-slate-300 transition flex items-center gap-2.5"
          >
            <span className="text-xl">{b.icon}</span>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 block truncate">{b.name}</span>
              <span className="text-[10px] text-slate-400 block">{b.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
