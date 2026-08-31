import {
  BrandDTO,
  CategoryDTO,
  CanonicalProductDTO,
  SellerListingDTO,
  ProductDetailPDPResponse,
} from "./catalog.types";

export class CatalogService {
  // In-memory catalog repository for immediate high-performance serving
  private brands: BrandDTO[] = [
    {
      id: "brand-aerotech",
      name: "AeroTech",
      slug: "aerotech",
      logoUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80",
      isVerified: true,
      website: "https://aerotech-demo.com",
      description: "Pioneering premium consumer audio and studio acoustic solutions.",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date(),
    },
    {
      id: "brand-keychron",
      name: "Lumina Keyboards",
      slug: "lumina-keyboards",
      logoUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80",
      isVerified: true,
      website: "https://lumina-demo.com",
      description: "Custom wireless mechanical keyboards engineered for Mac and Windows power users.",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date(),
    },
    {
      id: "brand-urbanthreads",
      name: "UrbanStyle",
      slug: "urbanstyle",
      logoUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80",
      isVerified: true,
      website: "https://urbanstyle-demo.com",
      description: "Luxury 240 GSM organic French Terry streetwear and executive apparel.",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date(),
    },
  ];

  private categories: CategoryDTO[] = [
    {
      id: "cat-electronics",
      name: "Electronics & Audio",
      slug: "electronics",
      description: "Noise-canceling headphones, true wireless earbuds, and high-fidelity studio monitors.",
      level: 1,
      gstRate: 18,
      mandatoryAttributes: ["Connector Type", "Driver Size", "Battery Life", "Noise Cancellation"],
      children: [
        {
          id: "cat-audio-headphones",
          name: "Over-Ear Headphones",
          slug: "headphones",
          parentId: "cat-electronics",
          level: 2,
          gstRate: 18,
          mandatoryAttributes: ["Form Factor", "Driver Diameter", "Wireless Version", "Battery Capacity"],
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
      description: "Heavyweight French Terry tees, raw denim, and formal corporate wear.",
      level: 1,
      gstRate: 12,
      mandatoryAttributes: ["Fabric Material", "Fit Type", "Care Instructions"],
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

  private canonicalProducts: CanonicalProductDTO[] = [
    {
      id: "prod-1",
      title: "AeroTech ANC-500 Wireless Studio Noise Canceling Headphones",
      slug: "aerotech-anc-500-wireless-studio-noise-canceling-headphones",
      brandId: "brand-aerotech",
      brandName: "AeroTech",
      categoryId: "cat-audio-headphones",
      categoryName: "Over-Ear Headphones",
      description:
        "The AeroTech ANC-500 wireless noise canceling headphones feature high-performance active noise cancellation with 8 microphones, Auto NC Optimizer, and 30-hour battery life with quick charging.",
      shortDescription: "High-performance noise canceling with dual processors and 8 microphones.",
      hsnCode: "85183000",
      countryOfOrigin: "Japan",
      primaryImage: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
      galleryImages: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
      ],
      status: "APPROVED",
      attributes: [
        { id: "attr-1", productId: "prod-1", name: "Form Factor", value: "Over-Ear", isFilterable: true },
        { id: "attr-2", productId: "prod-1", name: "Battery Life", value: "30 Hours", isFilterable: true },
        { id: "attr-3", productId: "prod-1", name: "Noise Cancellation", value: "Active (Auto NC Optimizer)", isFilterable: true },
        { id: "attr-4", productId: "prod-1", name: "Bluetooth Version", value: "5.2 with LDAC & Multipoint", isFilterable: false },
      ],
      variants: [
        {
          id: "var-xm5-blk",
          productId: "prod-1",
          title: "Midnight Black",
          sku: "AEROTECH-ANC500-BLK",
          barcode: "89012481001",
          options: { color: "Midnight Black" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "var-xm5-slv",
          productId: "prod-1",
          title: "Platinum Silver",
          sku: "AEROTECH-ANC500-SLV",
          barcode: "89012481002",
          options: { color: "Platinum Silver" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "prod-2",
      title: "UrbanThreads 240 GSM Heavyweight Oversized French Terry T-Shirt",
      slug: "urbanthreads-240-gsm-heavyweight-oversized-tshirt",
      brandId: "brand-urbanthreads",
      brandName: "UrbanThreads",
      categoryId: "cat-men-tshirts",
      categoryName: "Men's T-Shirts",
      description:
        "Engineered for luxury streetwear and daily executive comfort, the UrbanThreads 240 GSM Heavyweight T-Shirt sets the gold standard for oversized apparel. Built with high-density combed yarn and reactive dyes that stay vibrant after 50+ wash cycles.",
      shortDescription: "100% Super-Combed Organic Cotton 240 GSM French Terry.",
      hsnCode: "61091000",
      countryOfOrigin: "India",
      primaryImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      galleryImages: [
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80",
      ],
      status: "APPROVED",
      attributes: [
        { id: "attr-t1", productId: "prod-2", name: "GSM", value: "240 GSM", isFilterable: true },
        { id: "attr-t2", productId: "prod-2", name: "Fit", value: "Relaxed Oversized", isFilterable: true },
        { id: "attr-t3", productId: "prod-2", name: "Fabric", value: "100% Organic Combed Cotton", isFilterable: true },
      ],
      variants: [
        { id: "var-t-blk-s", productId: "prod-2", title: "Black / S", sku: "UT-TSHIRT-BLK-S", barcode: "890124810101", options: { color: "Black", size: "S" }, createdAt: new Date(), updatedAt: new Date() },
        { id: "var-t-blk-m", productId: "prod-2", title: "Black / M", sku: "UT-TSHIRT-BLK-M", barcode: "890124810102", options: { color: "Black", size: "M" }, createdAt: new Date(), updatedAt: new Date() },
        { id: "var-t-wht-m", productId: "prod-2", title: "White / M", sku: "UT-TSHIRT-WHT-M", barcode: "890124810202", options: { color: "White", size: "M" }, createdAt: new Date(), updatedAt: new Date() },
        { id: "var-t-blu-l", productId: "prod-2", title: "Blue / L", sku: "UT-TSHIRT-BLU-L", barcode: "890124810303", options: { color: "Blue", size: "L" }, createdAt: new Date(), updatedAt: new Date() },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private sellerListings: SellerListingDTO[] = [
    {
      id: "list-1",
      sellerId: "sel-sony-direct",
      sellerName: "Sony India Direct",
      sellerRating: 4.9,
      productId: "prod-1",
      status: "ACTIVE",
      warrantyMonths: 12,
      returnPolicyDays: 7,
      isBuyBoxWinner: true,
      variants: [
        {
          id: "lv-1",
          sellerListingId: "list-1",
          productVariantId: "var-xm5-blk",
          sellerSku: "SONY-DIR-XM5-BLK",
          mrp: 34990,
          sellingPrice: 29990,
          floorPrice: 28990,
          stockAvailable: 24,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "list-2",
      sellerId: "sel-audio-hub",
      sellerName: "AudioPhile Hub India",
      sellerRating: 4.7,
      productId: "prod-1",
      status: "ACTIVE",
      warrantyMonths: 12,
      returnPolicyDays: 7,
      isBuyBoxWinner: false,
      variants: [
        {
          id: "lv-2",
          sellerListingId: "list-2",
          productVariantId: "var-xm5-blk",
          sellerSku: "AUD-XM5-BLK",
          mrp: 34990,
          sellingPrice: 30490,
          floorPrice: 29500,
          stockAvailable: 8,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

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
}

export const catalogService = new CatalogService();
