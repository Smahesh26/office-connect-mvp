"use client";

import { useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { CartPackageGroup, SellerCartPackage, CartItem } from "@/components/cart/CartPackageGroup";
import { CartOrderSummary } from "@/components/cart/CartOrderSummary";
import { ProductCard } from "@/components/commerce/CommercePrimitives";

export default function ShoppingCartPage() {
  const [packages, setPackages] = useState<SellerCartPackage[]>([
    {
      sellerId: "v-office-direct",
      sellerName: "Office Connect Direct",
      sellerTier: "premium",
      deliveryEstimate: "Tomorrow by 2:00 PM",
      shippingFee: 0,
      items: [
        {
          id: "c-item-1",
          title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones (Midnight Black)",
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
          price: 29990,
          originalPrice: 34990,
          quantity: 1,
          sellerId: "v-office-direct",
          sellerName: "Office Connect Direct",
          sellerTier: "premium",
          deliveryEstimate: "Tomorrow by 2:00 PM",
          shippingFee: 0,
          stockQty: 24,
        },
      ],
    },
    {
      sellerId: "v-glow-beauty",
      sellerName: "Glow Beauty Organics",
      sellerTier: "premium",
      deliveryEstimate: "2 Days (Wednesday)",
      shippingFee: 0,
      items: [
        {
          id: "c-item-2",
          title: "Glow Beauty Damask Rose Organic Botanical Hydrating Facial Serum (50ml)",
          image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
          price: 2499,
          originalPrice: 3200,
          quantity: 2,
          sellerId: "v-glow-beauty",
          sellerName: "Glow Beauty Organics",
          sellerTier: "premium",
          deliveryEstimate: "2 Days (Wednesday)",
          shippingFee: 0,
          stockQty: 18,
        },
      ],
    },
  ]);

  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [promoDiscount, setPromoDiscount] = useState(0);

  const handleUpdateQty = (itemId: string, newQty: number) => {
    setPackages((prev) =>
      prev.map((pkg) => ({
        ...pkg,
        items: pkg.items.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)),
      }))
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setPackages((prev) =>
      prev
        .map((pkg) => ({
          ...pkg,
          items: pkg.items.filter((i) => i.id !== itemId),
        }))
        .filter((pkg) => pkg.items.length > 0)
    );
  };

  const handleSaveForLater = (itemId: string) => {
    let savedItem: CartItem | undefined;
    packages.forEach((pkg) => {
      const match = pkg.items.find((i) => i.id === itemId);
      if (match) savedItem = match;
    });

    if (savedItem) {
      setSavedForLater((prev) => [...prev, savedItem!]);
      handleRemoveItem(itemId);
    }
  };

  const handleMoveToCart = (item: CartItem) => {
    setSavedForLater((prev) => prev.filter((i) => i.id !== item.id));
    setPackages((prev) => {
      const existingPkg = prev.find((p) => p.sellerId === item.sellerId);
      if (existingPkg) {
        return prev.map((p) =>
          p.sellerId === item.sellerId ? { ...p, items: [...p.items, item] } : p
        );
      } else {
        return [
          ...prev,
          {
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            sellerTier: item.sellerTier,
            deliveryEstimate: item.deliveryEstimate,
            shippingFee: item.shippingFee,
            items: [item],
          },
        ];
      }
    });
  };

  // Calculations
  const allCartItems = packages.flatMap((p) => p.items);
  const itemsSubtotal = allCartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingTotal = packages.reduce((acc, p) => acc + p.shippingFee, 0);
  const taxTotal = Math.round(itemsSubtotal * 0.18);
  const calculatedTotal = itemsSubtotal + shippingTotal - promoDiscount;

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 select-none">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/storefront" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Shopping Bag</span>
        </nav>

        <div className="flex items-baseline justify-between pb-4 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Multi-Vendor Shopping Bag ({allCartItems.length} {allCartItems.length === 1 ? "Item" : "Items"})
          </h1>
          <Link href="/categories" className="text-xs font-bold text-[#404d85] hover:underline">
            ← Continue Shopping
          </Link>
        </div>

        {allCartItems.length === 0 ? (
          /* Empty Bag State */
          <div className="p-12 text-center border border-dashed border-slate-300 rounded-[8px] bg-slate-50 space-y-4">
            <span className="text-4xl">🛍️</span>
            <h3 className="text-lg font-black text-slate-900">Your shopping bag is empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Explore thousands of verified products from direct merchants with 100% escrow protection.
            </p>
            <Link
              href="/categories"
              className="inline-block px-6 py-2.5 rounded-[6px] bg-[#404d85] text-white font-bold text-xs shadow-xs"
            >
              Explore Departments →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Multi-Seller Packages (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {packages.map((pkg, idx) => (
                <CartPackageGroup
                  key={pkg.sellerId}
                  pkg={pkg}
                  packageIndex={idx}
                  onUpdateQty={handleUpdateQty}
                  onRemoveItem={handleRemoveItem}
                  onSaveForLater={handleSaveForLater}
                />
              ))}

              {/* Saved For Later Shelf */}
              {savedForLater.length > 0 && (
                <div className="pt-6 space-y-4 border-t border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Saved for Later ({savedForLater.length} Items)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedForLater.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-[8px] border border-slate-200 bg-white flex items-center justify-between gap-3"
                      >
                        <div className="w-12 h-12 rounded bg-slate-50 border overflow-hidden shrink-0">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>
                          <span className="text-xs font-black text-slate-900">₹{item.price.toLocaleString()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMoveToCart(item)}
                          className="px-3 py-1.5 rounded bg-slate-100 hover:bg-[#404d85] text-slate-800 hover:text-white text-xs font-bold transition"
                        >
                          Move to Bag
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Order Summary (4 cols) */}
            <div className="lg:col-span-4">
              <CartOrderSummary
                itemsSubtotal={itemsSubtotal}
                shippingTotal={shippingTotal}
                discountTotal={promoDiscount}
                taxTotal={taxTotal}
                total={calculatedTotal}
                packageCount={packages.length}
                onApplyCoupon={() => setPromoDiscount(Math.round(itemsSubtotal * 0.1))}
              />
            </div>

          </div>
        )}

      </div>
    </StorefrontShell>
  );
}
