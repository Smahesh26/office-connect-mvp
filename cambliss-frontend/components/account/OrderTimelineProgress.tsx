"use client";

export interface TimelineStep {
  id: string;
  label: string;
  status: "completed" | "current" | "pending";
  timestamp?: string;
  description: string;
  courierMeta?: {
    carrier: string;
    awb: string;
    executiveName?: string;
    executivePhone?: string;
  };
}

export const OrderTimelineProgress = ({
  steps = [
    {
      id: "placed",
      label: "Order placed",
      status: "completed",
      timestamp: "Aug 30, 2026 • 10:14 AM",
      description: "Order received and 100% Escrow Vault authorization created.",
    },
    {
      id: "confirmed",
      label: "Confirmed",
      status: "completed",
      timestamp: "Aug 30, 2026 • 10:45 AM",
      description: "Payment confirmed by bank. Sellers notified for dispatch.",
    },
    {
      id: "packed",
      label: "Packed",
      status: "completed",
      timestamp: "Aug 30, 2026 • 02:30 PM",
      description: "Item inspected for quality and securely packaged in tamper-evident seal.",
    },
    {
      id: "shipped",
      label: "Shipped",
      status: "completed",
      timestamp: "Aug 30, 2026 • 06:15 PM",
      description: "Handed over to Bluedart Air Courier Hub at Bengaluru Airport.",
      courierMeta: {
        carrier: "Bluedart Air Express",
        awb: "BD-98421094",
      },
    },
    {
      id: "out_for_delivery",
      label: "Out for delivery",
      status: "current",
      timestamp: "Today • 08:30 AM",
      description: "Courier executive is out for delivery. Expected arrival before 1:00 PM.",
      courierMeta: {
        carrier: "Bluedart Air",
        awb: "BD-98421094",
        executiveName: "Suresh K.",
        executivePhone: "+91 98450 77123",
      },
    },
    {
      id: "delivered",
      label: "Delivered",
      status: "pending",
      description: "Pending delivery OTP verification at recipient address.",
    },
  ],
}: {
  steps?: TimelineStep[];
}) => {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>🚚</span>
            <span>Live Order Fulfillment Timeline</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Real-time milestone tracking synced with courier telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Out for Delivery Today</span>
          </span>
        </div>
      </div>

      {/* Vertical Timeline Tree */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";
          const isPending = step.status === "pending";

          return (
            <div key={step.id} className="relative group">
              
              {/* Node Icon Indicator */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition ${
                  isCompleted
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-50 shadow-xs"
                    : isCurrent
                    ? "bg-[#404d85] text-white ring-4 ring-[#404d85]/15 animate-pulse"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {isCompleted ? "✓" : isCurrent ? "↓" : idx + 1}
              </div>

              {/* Step Content */}
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4
                    className={`text-xs sm:text-sm font-black uppercase tracking-wide ${
                      isCompleted
                        ? "text-emerald-800"
                        : isCurrent
                        ? "text-[#404d85]"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </h4>
                  {step.timestamp && (
                    <span className="text-[11px] font-mono text-slate-500 font-bold">
                      {step.timestamp}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {step.description}
                </p>

                {/* Courier Executive Meta (if available) */}
                {step.courierMeta && isCurrent && (
                  <div className="mt-2 p-3 rounded-[6px] bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Assigned Delivery Executive:
                      </span>
                      <strong className="text-slate-900 font-bold">
                        {step.courierMeta.executiveName} ({step.courierMeta.carrier})
                      </strong>
                    </div>
                    {step.courierMeta.executivePhone && (
                      <a
                        href={`tel:${step.courierMeta.executivePhone}`}
                        className="px-3 py-1 bg-white border border-slate-300 hover:border-[#404d85] text-[#404d85] font-bold rounded text-xs transition inline-flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <span>📞 Call Rider</span>
                        <span className="font-mono">{step.courierMeta.executivePhone}</span>
                      </a>
                    )}
                  </div>
                )}

                {step.courierMeta?.awb && isCompleted && (
                  <div className="text-[11px] font-mono text-slate-500 pt-0.5">
                    Carrier AWB: <strong className="text-slate-800">{step.courierMeta.awb}</strong> ({step.courierMeta.carrier})
                  </div>
                )}

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
