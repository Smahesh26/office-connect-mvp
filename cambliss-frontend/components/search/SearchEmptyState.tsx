"use client";

import Link from "next/link";

export const SearchEmptyState = ({
  query,
  onSuggestionClick,
}: {
  query: string;
  onSuggestionClick?: (q: string) => void;
}) => {
  const suggestions = [
    "Sony WH-1000XM5",
    "Keychron Mechanical Keyboard",
    "Dell 4K USB-C Monitor",
    "Minimalist Vitamin C Serum",
    "Brembo Brake Spares",
  ];

  return (
    <div className="bg-white rounded-[8px] border border-slate-200 p-8 sm:p-12 text-center space-y-6 max-w-2xl mx-auto shadow-2xs select-none">
      
      {/* Icon & Message */}
      <div className="space-y-2">
        <div className="text-4xl">🔍</div>
        <h3 className="text-lg font-black text-slate-900">
          No matches found for &ldquo;{query}&rdquo;
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          We couldn&apos;t find any products, verified brand hubs, or SKUs matching your exact query. Check the spelling or try alternative keywords.
        </p>
      </div>

      {/* Query Recommendations */}
      <div className="p-4 rounded-[6px] bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
        <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] block">
          💡 Search Tips:
        </span>
        <ul className="list-disc list-inside text-slate-600 space-y-1">
          <li>Check your spelling or use general keywords like &ldquo;Headphones&rdquo; or &ldquo;Monitors&rdquo;.</li>
          <li>Search by brand flagship name like &ldquo;Sony&rdquo;, &ldquo;Dell&rdquo;, or &ldquo;Keychron&rdquo;.</li>
          <li>Try fewer keywords or remove specific filter constraints.</li>
        </ul>
      </div>

      {/* Suggested Search Pills */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Popular Search Terms
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionClick?.(s)}
              className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-[#404d85] hover:text-[#404d85] bg-white text-slate-700 text-xs font-semibold transition"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Return Action */}
      <div className="pt-2">
        <Link
          href="/storefront"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs transition shadow-2xs"
        >
          ← Return to Marketplace Homepage
        </Link>
      </div>

    </div>
  );
};
