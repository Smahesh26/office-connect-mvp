"use client";

export const AdminMarketingDomain = ({
  subView,
}: {
  subView: "coupons" | "promotions" | "banners" | "featured";
}) => {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none text-xs">
      
      {/* 1. COUPONS */}
      {subView === "coupons" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Marketplace Coupons & Promotional Vouchers
              </h3>
              <p className="text-xs text-slate-500">Global and merchant co-funded discount vouchers</p>
            </div>
            <button
              type="button"
              onClick={() => alert("Creating new coupon...")}
              className="px-3 py-1.5 bg-[#404d85] text-white font-bold rounded text-xs"
            >
              + Create Coupon Code
            </button>
          </div>

          <div className="p-4 rounded border bg-slate-50 flex items-center justify-between">
            <div>
              <span className="font-black text-slate-900 text-sm">OFFICE2000</span>
              <p className="text-slate-500 text-[11px]">Flat ₹2,000 OFF on orders above ₹10,000</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              Active (2,412 Redemptions)
            </span>
          </div>
        </div>
      )}

      {/* 2. PROMOTIONS & 3. BANNERS & 4. FEATURED */}
      {(subView === "promotions" || subView === "banners" || subView === "featured") && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Marketing Assets & Homepage Banners
            </h3>
            <p className="text-xs text-slate-500">Configure editorial showcases, flash sales, and top visual carousel</p>
          </div>
          <div className="p-4 rounded bg-slate-50 border space-y-2">
            <span className="font-bold text-slate-900">Featured Flagship Campaign: Sony Audio Fest 2026</span>
            <p className="text-slate-600 text-[11px]">
              Active on the storefront homepage hero with instant link to `/brand/sony`.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
