"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import {
  getStoredCart,
  removeFromCartStorage,
  updateCartQuantityStorage,
  CartStorageItem,
  formatINR,
} from "@/lib/cart-wishlist";

export interface StorefrontCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorefrontCartDrawer = ({ isOpen, onClose }: StorefrontCartDrawerProps) => {
  const [items, setItems] = useState<CartStorageItem[]>([]);

  const reloadCart = () => {
    setItems(getStoredCart());
  };

  useEffect(() => {
    if (isOpen) {
      reloadCart();
    }
    window.addEventListener("oc_cart_updated", reloadCart);
    return () => {
      window.removeEventListener("oc_cart_updated", reloadCart);
    };
  }, [isOpen]);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Shopping Bag"
      description={`${totalCount} item${totalCount === 1 ? "" : "s"} in your cart`}
      width="md"
      footer={
        items.length > 0 ? (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Estimated Subtotal:</span>
              <span className="text-sm font-black text-slate-900">{formatINR(subtotal)}</span>
            </div>
            <p className="text-[10px] text-slate-400">Shipping & GST calculated at checkout</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" isFullWidth onClick={onClose}>
                Continue Shopping
              </Button>
              <Link href="/cart" className="w-full" onClick={onClose}>
                <Button size="sm" isFullWidth variant="primary">
                  View Full Cart Page →
                </Button>
              </Link>
            </div>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl text-slate-400">
            🛒
          </div>
          <h4 className="text-sm font-black text-slate-900">Your shopping bag is empty</h4>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Explore thousands of verified products from top marketplace sellers and add them to your cart.
          </p>
          <Button size="sm" variant="primary" onClick={onClose}>
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
              <Link href={`/product/${item.productId}`} onClick={onClose} className="w-16 h-16 rounded bg-slate-50 overflow-hidden border border-slate-100 shrink-0 block">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0 space-y-1">
                <Link href={`/product/${item.productId}`} onClick={onClose} className="block">
                  <h5 className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-[#404d85] transition">
                    {item.title}
                  </h5>
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{formatINR(item.price)}</span>
                  <span className="text-[10px] text-slate-400">{item.sellerName}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center border border-slate-200 rounded text-xs bg-white">
                    <button
                      type="button"
                      onClick={() => updateCartQuantityStorage(item.id, -1)}
                      className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      −
                    </button>
                    <span className="px-2 font-bold text-slate-800">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantityStorage(item.id, 1)}
                      className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCartStorage(item.id)}
                    className="text-[11px] font-bold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
};
