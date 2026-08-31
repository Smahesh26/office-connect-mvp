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
    console.warn("[CatalogAPI] Falling back to default products:", err);
    return [
      {
        id: "prod-1",
        title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
        slug: "sony-wh-1000xm5-wireless-noise-canceling-headphones",
        brandId: "brand-sony",
        brandName: "Sony",
        categoryId: "cat-audio-headphones",
        categoryName: "Over-Ear Headphones",
        description: "Industry-leading noise canceling with 2 processors and 8 microphones.",
        hsnCode: "85183000",
        countryOfOrigin: "Japan",
        primaryImage: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
        galleryImages: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"],
        status: "APPROVED",
        attributes: [
          { id: "a1", name: "Form Factor", value: "Over-Ear", isFilterable: true },
          { id: "a2", name: "Battery Life", value: "30 Hours", isFilterable: true },
        ],
        variants: [
          { id: "v1", title: "Midnight Black", sku: "SONY-XM5-BLK", options: { color: "Black" } },
        ],
      },
      {
        id: "prod-2",
        title: "UrbanThreads 240 GSM Heavyweight Oversized French Terry T-Shirt",
        slug: "urbanthreads-240-gsm-heavyweight-oversized-tshirt",
        brandId: "brand-urbanthreads",
        brandName: "UrbanThreads",
        categoryId: "cat-men-tshirts",
        categoryName: "Men's T-Shirts",
        description: "100% Super-Combed Organic Cotton 240 GSM French Terry.",
        hsnCode: "61091000",
        countryOfOrigin: "India",
        primaryImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        galleryImages: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80"],
        status: "APPROVED",
        attributes: [
          { id: "at1", name: "GSM", value: "240 GSM", isFilterable: true },
          { id: "at2", name: "Fit", value: "Relaxed Oversized", isFilterable: true },
        ],
        variants: [
          { id: "vt1", title: "Black / S", sku: "UT-TSHIRT-BLK-S", options: { color: "Black", size: "S" } },
          { id: "vt2", title: "White / M", sku: "UT-TSHIRT-WHT-M", options: { color: "White", size: "M" } },
        ],
      },
    ];
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
    console.warn("[CatalogAPI] Falling back to default brands:", err);
    return [
      { id: "brand-sony", name: "Sony", slug: "sony", isVerified: true },
      { id: "brand-keychron", name: "Keychron", slug: "keychron", isVerified: true },
      { id: "brand-urbanthreads", name: "UrbanThreads", slug: "urbanthreads", isVerified: true },
    ];
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
