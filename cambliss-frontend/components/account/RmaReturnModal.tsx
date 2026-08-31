"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export interface RmaItemDetails {
  orderId: string;
  itemId: string;
  itemTitle: string;
  itemPrice: number;
  itemImage: string;
  sellerName: string;
}

export const RmaReturnModal = ({
  isOpen,
  onClose,
  item,
  onSubmitRma,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: RmaItemDetails | null;
  onSubmitRma: (rmaData: { reason: string; comment: string; resolution: "refund" | "replacement" }) => void;
}) => {
  const [reason, setReason] = useState("Damaged in transit / Broken seal");
  const [comment, setComment] = useState("");
  const [resolution, setResolution] = useState<"refund" | "replacement">("refund");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      onSubmitRma({ reason, comment, resolution });
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-[10px] max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-sm text-slate-900">Request Return or Replacement</h3>
            <p className="text-[11px] text-slate-500">Order #{item.orderId} • 100% Escrow Protection Guarantee</p>
          </div>
          <button onClick={onClose} className="text-slate-400 font-bold hover:text-slate-700">✕</button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold mx-auto">
              ✓
            </div>
            <h4 className="font-black text-sm text-slate-900">RMA Request Submitted!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              A pickup agent will be dispatched within 24–48 hours. Escrow refund will be released upon pickup scan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Item Preview */}
            <div className="flex items-center gap-3 p-3 rounded-[6px] bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded bg-white border overflow-hidden shrink-0">
                <img src={item.itemImage} alt={item.itemTitle} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="font-bold text-slate-900 truncate">{item.itemTitle}</h5>
                <span className="font-black text-slate-900">{formatINR(item.itemPrice)}</span>
                <span className="text-[11px] text-slate-400 block">Sold by: {item.sellerName}</span>
              </div>
            </div>

            {/* Resolution Type */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">What resolution do you prefer?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResolution("refund")}
                  className={`p-2.5 rounded-[6px] border text-xs font-bold transition text-center ${
                    resolution === "refund"
                      ? "border-[#404d85] bg-blue-50/50 text-[#404d85]"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  💵 Instant Escrow Refund
                </button>
                <button
                  type="button"
                  onClick={() => setResolution("replacement")}
                  className={`p-2.5 rounded-[6px] border text-xs font-bold transition text-center ${
                    resolution === "replacement"
                      ? "border-[#404d85] bg-blue-50/50 text-[#404d85]"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  🔄 Free Replacement
                </button>
              </div>
            </div>

            {/* Return Reason Selector */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Reason for Return *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] font-medium bg-white focus:border-[#404d85] focus:outline-hidden"
              >
                <option value="Damaged in transit / Broken seal">Damaged in transit / Broken seal</option>
                <option value="Defective / Item not working properly">Defective / Item not working properly</option>
                <option value="Received wrong item or variant">Received wrong item or variant</option>
                <option value="Missing parts or accessories">Missing parts or accessories</option>
                <option value="Item not as described on storefront">Item not as described on storefront</option>
                <option value="Changed mind / No longer needed">Changed mind / No longer needed</option>
              </select>
            </div>

            {/* Comment */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Additional Details & Description</label>
              <textarea
                rows={3}
                placeholder="Describe the issue with the item to expedite RMA approval..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] focus:border-[#404d85] focus:outline-hidden"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-[6px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-[#404d85] hover:bg-[#323d6a] text-white font-black rounded-[6px] transition"
              >
                {isSubmitting ? "Submitting..." : "Submit RMA Return Request"}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
