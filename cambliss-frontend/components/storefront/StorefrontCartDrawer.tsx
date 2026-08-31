"use client";

import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export interface StorefrontCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  itemsCount?: number;
}

export const StorefrontCartDrawer = ({ isOpen, onClose, itemsCount = 0 }: StorefrontCartDrawerProps) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Shopping Bag"
      description={`${itemsCount} item${itemsCount === 1 ? "" : "s"} in your cart`}
      width="md"
      footer={
        itemsCount > 0 ? (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Estimated Subtotal:</span>
              <span className="text-sm font-black text-slate-900">{formatINR(0)}</span>
            </div>
            <p className="text-[10px] text-slate-400">Shipping & taxes calculated at secure checkout</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" isFullWidth onClick={onClose}>
                Continue Shopping
              </Button>
              <Button size="sm" isFullWidth onClick={() => alert("Proceeding to checkout...")}>
                Checkout Now →
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {itemsCount === 0 ? (
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
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Cart items will be rendered here.</p>
        </div>
      )}
    </Drawer>
  );
};
