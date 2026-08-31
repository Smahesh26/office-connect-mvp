"use client";

import Link from "next/link";

export const TypoCorrectionBanner = ({
  originalQuery,
  correctedQuery,
  onAcceptCorrection,
}: {
  originalQuery: string;
  correctedQuery: string;
  onAcceptCorrection?: () => void;
}) => {
  if (!correctedQuery || originalQuery.toLowerCase() === correctedQuery.toLowerCase()) {
    return null;
  }

  return (
    <div className="p-3.5 rounded-[8px] bg-amber-50/70 border border-amber-200/80 text-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs select-none">
      <div className="flex items-center gap-2">
        <span className="text-base">💡</span>
        <div>
          <span>Showing results for </span>
          <Link
            href={`/search?q=${encodeURIComponent(correctedQuery)}`}
            onClick={onAcceptCorrection}
            className="font-black text-[#404d85] hover:underline"
          >
            &ldquo;{correctedQuery}&rdquo;
          </Link>
          <span className="text-slate-400 mx-1.5">•</span>
          <span className="text-slate-500">Search instead for </span>
          <Link
            href={`/search?q=${encodeURIComponent(originalQuery)}&exact=true`}
            className="font-semibold text-slate-700 italic hover:underline"
          >
            &ldquo;{originalQuery}&rdquo;
          </Link>
        </div>
      </div>

      <Link
        href={`/search?q=${encodeURIComponent(correctedQuery)}`}
        onClick={onAcceptCorrection}
        className="px-3 py-1 bg-white border border-amber-300 hover:border-[#404d85] text-[#404d85] font-bold rounded text-[11px] transition text-center shrink-0"
      >
        Apply Suggested Query
      </Link>
    </div>
  );
};
