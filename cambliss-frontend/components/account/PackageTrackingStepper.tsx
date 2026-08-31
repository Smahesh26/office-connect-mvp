"use client";

export interface TransitLogEntry {
  timestamp: string;
  location: string;
  activity: string;
}

export type TrackingStage = "placed" | "dispatched" | "in_transit" | "out_for_delivery" | "delivered";

export const PackageTrackingStepper = ({
  currentStage,
  logs,
  courierName,
  trackingNumber,
  estimatedArrival,
}: {
  currentStage: TrackingStage;
  logs: TransitLogEntry[];
  courierName: string;
  trackingNumber: string;
  estimatedArrival: string;
}) => {
  const stages: { key: TrackingStage; label: string; icon: string }[] = [
    { key: "placed", label: "Order Confirmed", icon: "✓" },
    { key: "dispatched", label: "Dispatched from Hub", icon: "📦" },
    { key: "in_transit", label: "In Transit", icon: "✈️" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: "🚚" },
    { key: "delivered", label: "Delivered", icon: "🏠" },
  ];

  const stageOrder: TrackingStage[] = ["placed", "dispatched", "in_transit", "out_for_delivery", "delivered"];
  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-6 space-y-6 select-none shadow-2xs">
      
      {/* Header SLA & Courier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <span className="text-xs text-slate-500 font-medium">Estimated Arrival:</span>
          <h3 className="text-sm sm:text-base font-black text-slate-900">{estimatedArrival}</h3>
        </div>

        <div className="text-xs sm:text-right">
          <span className="text-slate-500">Carrier: </span>
          <strong className="text-slate-900">{courierName}</strong>
          <p className="font-mono text-[11px] text-[#404d85] font-bold">AWB: {trackingNumber}</p>
        </div>
      </div>

      {/* Visual Stepper Bar */}
      <div className="py-2">
        <div className="relative flex items-center justify-between">
          
          {/* Background Connecting Line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-0" />
          
          {/* Active Progress Connecting Line */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#404d85] transition-all duration-500 -z-0"
            style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
          />

          {stages.map((st, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={st.key} className="flex flex-col items-center gap-1.5 z-10">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isCompleted
                      ? "bg-[#404d85] text-white shadow-xs"
                      : "bg-white border-2 border-slate-300 text-slate-400"
                  } ${isCurrent ? "ring-4 ring-blue-100 scale-110" : ""}`}
                >
                  {isCompleted ? st.icon : idx + 1}
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] text-center max-w-[70px] sm:max-w-[85px] leading-tight font-bold ${
                    isCompleted ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}

        </div>
      </div>

      {/* Detailed Checkpoint Logs */}
      {logs.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            Detailed Transit Activity Log
          </h4>

          <div className="space-y-3 pl-2 border-l-2 border-slate-200">
            {logs.map((log, i) => (
              <div key={i} className="text-xs space-y-0.5 relative pl-3">
                <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-[#404d85]" />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-slate-800">{log.activity}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-500">{log.location}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
