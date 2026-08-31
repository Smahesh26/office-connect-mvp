"use client";

export const AdminOperationsDomain = ({
  subView,
}: {
  subView: "support" | "notifications" | "audit";
}) => {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none text-xs">
      
      {/* 1. SUPPORT */}
      {subView === "support" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Support Escalations & Dispute Arbitration Desk
              </h3>
              <p className="text-xs text-slate-500">24x7 merchant and buyer SLA management</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              0 Unresolved High-Severity Tickets
            </span>
          </div>

          <div className="p-4 rounded border bg-slate-50 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900">Ticket #T-8891: Delivery SLA Check (Delhivery Express)</span>
              <p className="text-slate-500 text-[11px]">Buyer: Bhasker Anand • Status: Resolved in 12 mins</p>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">Closed</span>
          </div>
        </div>
      )}

      {/* 2. NOTIFICATIONS */}
      {subView === "notifications" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                System Broadcasts & SMS/Email Dispatch Center
              </h3>
              <p className="text-xs text-slate-500">Send transactional alerts and festive announcements</p>
            </div>
            <button
              type="button"
              onClick={() => alert("Creating broadcast notification...")}
              className="px-3 py-1.5 bg-[#404d85] text-white font-bold rounded text-xs"
            >
              + Send Broadcast
            </button>
          </div>
          <div className="p-4 rounded bg-slate-50 border space-y-1">
            <span className="font-bold text-slate-900">Broadcast: Sept 2 Settlement Window</span>
            <p className="text-slate-600 text-[11px]">Sent to all 24 verified sellers with active bank mandates.</p>
          </div>
        </div>
      )}

      {/* 3. AUDIT LOGS */}
      {subView === "audit" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Immutable Security & Administrative Audit Trail
              </h3>
              <p className="text-xs text-slate-500">SHA-256 hashed activity logs for governance and compliance</p>
            </div>
            <button
              type="button"
              onClick={() => alert("Exporting audit log CSV...")}
              className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded text-xs"
            >
              Download Audit CSV
            </button>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span>[2026-08-31 13:02:14] ADMIN_APPROVE_KYB: &quot;UrbanThreads Fashion Lab&quot; (sel-3)</span>
              <span className="text-emerald-700 font-bold">SUCCESS</span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span>[2026-08-31 12:45:00] ESCROW_HOLD_FUNDS: Order #OC-89412 (₹53,980)</span>
              <span className="text-emerald-700 font-bold">LOCKED</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
