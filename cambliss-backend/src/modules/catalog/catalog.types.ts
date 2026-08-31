export interface BrandDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isVerified: boolean;
  website?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  level: number;
  gstRate: number;
  mandatoryAttributes: string[];
  children?: CategoryDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductAttributeDTO {
  id: string;
  productId: string;
  name: string;
  value: string;
  isFilterable: boolean;
}

export interface ProductVariantDTO {
  id: string;
  productId: string;
  title: string;
  sku: string;
  barcode?: string;
  options: Record<string, string>; // e.g. { color: "Black", size: "XL" }
  createdAt: Date;
  updatedAt: Date;
}

export interface CanonicalProductDTO {
  id: string;
  title: string;
  slug: string;
  brandId: string;
  brandName?: string;
  categoryId: string;
  categoryName?: string;
  description: string;
  shortDescription?: string;
  hsnCode: string;
  countryOfOrigin: string;
  primaryImage: string;
  galleryImages: string[];
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  attributes: ProductAttributeDTO[];
  variants: ProductVariantDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerListingVariantDTO {
  id: string;
  sellerListingId: string;
  productVariantId: string;
  sellerSku: string;
  mrp: number;
  sellingPrice: number;
  floorPrice?: number;
  b2bTiers?: Array<{ minQuantity: number; price: number }>;
  stockAvailable: number;
}

export interface SellerListingDTO {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  productId: string;
  status: "ACTIVE" | "INACTIVE" | "PAUSED";
  warrantyMonths?: number;
  returnPolicyDays: number;
  isBuyBoxWinner: boolean;
  variants: SellerListingVariantDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDetailPDPResponse {
  product: CanonicalProductDTO;
  buyBoxOffer: {
    sellerId: string;
    sellerName: string;
    sellerRating: number;
    sellingPrice: number;
    mrp: number;
    discountPercent: number;
    stockAvailable: number;
    deliveryEstimate: string;
    dispatchSla: string;
  };
  otherSellerOffers: Array<{
    sellerId: string;
    sellerName: string;
    sellerRating: number;
    sellingPrice: number;
    mrp: number;
    warrantyMonths?: number;
    stockAvailable: number;
  }>;
  allListings: SellerListingDTO[];
}
