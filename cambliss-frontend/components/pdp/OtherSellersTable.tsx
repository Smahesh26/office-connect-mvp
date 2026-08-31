"use client";

import Link from "next/link";
import { formatINR, SellerBadge } from "@/components/commerce/CommercePrimitives";

export interface OtherSellerItem {
  sellerId: string;
  sellerName: string;
  sellerTier: "new" | "verified" | "premium";
  rating: number;
  reviewsCount: number;
  condition: string;
  price: number;
  deliveryDays: number;
  shipsFrom: string;
}

export const OtherSellersTable = ({
  offers,
  onAddToCart,
}: {
  offers: OtherSellerItem[];
  onAddToCart: (seller: OtherSellerItem) => void;
}) => {
  if (!offers || offers.length === 0) return null;

  return (
    <section className="space-y-4 pt-8 border-t border-slate-200 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            Compare Other Seller Offers ({offers.length})
          </h2>
          <p className="text-xs text-slate-500">
            Verified marketplace merchants with individual pricing, delivery SLAs, and warranty coverage
          </p>
        </div>
      </div>

      <div className="border border-slate-200 rounded-[8px] overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Seller Information</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Delivery SLA</th>
                <th className="py-3 px-4">Total Price (GST Incl.)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {offers.map((offer) => (
                <tr key={offer.sellerId} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 space-y-0.5">
                    <SellerBadge sellerName={offer.sellerName} sellerTier={offer.sellerTier} />
                    <div className="text-[11px] text-slate-400">
                      ★ {offer.rating.toFixed(1)} ({offer.reviewsCount} reviews) • {offer.shipsFrom}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {offer.condition}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    🚚 {offer.deliveryDays} Days Dispatch
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-black text-sm text-slate-900">
                      {formatINR(offer.price)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onAddToCart(offer)}
                      className="px-4 py-1.5 rounded-[4px] bg-slate-900 hover:bg-[#404d85] text-white font-bold text-xs transition shadow-2xs"
                    >
                      + Add to Cart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
