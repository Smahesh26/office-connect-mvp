"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SearchAutocompletePopover } from "@/components/search/SearchAutocompletePopover";

export const StorefrontSearchBar = () => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const categories = [
    "All Categories",
    "Electronics",
    "Enterprise Computing",
    "Beauty & Skincare",
    "Cloud SaaS",
    "Automotive Motors",
  ];

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveToRecentSearches = (searchTerm: string) => {
    try {
      const stored = localStorage.getItem("oc_recent_searches");
      const currentList: string[] = stored ? JSON.parse(stored) : [];
      const updated = [searchTerm, ...currentList.filter((item) => item.toLowerCase() !== searchTerm.toLowerCase())].slice(0, 8);
      localStorage.setItem("oc_recent_searches", JSON.stringify(updated));
    } catch {}
  };

  const executeSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    saveToRecentSearches(searchTerm.trim());
    setIsOpen(false);
    const catParam = selectedCategory !== "All Categories" ? `&category=${encodeURIComponent(selectedCategory)}` : "";
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}${catParam}`);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  return (
    <div ref={searchContainerRef} className="relative w-full">
      <form
        onSubmit={handleFormSubmit}
        className={`flex items-center w-full rounded-[8px] bg-white border transition-all duration-200 ${
          isOpen
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

        {/* Search Input */}
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder="Search 10,000+ products, canonical SKUs, or verified brands..."
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

        {/* Search CTA Button */}
        <button
          type="submit"
          aria-label="Submit Search"
          className="h-10 px-4 rounded-r-[7px] bg-[#404d85] text-white hover:bg-[#323d6a] active:bg-[#252f5a] font-bold text-xs flex items-center justify-center transition-colors shrink-0"
        >
          Search
        </button>
      </form>

      {/* Autocomplete Popover */}
      <SearchAutocompletePopover
        isOpen={isOpen}
        query={query}
        onSelectQuery={(selected) => {
          setQuery(selected);
          executeSearch(selected);
        }}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};
