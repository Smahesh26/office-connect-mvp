"use client";

import Link from "next/link";
import Image from "next/image";

export const StorefrontFooter = () => {
  return (
    <footer className="bg-[#1f2430] text-slate-300 font-sans text-xs border-t border-slate-800 select-none">
      
      {/* Trust Guarantee Band */}
      <div className="border-b border-slate-800 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-xl text-emerald-400">
              🛡️
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">100% Escrow Protection</h5>
              <p className="text-[11px] text-slate-400">Funds held until delivery confirmation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-xl text-blue-400">
              🚚
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">Express 48-Hour Dispatch</h5>
              <p className="text-[11px] text-slate-400">Direct from certified merchant warehouses</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-xl text-amber-400">
              👑
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">Verified Genuine Sellers</h5>
              <p className="text-[11px] text-slate-400">5-Stage KYB & KYC merchant vetting</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-xl text-purple-400">
              💳
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">Secure Multi-Gateway Checkout</h5>
              <p className="text-[11px] text-slate-400">UPI, Cards, NetBanking, Stripe & Razorpay</p>
            </div>
          </div>

        </div>
      </div>

      {/* Main 5-Column Navigation Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        
        {/* Col 1: Brand & Certification */}
        <div className="col-span-2 md:col-span-1 space-y-3">
          <Image
            src="/officeconnectlogo.png"
            alt="Office Connect"
            width={160}
            height={40}
            className="h-8 w-auto brightness-200"
          />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Enterprise multi-vendor commerce platform connecting buyers with verified direct manufacturers and brands.
          </p>
          <div className="text-[10px] text-slate-500 font-mono">
            ISO 27001 Certified • PCI-DSS Level 1
          </div>
        </div>

        {/* Col 2: Customer Care */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">Customer Care</h4>
          <ul className="space-y-2 text-[11px] text-slate-400 font-medium">
            <li><Link href="/orders" className="hover:text-white transition">Track Your Order</Link></li>
            <li><Link href="/returns" className="hover:text-white transition">Returns & RMA Refunds</Link></li>
            <li><Link href="/support" className="hover:text-white transition">24x7 Help Center</Link></li>
            <li><Link href="/support" className="hover:text-white transition">Dispute Resolution Desk</Link></li>
          </ul>
        </div>

        {/* Col 3: Merchant & Sellers */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">Sell on Marketplace</h4>
          <ul className="space-y-2 text-[11px] text-slate-400 font-medium">
            <li><Link href="/vendor-dashboard" className="text-amber-300 font-bold hover:underline">Seller Registration (5-Step)</Link></li>
            <li><Link href="/vendor-dashboard" className="hover:text-white transition">Merchant Seller Portal</Link></li>
            <li><Link href="/vendor-dashboard" className="hover:text-white transition">Fee Schedule & 8.5% Cut</Link></li>
            <li><Link href="/vendor-dashboard" className="hover:text-white transition">Fulfillment by Office Connect</Link></li>
          </ul>
        </div>

        {/* Col 4: Governance & Legal */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">Legal & Compliance</h4>
          <ul className="space-y-2 text-[11px] text-slate-400 font-medium">
            <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
            <li><Link href="/security" className="hover:text-white transition">Security Assessment</Link></li>
            <li><Link href="/gst" className="hover:text-white transition">GST Invoicing Rules</Link></li>
          </ul>
        </div>

        {/* Col 5: Newsletter Subscription */}
        <div className="space-y-3 col-span-2 md:col-span-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">Marketplace Updates</h4>
          <p className="text-[11px] text-slate-400">Subscribe for weekly merchant flash deals and industry insights.</p>
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Enter corporate email..."
              className="w-full h-9 rounded-[6px] bg-slate-800 border border-slate-700 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#6678c1]"
            />
            <button
              type="button"
              className="w-full h-9 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs transition"
            >
              Subscribe
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Copyright & Payment Gateway Badges */}
      <div className="border-t border-slate-800 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 Office Connect Global Inc. All rights reserved. Built with precision multi-vendor architecture.
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold">
            <span>Stripe</span>
            <span>•</span>
            <span>Razorpay</span>
            <span>•</span>
            <span>UPI</span>
            <span>•</span>
            <span>Visa</span>
            <span>•</span>
            <span>Mastercard</span>
          </div>
        </div>
      </div>

    </footer>
  );
};
