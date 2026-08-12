import Link from "next/link";

export function OfferBanner() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24" id="offer">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-strong via-brand to-brand-soft p-8 md:p-14 shadow-2xl">
        
        {/* Abstract Background Circles */}
        <div className="absolute -right-32 -top-40 h-[420px] w-[420px] rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 h-[260px] w-[260px] rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 text-xs font-extrabold uppercase tracking-widest text-white/80">
              Limited launch offer
            </div>
            <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">
              Four premium tools, free for 90 days.
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              Bring your own tools here and we integrate them all in one place. Every new workspace gets full access to HRM, CRM, Inventory, and Video Calls the moment you sign up!
            </p>
          </div>
          
          <div className="shrink-0">
            <Link 
              href="/register" 
              className="inline-block rounded-full bg-white px-8 py-4 text-sm font-bold text-brand-strong shadow-lg hover:scale-105 hover:bg-gray-50 transition-all"
            >
              Claim your free 90 days
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/20">
            <div className="mb-1 text-sm font-extrabold text-white">HRM</div>
            <div className="text-sm text-white/80">Employee records, leave & attendance, onboarding</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/20">
            <div className="mb-1 text-sm font-extrabold text-white">CRM</div>
            <div className="text-sm text-white/80">Pipelines, contacts, and follow-ups in one view</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/20">
            <div className="mb-1 text-sm font-extrabold text-white">Inventory</div>
            <div className="text-sm text-white/80">Stock tracking across every location</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/20">
            <div className="mb-1 text-sm font-extrabold text-white">File Transfer</div>
            <div className="text-sm text-white/80">Unlimited size, encrypted, no expiry pressure</div>
          </div>
        </div>

        <div className="relative z-10 mt-8 text-xs text-white/60">
          *Free access applies to HRM, CRM, Inventory, and unlimited file transfer for 90 days from your sign-up date. After 90 days, continue on any paid plan or downgrade — your data stays put either way.
        </div>
      </div>
    </div>
  );
}
