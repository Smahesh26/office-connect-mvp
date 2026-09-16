import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";

interface CatalogQueryParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  storeId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "name";
}

export class EcommerceService {
  /**
   * Get active product listings for the storefront.
   * Joins Product + Store + Category for display.
   */
  async getListings(organizationId: string, params: CatalogQueryParams) {
    const {
      page = 1,
      pageSize = 24,
      categoryId,
      storeId,
      search,
      minPrice,
      maxPrice,
      sortBy = "newest",
    } = params;

    const where: Prisma.ProductListingWhereInput = {
      organizationId,
      isActive: true,
      product: { isActive: true },
      store: { isActive: true },
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (storeId) {
      where.storeId = storeId;
    }

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: "insensitive" } } },
        { description: { contains: search, mode: "insensitive" } },
        { product: { sku: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.sellingPrice = {};
      if (minPrice !== undefined) {
        where.sellingPrice.gte = new Prisma.Decimal(minPrice);
      }
      if (maxPrice !== undefined) {
        where.sellingPrice.lte = new Prisma.Decimal(maxPrice);
      }
    }

    let orderBy: Prisma.ProductListingOrderByWithRelationInput;
    switch (sortBy) {
      case "price_asc":
        orderBy = { sellingPrice: "asc" };
        break;
      case "price_desc":
        orderBy = { sellingPrice: "desc" };
        break;
      case "name":
        orderBy = { product: { name: "asc" } };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const skip = (page - 1) * pageSize;

    const [listings, total] = await Promise.all([
      prisma.productListing.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              hsnCode: true,
              description: true,
              isActive: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              domain: true,
              description: true,
              sellerTier: true,
              isFeatured: true,
              isActive: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
              parentId: true,
            },
          },
        },
      }),
      prisma.productListing.count({ where }),
    ]);

    return {
      data: listings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single product listing by ID.
   */
  async getListingById(organizationId: string, listingId: string) {
    return prisma.productListing.findFirst({
      where: {
        id: listingId,
        organizationId,
        isActive: true,
      },
      include: {
        product: true,
        store: {
          select: {
            id: true,
            name: true,
            domain: true,
            description: true,
            sellerTier: true,
            isFeatured: true,
          },
        },
        category: true,
      },
    });
  }

  /**
   * Get all categories for a given organization, with product counts.
   */
  async getCategories(organizationId: string, storeId?: string) {
    const where: Prisma.CategoryWhereInput = {
      organizationId,
    };

    if (storeId) {
      where.storeId = storeId;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            productListings: {
              where: { isActive: true },
            },
          },
        },
        children: {
          include: {
            _count: {
              select: {
                productListings: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      image: cat.image,
      parentId: cat.parentId,
      productCount: cat._count.productListings,
      children: cat.children.map((child) => ({
        id: child.id,
        name: child.name,
        description: child.description,
        image: child.image,
        parentId: child.parentId,
        productCount: child._count.productListings,
      })),
    }));
  }

  /**
   * Get all active stores.
   */
  async getStores(organizationId: string) {
    return prisma.store.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        domain: true,
        description: true,
        sellerTier: true,
        isFeatured: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            productListings: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    });
  }

  /**
   * Get featured/promoted listings for the homepage.
   */
  async getFeaturedListings(organizationId: string, limit: number = 8) {
    return prisma.productListing.findMany({
      where: {
        organizationId,
        isActive: true,
        product: { isActive: true },
        store: { isActive: true, isFeatured: true },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            description: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            sellerTier: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Create a new ecommerce product and listing.
   */
  async createListing(
    organizationId: string,
    data: {
      name: string;
      description?: string;
      sellingPrice: number;
      categoryId?: string;
      storeId?: string;
      sku?: string;
      images?: string[];
      hsnCode?: string;
    }
  ) {
    const product = await prisma.product.create({
      data: {
        organizationId,
        name: data.name,
        sku: data.sku || `SKU-${Date.now()}`,
        hsnCode: data.hsnCode || "8471",
        description: data.description || "",
        unitPrice: new Prisma.Decimal(data.sellingPrice),
        isActive: true,
      },
    });

    let storeId = data.storeId;
    if (!storeId) {
      const existingStore = await prisma.store.findFirst({
        where: { organizationId },
      });
      if (existingStore) {
        storeId = existingStore.id;
      } else {
        const newStore = await prisma.store.create({
          data: {
            organizationId,
            name: "Merchant Storefront",
          },
        });
        storeId = newStore.id;
      }
    }

    const listing = await prisma.productListing.create({
      data: {
        organizationId,
        productId: product.id,
        storeId,
        categoryId: data.categoryId || undefined,
        sellingPrice: new Prisma.Decimal(data.sellingPrice),
        description: data.description || "",
        images: data.images || [],
        isActive: true,
      },
      include: {
        product: true,
        category: true,
        store: true,
      },
    });

    return listing;
  }

  /**
   * Update an ecommerce product listing.
   */
  async updateListing(
    listingId: string,
    updates: {
      name?: string;
      description?: string;
      sellingPrice?: number;
      categoryId?: string;
      images?: string[];
      isActive?: boolean;
    },
    organizationId?: string
  ) {
    const existing = await prisma.productListing.findUnique({
      where: { id: listingId },
      include: { product: true },
    });

    if (!existing) {
      return null;
    }

    if (organizationId && existing.organizationId !== organizationId) {
      throw new Error("Unauthorized to edit this product listing");
    }

    if (updates.name || updates.description) {
      await prisma.product.update({
        where: { id: existing.productId },
        data: {
          ...(updates.name ? { name: updates.name } : {}),
          ...(updates.description ? { description: updates.description } : {}),
          ...(updates.sellingPrice ? { unitPrice: new Prisma.Decimal(updates.sellingPrice) } : {}),
        },
      });
    }

    const listingUpdateData: Prisma.ProductListingUpdateInput = {};
    if (updates.sellingPrice !== undefined) {
      listingUpdateData.sellingPrice = new Prisma.Decimal(updates.sellingPrice);
    }
    if (updates.description !== undefined) {
      listingUpdateData.description = updates.description;
    }
    if (updates.categoryId !== undefined) {
      listingUpdateData.category = updates.categoryId ? { connect: { id: updates.categoryId } } : { disconnect: true };
    }
    if (updates.images !== undefined) {
      listingUpdateData.images = updates.images;
    }
    if (updates.isActive !== undefined) {
      listingUpdateData.isActive = updates.isActive;
    }

    return prisma.productListing.update({
      where: { id: listingId },
      data: listingUpdateData,
      include: {
        product: true,
        category: true,
        store: true,
      },
    });
  }

  /**
   * Delete an ecommerce product listing (soft delete so orders don't break).
   */
  async deleteListing(listingId: string, organizationId?: string) {
    const existing = await prisma.productListing.findUnique({
      where: { id: listingId },
    });

    if (!existing) {
      return false;
    }

    if (organizationId && existing.organizationId !== organizationId) {
      throw new Error("Unauthorized to delete this product listing");
    }

    await prisma.productListing.update({
      where: { id: listingId },
      data: { isActive: false },
    });

    return true;
  }
}
