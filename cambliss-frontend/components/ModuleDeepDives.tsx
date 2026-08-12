import { CheckCircle2 } from "lucide-react";

export function ModuleDeepDives() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 space-y-32" id="modules">
      
      {/* HRM */}
      <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <div className="inline-block rounded-full bg-brand/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-brand">
            Human Resources
          </div>
          <h3 className="text-3xl font-extrabold text-foreground-strong md:text-4xl">
            Manage your people, without the paperwork.
          </h3>
          <p className="text-lg text-foreground-muted">
            From the day someone joins to the day they take leave, Office Connect HRM keeps every employee record, approval, and policy in one organized, searchable place.
          </p>
          <ul className="space-y-4 pt-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Centralized employee records</b>
                <span className="text-sm text-foreground-muted">Contracts, documents, and history in one secure profile per employee.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Leave & attendance</b>
                <span className="text-sm text-foreground-muted">Self-serve requests, automatic approvals routing, and real-time balances.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Guided onboarding</b>
                <span className="text-sm text-foreground-muted">Checklists and document collection so new hires are productive from day one.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Performance reviews</b>
                <span className="text-sm text-foreground-muted">Lightweight review cycles with goals, feedback, and history in context.</span>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="flex-1">
          <div className="rounded-3xl border border-line bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-extrabold text-foreground-strong">Leave requests</span>
              <span className="text-xs font-bold text-foreground-muted">This week</span>
            </div>
            
            <div className="divide-y divide-line">
              <div className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-brand"></div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground-strong">Priya Nair</div>
                  <div className="text-xs text-foreground-muted">Annual leave · 3 days</div>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700">Approved</span>
              </div>
              <div className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-soft"></div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground-strong">Marcus Webb</div>
                  <div className="text-xs text-foreground-muted">Sick leave · 1 day</div>
                </div>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-extrabold text-brand">Pending</span>
              </div>
              <div className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-strong"></div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground-strong">Aiko Tanaka</div>
                  <div className="text-xs text-foreground-muted">Parental leave · 12 weeks</div>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700">Approved</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-line bg-background p-4">
                <div className="text-2xl font-extrabold text-brand-strong">142</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Active employees</div>
              </div>
              <div className="rounded-2xl border border-line bg-background p-4">
                <div className="text-2xl font-extrabold text-brand-strong">98%</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Onboarding completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CRM */}
      <div className="flex flex-col gap-12 lg:flex-row-reverse lg:items-center">
        <div className="flex-1 space-y-6">
          <div className="inline-block rounded-full bg-brand/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-brand">
            Customer Relationships
          </div>
          <h3 className="text-3xl font-extrabold text-foreground-strong md:text-4xl">
            Keep every customer conversation in one place.
          </h3>
          <p className="text-lg text-foreground-muted">
            Office Connect CRM gives your sales and account teams a single pipeline view, so deals move forward and nobody chases a lead from memory.
          </p>
          <ul className="space-y-4 pt-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Visual deal pipeline</b>
                <span className="text-sm text-foreground-muted">Drag deals through stages and spot what's stalling at a glance.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Contact timeline</b>
                <span className="text-sm text-foreground-muted">Every call, email, and note logged automatically against the right contact.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Smart follow-up reminders</b>
                <span className="text-sm text-foreground-muted">Office Connect nudges your team before a deal goes cold.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Email sync</b>
                <span className="text-sm text-foreground-muted">Connect your inbox once; every thread attaches itself to the right deal.</span>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="flex-1">
          <div className="rounded-3xl border border-line bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-extrabold text-foreground-strong">Pipeline overview</span>
              <span className="text-xs font-bold text-foreground-muted">$486K open</span>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-20 text-xs text-foreground-muted">Discovery</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand/10">
                  <div className="h-full w-[30%] rounded-full bg-gradient-to-r from-brand to-brand-soft"></div>
                </div>
                <span className="text-xs font-bold text-foreground-strong">$96K</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-xs text-foreground-muted">Proposal</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand/10">
                  <div className="h-full w-[55%] rounded-full bg-gradient-to-r from-brand to-brand-soft"></div>
                </div>
                <span className="text-xs font-bold text-foreground-strong">$184K</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-xs text-foreground-muted">Negotiation</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand/10">
                  <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-brand to-brand-soft"></div>
                </div>
                <span className="text-xs font-bold text-foreground-strong">$206K</span>
              </div>
            </div>

            <div className="mt-8 border-t border-line pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-soft"></div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground-strong">Northpeak Logistics</div>
                  <div className="text-xs text-foreground-muted">Renewal · closes in 4 days</div>
                </div>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-extrabold text-brand">Follow up</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <div className="inline-block rounded-full bg-brand/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-brand">
            Inventory
          </div>
          <h3 className="text-3xl font-extrabold text-foreground-strong md:text-4xl">
            Know what you have, where it is, always.
          </h3>
          <p className="text-lg text-foreground-muted">
            Track stock across warehouses, desks, and branches in real time, with alerts before anything runs out and a clean trail for every purchase order.
          </p>
          <ul className="space-y-4 pt-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Real-time stock tracking</b>
                <span className="text-sm text-foreground-muted">Every check-in and check-out updates counts instantly across teams.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Low-stock alerts</b>
                <span className="text-sm text-foreground-muted">Get notified before items run out, with reorder thresholds you set.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Multi-location warehouses</b>
                <span className="text-sm text-foreground-muted">Track stock separately by office, branch, or storage site.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Purchase orders</b>
                <span className="text-sm text-foreground-muted">Generate, send, and track POs without leaving the platform.</span>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="flex-1">
          <div className="rounded-3xl border border-line bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-extrabold text-foreground-strong">Stock by location</span>
              <span className="text-xs font-bold text-foreground-muted">3 sites</span>
            </div>
            
            <div className="divide-y divide-line">
              <div className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-brand"></div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground-strong">SF Headquarters</div>
                  <div className="text-xs text-foreground-muted">1,204 units · 18 SKUs</div>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700">Healthy</span>
              </div>
              <div className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-soft"></div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground-strong">Austin Branch</div>
                  <div className="text-xs text-foreground-muted">312 units · 9 SKUs</div>
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-600">Low stock</span>
              </div>
              <div className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-strong"></div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground-strong">Berlin Warehouse</div>
                  <div className="text-xs text-foreground-muted">2,016 units · 24 SKUs</div>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700">Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Finance & Compliance */}
      <div className="flex flex-col gap-12 lg:flex-row-reverse lg:items-center">
        <div className="flex-1 space-y-6">
          <div className="inline-block rounded-full bg-brand/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-brand">
            Finance & Compliance
          </div>
          <h3 className="text-3xl font-extrabold text-foreground-strong md:text-4xl">
            AI-Driven Accounting & GST Automation.
          </h3>
          <p className="text-lg text-foreground-muted">
            Stay on top of your financial health with real-time CEO reports written by AI, while automating your GSTR-1, GSTR-3B, and E-Way Bill workflows.
          </p>
          <ul className="space-y-4 pt-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">AI CEO Reports</b>
                <span className="text-sm text-foreground-muted">Get automated, intelligent narratives on your revenue, expenses, and cash flow.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">One-Click GST Returns</b>
                <span className="text-sm text-foreground-muted">Export GSTR-1 and GSTR-3B JSON files directly from your ledgers.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <b className="block text-foreground-strong">Bulk E-Way Bills</b>
                <span className="text-sm text-foreground-muted">Generate and track E-Way bills automatically as you create invoices.</span>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="flex-1">
          <div className="rounded-3xl border border-line bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-extrabold text-foreground-strong">AI Executive Summary</span>
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">Generated</span>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-background p-4">
                <div className="text-sm font-bold text-foreground-strong mb-1">Revenue Insight</div>
                <div className="text-xs text-foreground-muted">Revenue increased by 14% this month, primarily driven by enterprise software renewals and new tier-1 consulting contracts.</div>
              </div>
              <div className="rounded-2xl border border-line bg-background p-4">
                <div className="text-sm font-bold text-foreground-strong mb-1">Cash Flow Warning</div>
                <div className="text-xs text-foreground-muted">Outstanding receivables have exceeded ₹1.2M. Recommend following up with accounts overdue by 45+ days to improve working capital.</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-line bg-background p-4">
                <div className="text-2xl font-extrabold text-green-600">₹8.4M</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Net Revenue</div>
              </div>
              <div className="rounded-2xl border border-line bg-background p-4">
                <div className="text-2xl font-extrabold text-brand-strong">Ready</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">GSTR-1 Status</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
