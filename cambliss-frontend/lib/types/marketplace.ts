/* Marketplace domain types — shared between storefront, seller, and admin */

export interface Store {
  id: string;
  name: string;
  domain: string | null;
  description: string | null;
  sellerTier: "new" | "verified" | "premium";
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  children?: Category[];
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  hsnCode: string | null;
  description: string | null;
  isActive: boolean;
}

export interface ProductListing {
  id: string;
  storeId: string;
  productId: string;
  categoryId: string | null;
  sellingPrice: string; // Decimal as string from API
  baseCurrency: string;
  description: string | null;
  images: string[];
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;

  // Joined data
  product?: Product;
  store?: Store;
  category?: Category;
}

export interface CartItem {
  id: string;
  productListingId: string;
  quantity: number;
  unitPrice: string;
  productListing?: ProductListing;
}

export interface Cart {
  id: string;
  storeId: string;
  items: CartItem[];
}

export interface OrderItem {
  id: string;
  productListingId: string;
  quantity: number;
  unitPrice: string;
  productListing?: ProductListing;
}

export interface Order {
  id: string;
  storeId: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  currency: string;
  trackingNumber: string | null;
  courierPartner: string | null;
  items: OrderItem[];
  createdAt: string;
}

/* API response wrappers */

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
}

/* Storefront-specific view models */

export interface StorefrontProduct {
  listingId: string;
  productId: string;
  name: string;
  description: string | null;
  sellingPrice: string;
  currency: string;
  images: string[];
  storeName: string;
  storeId: string;
  categoryName: string | null;
  categoryId: string | null;
}

export interface StorefrontCategory {
  id: string;
  name: string;
  image: string | null;
  productCount: number;
}
