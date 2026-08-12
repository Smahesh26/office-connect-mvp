import Link from "next/link";

export function FinalCTA() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 pb-32">
      <div className="relative overflow-hidden rounded-3xl bg-brand-soft/20 p-12 text-center md:p-20 shadow-sm border border-line">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="mb-6 text-3xl font-extrabold text-foreground-strong md:text-5xl">
            Connect your office in an afternoon.
          </h2>
          <p className="mb-10 text-lg text-foreground-muted">
            Sign up, invite your team, and get HRM, CRM, Inventory, and unlimited file transfer free for 90 days — no card required.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link 
              href="/register" 
              className="w-full sm:w-auto rounded-full bg-brand px-8 py-4 text-sm font-bold text-white shadow-lg hover:bg-brand-strong transition-all hover:scale-105"
            >
              Start your free workspace
            </Link>
            <Link 
              href="/contact" 
              className="w-full sm:w-auto rounded-full border-2 border-line bg-transparent px-8 py-3.5 text-sm font-bold text-foreground-strong hover:border-brand hover:text-brand transition-all"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
