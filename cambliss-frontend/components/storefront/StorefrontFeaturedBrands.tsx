"use client";

export const StorefrontFeaturedBrands = () => {
  const brands = [
    { name: "Office Connect", tag: "Authorized 1P", icon: "👑" },
    { name: "Glow Beauty Grasse", tag: "Certified Organic", icon: "🌸" },
    { name: "Acme Cloud Infrastructure", tag: "Direct Partner", icon: "☁️" },
    { name: "AutoCare Motors USA", tag: "OEM Certified", icon: "🚘" },
    { name: "Sony Electronics", tag: "Authorized Partner", icon: "🎧" },
    { name: "Apple Commercial", tag: "Authorized Enterprise", icon: "💻" },
  ];

  return (
    <section className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
          Authorized Marketplace Brands
        </h2>
        <span className="text-xs text-slate-400">100% Genuine Manufacturer Backed</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {brands.map((b) => (
          <div
            key={b.name}
            className="p-3.5 rounded-[8px] border border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs transition flex flex-col items-center text-center space-y-1"
          >
            <span className="text-2xl">{b.icon}</span>
            <span className="font-bold text-xs text-slate-900 line-clamp-1">{b.name}</span>
            <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.2 text-[9px] font-bold">
              {b.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
