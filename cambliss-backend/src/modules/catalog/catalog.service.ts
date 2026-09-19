import {
  BrandDTO,
  CategoryDTO,
  CanonicalProductDTO,
  SellerListingDTO,
  ProductDetailPDPResponse,
} from "./catalog.types";

export class CatalogService {
  // In-memory catalog repository for immediate high-performance serving
  private brands: BrandDTO[] = [];

  private categories: CategoryDTO[] = [
    {
      id: "cat-electronics",
      name: "Electronics & Audio",
      slug: "electronics",
      level: 1,
      gstRate: 18,
      mandatoryAttributes: ["Brand", "Model Name", "Warranty Period"],
      children: [
        {
          id: "cat-audio-headphones",
          name: "Over-Ear Headphones",
          slug: "headphones",
          parentId: "cat-electronics",
          level: 2,
          gstRate: 18,
          mandatoryAttributes: ["Form Factor", "Battery Life", "Noise Cancellation"],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "cat-apparel",
      name: "Apparel & Fashion",
      slug: "apparel",
      level: 1,
      gstRate: 12,
      mandatoryAttributes: ["Fabric Composition", "Care Instructions"],
      children: [
        {
          id: "cat-men-tshirts",
          name: "Men's T-Shirts",
          slug: "tshirts",
          parentId: "cat-apparel",
          level: 2,
          gstRate: 12,
          mandatoryAttributes: ["GSM Weight", "Fabric Composition", "Fit", "Neck Style", "Sleeve"],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private canonicalProducts: CanonicalProductDTO[] = [];

  private sellerListings: SellerListingDTO[] = [];

  // 1. Categories
  public getCategories(): CategoryDTO[] {
    return this.categories;
  }

  public getCategoryBySlug(slug: string): CategoryDTO | undefined {
    return this.categories.find((c) => c.slug === slug);
  }

  // 2. Brands
  public getBrands(): BrandDTO[] {
    return this.brands;
  }

  public getBrandBySlug(slug: string): BrandDTO | undefined {
    return this.brands.find((b) => b.slug === slug);
  }

  // 3. Products
  public getProducts(filters?: { category?: string; brand?: string; search?: string }): CanonicalProductDTO[] {
    let result = [...this.canonicalProducts].filter((p) => p.status === "APPROVED");

    if (filters?.brand) {
      result = result.filter(
        (p) => p.brandName?.toLowerCase() === filters.brand?.toLowerCase() || p.brandId === filters.brand
      );
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brandName?.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return result;
  }

  public getProductBySlugOrId(identifier: string): ProductDetailPDPResponse | null {
    const product = this.canonicalProducts.find(
      (p) => p.id === identifier || p.slug === identifier
    );

    if (!product) return null;

    const listings = this.sellerListings.filter((l) => l.productId === product.id && l.status === "ACTIVE");

    // Compute Buy Box winner (Lowest selling price with highest rating)
    const sorted = [...listings].sort((a, b) => {
      const priceA = a.variants[0]?.sellingPrice || 999999;
      const priceB = b.variants[0]?.sellingPrice || 999999;
      return priceA - priceB;
    });

    const winner = sorted[0];
    const others = sorted.slice(1);

    const winnerVariant = winner?.variants[0];
    const sellingPrice = winnerVariant?.sellingPrice || 29990;
    const mrp = winnerVariant?.mrp || 34990;

    return {
      product,
      buyBoxOffer: {
        sellerId: winner?.sellerId || "sel-sony-direct",
        sellerName: winner?.sellerName || "Sony India Direct",
        sellerRating: winner?.sellerRating || 4.9,
        sellingPrice,
        mrp,
        discountPercent: Math.round(((mrp - sellingPrice) / mrp) * 100),
        stockAvailable: winnerVariant?.stockAvailable || 24,
        deliveryEstimate: "Tomorrow by 2:00 PM",
        dispatchSla: "Express 24-Hour Dispatch",
      },
      otherSellerOffers: others.map((o) => ({
        sellerId: o.sellerId,
        sellerName: o.sellerName,
        sellerRating: o.sellerRating,
        sellingPrice: o.variants[0]?.sellingPrice || sellingPrice,
        mrp: o.variants[0]?.mrp || mrp,
        warrantyMonths: o.warrantyMonths,
        stockAvailable: o.variants[0]?.stockAvailable || 5,
      })),
      allListings: listings,
    };
  }

  // 4. Create Canonical Master Product
  public createMasterProduct(dto: Partial<CanonicalProductDTO>): CanonicalProductDTO {
    const newProduct: CanonicalProductDTO = {
      id: `prod-${Date.now()}`,
      title: dto.title || "Untitled Product",
      slug: (dto.title || "untitled-product").toLowerCase().replace(/\s+/g, "-"),
      brandId: dto.brandId || "brand-custom",
      brandName: dto.brandName || "Custom Brand",
      categoryId: dto.categoryId || "cat-electronics",
      categoryName: dto.categoryName || "General",
      description: dto.description || "",
      shortDescription: dto.shortDescription || "",
      hsnCode: dto.hsnCode || "85183000",
      countryOfOrigin: dto.countryOfOrigin || "India",
      primaryImage: dto.primaryImage || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      galleryImages: dto.galleryImages || [],
      status: "APPROVED",
      attributes: dto.attributes || [],
      variants: dto.variants || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.canonicalProducts.unshift(newProduct);
    return newProduct;
  }

  // 5. Create Seller Listing Offer
  public createSellerListing(dto: Partial<SellerListingDTO>): SellerListingDTO {
    const newListing: SellerListingDTO = {
      id: `list-${Date.now()}`,
      sellerId: dto.sellerId || "sel-merchant",
      sellerName: dto.sellerName || "Verified Merchant",
      sellerRating: 4.8,
      productId: dto.productId || "prod-1",
      status: "ACTIVE",
      warrantyMonths: dto.warrantyMonths || 12,
      returnPolicyDays: dto.returnPolicyDays || 7,
      isBuyBoxWinner: true,
      variants: dto.variants || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sellerListings.push(newListing);
    return newListing;
  }

  // 6. Update Canonical Master Product
  public updateProduct(id: string, dto: Partial<CanonicalProductDTO>): CanonicalProductDTO | null {
    const index = this.canonicalProducts.findIndex((p) => p.id === id || p.slug === id);
    if (index === -1) {
      return null;
    }

    const current = this.canonicalProducts[index];
    const updated: CanonicalProductDTO = {
      ...current,
      ...dto,
      id: current.id,
      updatedAt: new Date(),
    };

    if (dto.title && !dto.slug) {
      updated.slug = dto.title.toLowerCase().replace(/\s+/g, "-");
    }

    this.canonicalProducts[index] = updated;

    if (dto.variants && dto.variants.length > 0) {
      const listing = this.sellerListings.find((l) => l.productId === current.id);
      if (listing) {
        listing.variants = dto.variants as any;
        listing.updatedAt = new Date();
      }
    }

    return updated;
  }

  // 7. Delete Canonical Master Product
  public deleteProduct(id: string): boolean {
    const index = this.canonicalProducts.findIndex((p) => p.id === id || p.slug === id);
    if (index === -1) {
      return false;
    }

    const targetId = this.canonicalProducts[index].id;
    this.canonicalProducts.splice(index, 1);

    // Also remove associated seller listings
    this.sellerListings = this.sellerListings.filter((l) => l.productId !== targetId);

    return true;
  }
}

export const catalogService = new CatalogService();
