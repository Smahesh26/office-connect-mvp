export function TrustBar() {
  return (
    <div className="w-full border-y border-line bg-brand-soft/20 py-10">
      <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-8 md:flex-row md:justify-between">
        <span className="text-xs font-extrabold tracking-widest text-foreground-muted uppercase whitespace-nowrap">
          Trusted by hybrid teams at
        </span>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm font-extrabold tracking-wider text-foreground-strong/40">
          <span>NORTHPEAK</span>
          <span>VELOR</span>
          <span>GRIDWORKS</span>
          <span>HALLMARK CO</span>
          <span>ATLAS & CO</span>
        </div>
      </div>
    </div>
  );
}
