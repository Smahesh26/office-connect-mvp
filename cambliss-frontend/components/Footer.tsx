import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-brand-strong pt-16 pb-8 text-brand-soft">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5 pb-12 border-b border-white/10">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-white mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-strong font-extrabold text-xl">
                O
              </div>
              <span className="text-xl font-extrabold tracking-tight">Office Connect</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-brand-soft/80">
              The connected workplace platform that brings your people, spaces, and operations into one calm view.
            </p>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="mb-6 text-sm font-extrabold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-4 text-sm text-brand-soft/80">
              <li><Link href="#" className="hover:text-white transition-colors">Desk booking</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">HRM</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">CRM</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Inventory</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">File Transfer</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-extrabold uppercase tracking-wider text-white">Solutions</h4>
            <ul className="space-y-4 text-sm text-brand-soft/80">
              <li><Link href="#" className="hover:text-white transition-colors">Hybrid teams</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Enterprise</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Startups</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-extrabold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-4 text-sm text-brand-soft/80">
              <li><Link href="#" className="hover:text-white transition-colors">About us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row text-xs text-brand-soft/60">
          <p>© {new Date().getFullYear()} Office Connect. All rights reserved. This is a beta version.</p>
          
          <div className="flex items-center gap-4">
            <Link href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </Link>
            <Link href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </Link>
            <Link href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
