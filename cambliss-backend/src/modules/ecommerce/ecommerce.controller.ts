import type { Request, Response } from "express";
import { EcommerceService } from "./ecommerce.service";

const service = new EcommerceService();

// Default organization ID — in production this would come from
// subdomain resolution or a config table. For now we use the first org.
const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || "";

async function resolveOrgId(req: Request): Promise<string> {
  if (DEFAULT_ORG_ID) return DEFAULT_ORG_ID;

  // Fallback: look up the first organization in the database
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const org = await prisma.organization.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return org?.id || "";
}

export async function getListings(req: Request, res: Response) {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) {
      res.status(404).json({ message: "No organization found" });
      return;
    }

    const {
      page,
      pageSize,
      categoryId,
      storeId,
      search,
      minPrice,
      maxPrice,
      sortBy,
    } = req.query;

    const result = await service.getListings(orgId, {
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      categoryId: categoryId as string | undefined,
      storeId: storeId as string | undefined,
      search: search as string | undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      sortBy: sortBy as "price_asc" | "price_desc" | "newest" | "name" | undefined,
    });

    res.json(result);
  } catch (error) {
    console.error("[ecommerce] getListings error:", error);
    res.status(500).json({ message: "Failed to fetch listings" });
  }
}

export async function getListingById(req: Request, res: Response) {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) {
      res.status(404).json({ message: "No organization found" });
      return;
    }

    const listingId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const listing = await service.getListingById(orgId, listingId);
    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    res.json(listing);
  } catch (error) {
    console.error("[ecommerce] getListingById error:", error);
    res.status(500).json({ message: "Failed to fetch listing" });
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) {
      res.status(404).json({ message: "No organization found" });
      return;
    }

    const storeId = req.query.storeId as string | undefined;
    const categories = await service.getCategories(orgId, storeId);
    res.json(categories);
  } catch (error) {
    console.error("[ecommerce] getCategories error:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
}

export async function getStores(req: Request, res: Response) {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) {
      res.status(404).json({ message: "No organization found" });
      return;
    }

    const stores = await service.getStores(orgId);
    res.json(stores);
  } catch (error) {
    console.error("[ecommerce] getStores error:", error);
    res.status(500).json({ message: "Failed to fetch stores" });
  }
}

export async function getFeaturedListings(req: Request, res: Response) {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) {
      res.status(404).json({ message: "No organization found" });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
    const listings = await service.getFeaturedListings(orgId, limit);
    res.json(listings);
  } catch (error) {
    console.error("[ecommerce] getFeaturedListings error:", error);
    res.status(500).json({ message: "Failed to fetch featured listings" });
  }
}
