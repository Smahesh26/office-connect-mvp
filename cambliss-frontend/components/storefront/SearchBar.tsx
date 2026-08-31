"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for products, brands, categories..."
        className="w-full h-10 pl-10 pr-4 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] text-[13px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-400)]/15 transition-colors"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </form>
  );
}
