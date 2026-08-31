"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import {
  MultiVendorPackageGroup,
  SellerPackage,
  CartLineItem,
} from "@/components/cart/MultiVendorPackageGroup";
import { SavedForLaterShelf } from "@/components/cart/SavedForLaterShelf";
import { CartSummaryCard } from "@/components/cart/CartSummaryCard";
import { getStoredCart } from "@/lib/cart-wishlist";

export default function CartPage() {
  const [packages, setPackages] = useState<SellerPackage[]>([
    {
      sellerId: "seller-aerotech",
      sellerName: "AeroTech Official Direct",
      sellerTier: "premium",
      carrier: "Bluedart Air Express",
      deliveryEstimate: "FREE Delivery by Tomorrow, 1 PM",
      items: [
        {
          id: "item-1",
          productId: "prod-1",
          title: "AeroTech ANC-500 Wireless Studio Noise Canceling Headphones",
          brand: "AeroTech",
          price: 29990,
          originalPrice: 34990,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80",
          variantName: "Midnight Black",
          inStock: true,
        },
      ],
    },
  ]);

  useEffect(() => {
    const stored = getStoredCart();
    if (stored.length > 0) {
      // Group by seller
      const sellerMap: Record<string, CartLineItem[]> = {};
      stored.forEach((item) => {
        const seller = item.sellerName || "Office Connect Direct";
        if (!sellerMap[seller]) sellerMap[seller] = [];
        sellerMap[seller].push({
          id: item.id,
          productId: item.productId,
          title: item.title,
          brand: "Verified Brand",
          price: item.price,
          ...(item.originalPrice ? { originalPrice: item.originalPrice } : {}),
          quantity: item.quantity,
          image: item.image,
          variantName: "Standard",
          inStock: true,
        });
      });

      const newPackages: SellerPackage[] = Object.entries(sellerMap).map(([sellerName, items], idx) => ({
        sellerId: `seller-${idx}`,
        sellerName,
        sellerTier: "verified",
        carrier: "Express Priority Courier",
        deliveryEstimate: "FREE Delivery in 1-2 Days",
        items,
      }));
      setPackages(newPackages);
    }
  }, []);

  // Saved for Later state
  const [savedItems, setSavedItems] = useState<CartLineItem[]>([
    {
      id: "item-saved-1",
      productId: "prod-3",
      title: "Dell UltraSharp 32-inch 4K UHD Thunderbolt Hub USB-C Monitor",
      brand: "Dell",
      price: 78900,
      originalPrice: 89900,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80",
      variantName: "U3224KB Platinum",
      inStock: true,
    },
  ]);

  // Coupon state
  const [couponCode, setCouponCode] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCouponApplied, setIsCouponApplied] = useState<boolean>(false);

  // Calculations
  const activeItems = useMemo(() => {
    return packages.flatMap((pkg) => pkg.items.filter((i) => i.inStock));
  }, [packages]);

  const totalItemCount = useMemo(() => {
    return activeItems.reduce((acc, i) => acc + i.quantity, 0);
  }, [activeItems]);

  const subtotal = useMemo(() => {
    return activeItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  }, [activeItems]);

  const originalTotal = useMemo(() => {
    return activeItems.reduce((acc, i) => acc + (i.originalPrice || i.price) * i.quantity, 0);
  }, [activeItems]);

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    setPackages((prev) =>
      prev.map((pkg) => ({
        ...pkg,
        items: pkg.items.map((item) =>
          item.id === itemId ? { ...item, quantity: newQty } : item
        ),
      }))
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setPackages((prev) =>
      prev
        .map((pkg) => ({
          ...pkg,
          items: pkg.items.filter((item) => item.id !== itemId),
        }))
        .filter((pkg) => pkg.items.length > 0)
    );
  };

  const handleSaveForLater = (itemId: string) => {
    let itemToSave: CartLineItem | null = null;
    packages.forEach((pkg) => {
      const found = pkg.items.find((i) => i.id === itemId);
      if (found) itemToSave = found;
    });

    if (itemToSave) {
      setSavedItems((prev) => [itemToSave!, ...prev]);
      handleRemoveItem(itemId);
    }
  };

  const handleMoveToBag = (savedItem: CartLineItem) => {
    // Add to first package or create package
    setPackages((prev) => {
      if (prev.length > 0) {
        return [
          {
            ...prev[0],
            items: [{ ...savedItem, inStock: true }, ...prev[0].items],
          },
          ...prev.slice(1),
        ];
      } else {
        return [
          {
            sellerId: "seller-default",
            sellerName: "Office Connect Direct",
            sellerTier: "premium",
            carrier: "Bluedart Express",
            deliveryEstimate: "FREE Delivery by Tomorrow",
            items: [{ ...savedItem, inStock: true }],
          },
        ];
      }
    });
    setSavedItems((prev) => prev.filter((i) => i.id !== savedItem.id));
  };

  const handleRemoveSavedItem = (id: string) => {
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleApplyCoupon = (code: string) => {
    if (code === "OFFICE2000") {
      setCouponCode(code);
      setDiscountAmount(2000);
      setIsCouponApplied(true);
      setCouponError(null);
    } else if (code === "SAVE10") {
      setCouponCode(code);
      setDiscountAmount(Math.round(subtotal * 0.1));
      setIsCouponApplied(true);
      setCouponError(null);
    } else {
      setCouponError(`Invalid voucher code "${code}". Try "OFFICE2000" for ₹2,000 off.`);
    }
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 select-none">
        
        {/* Header */}
        <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Multi-Vendor Shopping Bag
            </h1>
            <p className="text-xs text-slate-500">
              Your items are automatically grouped into independent seller packages for direct certified fulfillment.
            </p>
          </div>

          <Link
            href="/storefront"
            className="text-xs font-bold text-[#404d85] hover:underline self-start sm:self-auto"
          >
            ← Continue Shopping
          </Link>
        </div>

        {packages.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-[8px] border border-slate-200 p-12 text-center space-y-4 max-w-xl mx-auto shadow-2xs">
            <div className="text-5xl">🛒</div>
            <h3 className="text-lg font-black text-slate-900">Your Shopping Bag is Empty</h3>
            <p className="text-xs text-slate-500">
              Explore thousands of verified genuine products with 100% Escrow Protection.
            </p>
            <div className="pt-2">
              <Link
                href="/storefront"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[4px] bg-[#404d85] text-white font-bold text-xs hover:bg-[#323d6a] transition"
              >
                Start Shopping Now →
              </Link>
            </div>
          </div>
        ) : (
          /* Multi-Vendor Cart Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Multi-Vendor Seller Packages */}
            <div className="lg:col-span-8 space-y-6">
              
              {packages.map((pkg, idx) => (
                <MultiVendorPackageGroup
                  key={pkg.sellerId}
                  packageIndex={idx + 1}
                  totalPackages={packages.length}
                  sellerPackage={pkg}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onSaveForLater={handleSaveForLater}
                />
              ))}

              {/* Saved for Later Shelf */}
              <SavedForLaterShelf
                items={savedItems}
                onMoveToBag={handleMoveToBag}
                onRemoveItem={handleRemoveSavedItem}
              />

            </div>

            {/* Right Column: Order Summary & Coupon Engine */}
            <div className="lg:col-span-4">
              <CartSummaryCard
                itemCount={totalItemCount}
                subtotal={subtotal}
                originalTotal={originalTotal}
                deliveryFee={0}
                discountAmount={discountAmount}
                onApplyCoupon={handleApplyCoupon}
                couponCode={couponCode}
                couponError={couponError}
                isCouponApplied={isCouponApplied}
              />
            </div>

          </div>
        )}

      </div>
    </StorefrontShell>
  );
}
