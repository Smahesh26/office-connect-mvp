export interface ApiBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isVerified: boolean;
  website?: string;
  description?: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  level: number;
  gstRate: number;
  mandatoryAttributes: string[];
  children?: ApiCategory[];
}

export interface ApiProduct {
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
  attributes: Array<{ id: string; name: string; value: string; isFilterable: boolean }>;
  variants: Array<{ id: string; title: string; sku: string; barcode?: string; options: Record<string, string> }>;
}

export interface ApiPDPResponse {
  product: ApiProduct;
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
}

const API_BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000");

export async function fetchCatalogProducts(params?: {
  category?: string;
  brand?: string;
  search?: string;
}): Promise<ApiProduct[]> {
  try {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.brand) query.append("brand", params.brand);
    if (params?.search) query.append("search", params.search);

    const res = await fetch(`${API_BASE}/api/catalog/products?${query.toString()}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error("Catalog fetch failed");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}

export async function fetchCatalogCategories(): Promise<ApiCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/api/catalog/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("Categories fetch failed");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("[CatalogAPI] Falling back to default categories:", err);
    return [
      {
        id: "cat-electronics",
        name: "Electronics & Audio",
        slug: "electronics",
        level: 1,
        gstRate: 18,
        mandatoryAttributes: ["Driver Size", "ANC"],
      },
      {
        id: "cat-apparel",
        name: "Apparel & Fashion",
        slug: "apparel",
        level: 1,
        gstRate: 12,
        mandatoryAttributes: ["Fabric", "Fit"],
      },
    ];
  }
}

export async function fetchCatalogBrands(): Promise<ApiBrand[]> {
  try {
    const res = await fetch(`${API_BASE}/api/catalog/brands`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("Brands fetch failed");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}

export async function fetchPDPDetails(identifier: string): Promise<ApiPDPResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/catalog/products/${identifier}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("PDP fetch failed");
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn("[CatalogAPI] Falling back to default PDP for:", identifier, err);
    return null;
  }
}
