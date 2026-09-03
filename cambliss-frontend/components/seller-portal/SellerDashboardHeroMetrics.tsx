"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export const SellerDashboardHeroMetrics = ({
  onNavigateToOrders,
  onNavigateToInventory,
}: {
  onNavigateToOrders: () => void;
  onNavigateToInventory: () => void;
}) => {
  const topProducts = [
    {
      id: "p1",
      name: "Hisense VisionBook Pro 16 AI Workstation Laptop",
      sku: "HC-VB16-I9-4070",
      unitsSold: 14,
      revenue: 2099860,
      stock: 18,
      buyBoxRate: "99.1%",
    },
    {
      id: "p2",
      name: "Hisense Infinity AIO 27\" 4K All-In-One Desktop PC",
      sku: "HC-AIO27-I7-4K",
      unitsSold: 18,
      revenue: 1529820,
      stock: 22,
      buyBoxRate: "98.4%",
    },
    {
      id: "p3",
      name: "Hisense UltraView 34-Inch Curved WQHD USB-C Monitor",
      sku: "HC-UV34-WQHD-165",
      unitsSold: 26,
      revenue: 1013740,
      stock: 35,
      buyBoxRate: "99.5%",
    },
  ];

  const recentOrders = [
    {
      orderId: "HC-90412",
      customer: "Tech Lead, Enterprise Cloud (Bengaluru)",
      items: "Hisense VisionBook Pro 16 (Core i9 / RTX 4070 / 32GB)",
      amount: 149990,
      status: "Ready to Ship",
      statusColor: "bg-amber-50 text-amber-800 border-amber-200",
      time: "18 mins ago",
    },
    {
      orderId: "HC-90408",
      customer: "TCS Systems Architecture Team (Hyderabad)",
      items: "Hisense Infinity AIO 27\" 4K Desktop Computer",
      amount: 84990,
      status: "New Order",
      statusColor: "bg-blue-50 text-blue-800 border-blue-200",
      time: "45 mins ago",
    },
    {
      orderId: "HC-90392",
      customer: "Rajesh V. (Delhi NCR)",
      items: "Hisense UltraView 34\" Curved WQHD Monitor",
      amount: 38990,
      status: "Shipped",
      statusColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      time: "2 hours ago",
    },
  ];

  return (
    <div className="space-y-6 select-none font-sans text-slate-900">
      
      {/* 8-Card Hero Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* 1. Today's Sales */}
        <div className="p-4 rounded-[8px] border border-slate-200 bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Today&apos;s Sales
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatINR(184980)}
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 block">
            ↑ +18.4% vs yesterday
          </span>
        </div>

        {/* 2. Today's Orders */}
        <div className="p-4 rounded-[8px] border border-slate-200 bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Today&apos;s Units
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            3 Systems
          </div>
          <span className="text-[11px] font-medium text-slate-500 block">
            100% dispatched within SLA
          </span>
        </div>

        {/* 3. MTD Revenue */}
        <div className="p-4 rounded-[8px] border border-slate-200 bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            MTD Revenue
          </span>
          <div className="text-xl sm:text-2xl font-bold text-[#404d85]">
            {formatINR(1488440)}
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 block">
            28 systems & monitors sold
          </span>
        </div>

        {/* 4. Pending Orders */}
        <div
          onClick={onNavigateToOrders}
          className="p-4 rounded-[8px] border border-amber-300 bg-amber-50/50 hover:bg-amber-50 cursor-pointer shadow-2xs space-y-1 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
            <span>Pending Orders</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold text-[9px]">ACTION</span>
          </span>
          <div className="text-xl sm:text-2xl font-bold text-amber-900">
            2 Awaiting Dispatch
          </div>
          <span className="text-[11px] font-medium text-amber-800 block">
            Process labels & manifest →
          </span>
        </div>

        {/* 5. Low Stock */}
        <div
          onClick={onNavigateToInventory}
          className="p-4 rounded-[8px] border border-slate-200 bg-white hover:border-red-300 cursor-pointer shadow-2xs space-y-1 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Low Stock SKUs
          </span>
          <div className="text-xl sm:text-2xl font-bold text-red-600">
            1 SKU Low
          </div>
          <span className="text-[11px] font-medium text-slate-500 block">
            Hisense EliteDesk (8 left)
          </span>
        </div>

        {/* 6. Returns Rate */}
        <div className="p-4 rounded-[8px] border border-slate-200 bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Return Rate
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            0.2%
          </div>
          <span className="text-[11px] font-bold text-emerald-700 block">
            ✓ Elite Merchant Standard
          </span>
        </div>

        {/* 7. Store Conversion */}
        <div className="p-4 rounded-[8px] border border-slate-200 bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Store Conversion
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            4.18%
          </div>
          <span className="text-[11px] font-bold text-emerald-700 block">
            ↑ +0.4% this week
          </span>
        </div>

        {/* 8. Upcoming Settlement */}
        <div className="p-4 rounded-[8px] border border-emerald-300 bg-emerald-50/50 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
            Upcoming Settlement
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-900">
            {formatINR(342100)}
          </div>
          <span className="text-[11px] font-bold text-emerald-800 block">
            Bank payout on Sept 2
          </span>
        </div>

      </div>

      {/* 2-Column: Top Products & Recent Orders Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 Cols: Top Performing Products */}
        <div className="lg:col-span-7 rounded-[8px] border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Top Selling Products
            </h3>
            <span className="text-xs text-slate-400">Past 30 Days</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-extrabold text-[10px] uppercase">
                  <th className="pb-2">Product Name</th>
                  <th className="pb-2 text-right">Units</th>
                  <th className="pb-2 text-right">Revenue</th>
                  <th className="pb-2 text-right">BuyBox</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {topProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3">
                      <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                      <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-800">{p.unitsSold}</td>
                    <td className="py-3 text-right font-black text-slate-900">{formatINR(p.revenue)}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px]">
                        {p.buyBoxRate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Recent Orders Live Feed */}
        <div className="lg:col-span-5 rounded-[8px] border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Recent Orders Feed
            </h3>
            <button
              type="button"
              onClick={onNavigateToOrders}
              className="text-xs font-bold text-[#404d85] hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {recentOrders.map((ord) => (
              <div
                key={ord.orderId}
                className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-slate-900">{ord.orderId}</span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${ord.statusColor}`}>
                    {ord.status}
                  </span>
                </div>
                <div className="font-bold text-slate-800 line-clamp-1">{ord.items}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>{ord.customer} • {ord.time}</span>
                  <strong className="font-black text-slate-900">{formatINR(ord.amount)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
