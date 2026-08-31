"use client";

import Link from "next/link";
import { formatINR, SellerBadge } from "@/components/commerce/CommercePrimitives";

export interface OrderItem {
  id: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  sellerName: string;
  sellerTier: "new" | "verified" | "premium";
}

export interface OrderPackageSummary {
  packageId: string;
  sellerName: string;
  sellerTier: "new" | "verified" | "premium";
  courier: string;
  trackingNumber: string;
  status: "In Transit" | "Delivered" | "Out for Delivery" | "Cancelled";
  estimatedArrival: string;
  items: OrderItem[];
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  totalAmount: number;
  paymentMethod: string;
  packages: OrderPackageSummary[];
}

export const OrderCard = ({
  order,
  onOpenRma,
}: {
  order: CustomerOrder;
  onOpenRma: (item: {
    orderId: string;
    itemId: string;
    itemTitle: string;
    itemPrice: number;
    itemImage: string;
    sellerName: string;
  }) => void;
}) => {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-white overflow-hidden shadow-2xs select-none space-y-0">
      
      {/* Order Top Ribbon */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-4 flex-wrap text-slate-600">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Placed</span>
            <span className="font-bold text-slate-900">{order.date}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Amount</span>
            <span className="font-bold text-slate-900">{formatINR(order.totalAmount)}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Order ID</span>
            <span className="font-mono font-bold text-[#404d85]">{order.orderNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/orders/${order.orderNumber}`}
            className="px-3 py-1.5 rounded-[4px] bg-[#404d85] text-white font-bold hover:bg-[#323d6a] transition"
          >
            Track Packages →
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition"
          >
            Invoice
          </button>
        </div>
      </div>

      {/* Packages Breakdown */}
      <div className="divide-y divide-slate-100 p-4 space-y-4">
        {order.packages.map((pkg) => (
          <div key={pkg.packageId} className="pt-4 first:pt-0 space-y-3">
            
            {/* Package Sub-header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-white text-[10px] font-black px-1.5 py-0.2 rounded">
                  {pkg.packageId}
                </span>
                <SellerBadge sellerName={pkg.sellerName} sellerTier={pkg.sellerTier} />
              </div>

              <div className="flex items-center gap-2">
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  pkg.status === "Delivered"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  ● {pkg.status} ({pkg.estimatedArrival})
                </span>
              </div>
            </div>

            {/* Package Items */}
            {pkg.items.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-2">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded bg-slate-50 border overflow-hidden shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h5 className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h5>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Qty: {item.quantity} • {formatINR(item.price)} each
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenRma({
                        orderId: order.orderNumber,
                        itemId: item.id,
                        itemTitle: item.title,
                        itemPrice: item.price,
                        itemImage: item.image,
                        sellerName: pkg.sellerName,
                      })
                    }
                    className="px-3 py-1 rounded border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold"
                  >
                    Return / Replace
                  </button>
                  <Link
                    href={`/product/${item.id}`}
                    className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                  >
                    Buy Again
                  </Link>
                </div>
              </div>
            ))}

          </div>
        ))}
      </div>

    </div>
  );
};
