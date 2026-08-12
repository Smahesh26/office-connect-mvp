import { Check } from "lucide-react";
import Link from "next/link";

export function Pricing() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24" id="pricing">
      <div className="mb-16 text-center max-w-2xl mx-auto">
        <div className="inline-block rounded-full bg-brand/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-brand mb-4">
          Simple pricing
        </div>
        <h2 className="text-4xl font-extrabold text-foreground-strong md:text-5xl mb-4">
          Start free. Scale when you're ready.
        </h2>
        <p className="text-lg text-foreground-muted">
          Every plan includes the core ERP platform. Accounting, GST Exports, CRM, and HRM are free for your first 90 days on any plan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8 items-start">
        
        {/* Starter Plan */}
        <div className="flex flex-col rounded-3xl border border-line bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand mb-2">Starter</h3>
            <div className="text-4xl font-extrabold text-foreground-strong mb-2">
              $0 <span className="text-sm font-semibold text-foreground-muted">/ month</span>
            </div>
            <p className="text-sm text-foreground-muted">For small teams getting their workplace organized.</p>
          </div>
          
          <ul className="mb-8 flex-1 space-y-4">
            <li className="flex items-start gap-3 text-sm text-foreground-strong">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>Up to 15 employees</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-foreground-strong">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>Basic Accounting & Invoicing</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-foreground-strong">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>Up to 50 E-Way Bills / mo</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-foreground-strong">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>HRM, CRM, & GST Exports free for 90 days*</span>
            </li>
          </ul>
          
          <Link href="/register" className="block w-full rounded-xl border border-line bg-transparent px-4 py-3 text-center text-sm font-bold text-foreground-strong hover:border-brand hover:text-brand transition-colors">
            Get started
          </Link>
        </div>

        {/* Growth Plan - Featured */}
        <div className="relative flex flex-col rounded-3xl border border-white/30 bg-gradient-to-br from-brand-strong to-brand p-8 shadow-2xl md:-mt-4 md:mb-4">
          <div className="absolute -top-4 right-8 rounded-full bg-brand-soft px-4 py-1.5 text-xs font-extrabold text-brand-strong shadow-md">
            Most popular
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-2">Growth</h3>
            <div className="text-4xl font-extrabold text-white mb-2">
              $14 <span className="text-sm font-semibold text-white/80">/ user / month</span>
            </div>
            <p className="text-sm text-white/90">For growing teams that need every module, always on.</p>
          </div>
          
          <ul className="mb-8 flex-1 space-y-4">
            <li className="flex items-start gap-3 text-sm text-white">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
              <span>Unlimited employees</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
              <span>HRM, CRM & Inventory included</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
              <span>Unlimited E-Way Bills & GST Filings</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
              <span>AI-Powered CEO Reports</span>
            </li>
          </ul>
          
          <Link href="/register" className="block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-brand-strong hover:bg-brand-soft hover:shadow-lg transition-all">
            Start free trial
          </Link>
        </div>

        {/* Enterprise Plan */}
        <div className="flex flex-col rounded-3xl border border-line bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand mb-2">Enterprise</h3>
            <div className="text-4xl font-extrabold text-foreground-strong mb-2">
              Custom
            </div>
            <p className="text-sm text-foreground-muted">For organizations with multiple sites and custom needs.</p>
          </div>
          
          <ul className="mb-8 flex-1 space-y-4">
            <li className="flex items-start gap-3 text-sm text-foreground-strong">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>Everything in Growth</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-foreground-strong">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>Multi-site & SSO</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-foreground-strong">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>Dedicated success manager</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-foreground-strong">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>Custom SLAs</span>
            </li>
          </ul>
          
          <Link href="/contact" className="block w-full rounded-xl border border-line bg-transparent px-4 py-3 text-center text-sm font-bold text-foreground-strong hover:border-brand hover:text-brand transition-colors">
            Talk to sales
          </Link>
        </div>
      </div>
      
      <p className="mt-10 text-center text-xs text-foreground-muted">
        *Accounting, GST Exports, CRM, and HRM are free for 90 days from your sign-up date on any plan, including Starter.
      </p>
    </div>
  );
}
