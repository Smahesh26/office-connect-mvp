import { formatINR } from "@/components/commerce/CommercePrimitives";
export { formatINR };

export interface CartStorageItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  sellerName?: string;
  quantity: number;
}

export interface WishlistStorageItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  sellerName?: string;
  rating?: number;
}

export const getStoredCart = (): CartStorageItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("oc_cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCart = (cart: CartStorageItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("oc_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("oc_cart_updated"));
  } catch (err) {
    console.error("Failed to save cart to localStorage:", err);
  }
};

export const addToCartStorage = (item: {
  id: string;
  title: string;
  price: number | string;
  originalPrice?: number | string;
  image: string;
  sellerName?: string;
  quantity?: number;
}) => {
  const current = getStoredCart();
  const numPrice = typeof item.price === "string" ? parseFloat(item.price) : item.price;
  const numOrig = item.originalPrice ? (typeof item.originalPrice === "string" ? parseFloat(item.originalPrice) : item.originalPrice) : undefined;
  const qty = item.quantity ?? 1;

  const existingIdx = current.findIndex((c) => c.productId === item.id || c.id === item.id);
  if (existingIdx >= 0) {
    current[existingIdx].quantity += qty;
  } else {
    current.push({
      id: `cart-${item.id}-${Date.now()}`,
      productId: item.id,
      title: item.title,
      price: numPrice,
      originalPrice: numOrig,
      image: item.image,
      sellerName: item.sellerName || "Office Connect Direct",
      quantity: qty,
    });
  }
  saveCart(current);
};

export const removeFromCartStorage = (id: string) => {
  const current = getStoredCart();
  const updated = current.filter((i) => i.id !== id && i.productId !== id);
  saveCart(updated);
};

export const updateCartQuantityStorage = (id: string, delta: number) => {
  const current = getStoredCart();
  const item = current.find((i) => i.id === id || i.productId === id);
  if (item) {
    item.quantity = Math.max(1, item.quantity + delta);
    saveCart(current);
  }
};

export const getStoredWishlist = (): WishlistStorageItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("oc_wishlist");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveWishlist = (wishlist: WishlistStorageItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("oc_wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("oc_wishlist_updated"));
  } catch (err) {
    console.error("Failed to save wishlist to localStorage:", err);
  }
};

export const isWishlistedStorage = (id: string): boolean => {
  const wishlist = getStoredWishlist();
  return wishlist.some((w) => w.id === id);
};

export const toggleWishlistStorage = (item: {
  id: string;
  title: string;
  price: number | string;
  originalPrice?: number | string;
  image: string;
  sellerName?: string;
  rating?: number;
}): boolean => {
  const current = getStoredWishlist();
  const idx = current.findIndex((w) => w.id === item.id);
  const numPrice = typeof item.price === "string" ? parseFloat(item.price) : item.price;
  const numOrig = item.originalPrice ? (typeof item.originalPrice === "string" ? parseFloat(item.originalPrice) : item.originalPrice) : undefined;

  let nowSaved = false;
  if (idx >= 0) {
    current.splice(idx, 1);
    nowSaved = false;
  } else {
    current.push({
      id: item.id,
      title: item.title,
      price: numPrice,
      originalPrice: numOrig,
      image: item.image,
      sellerName: item.sellerName || "Office Connect Direct",
      rating: item.rating || 4.8,
    });
    nowSaved = true;
  }
  saveWishlist(current);
  return nowSaved;
};
