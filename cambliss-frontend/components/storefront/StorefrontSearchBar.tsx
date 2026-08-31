"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export const StorefrontSearchBar = () => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const categories = [
    "All Categories",
    "Electronics & Computing",
    "Beauty & Personal Care",
    "Cloud SaaS & Server Hosting",
    "Automotive Motors & Spares",
    "Industrial Automation",
  ];

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const catParam = selectedCategory !== "All Categories" ? `&category=${encodeURIComponent(selectedCategory)}` : "";
    router.push(`/search?q=${encodeURIComponent(query.trim())}${catParam}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`relative flex items-center w-full rounded-[8px] bg-white border transition-all duration-200 ${
        isFocused
          ? "border-[#404d85] ring-2 ring-[#404d85]/15 shadow-sm"
          : "border-slate-300 hover:border-slate-400"
      }`}
    >
      {/* Category Prefix Dropdown */}
      <div className="hidden sm:flex items-center border-r border-slate-200 bg-slate-50/80 rounded-l-[7px] px-2.5 h-10">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Input */}
      <div className="relative flex-1 flex items-center">
        <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">🔍</span>
        <input
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 10,000+ products, canonical SKUs, or verified sellers..."
          className="w-full h-10 pl-8 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        aria-label="Submit Search"
        className="h-10 px-4 rounded-r-[7px] bg-[#404d85] text-white hover:bg-[#323d6a] active:bg-[#252f5a] font-bold text-xs flex items-center justify-center transition-colors shrink-0"
      >
        Search
      </button>
    </form>
  );
};
