import type { Request, Response } from "express";
import { catalogService } from "./catalog.service";

export class CatalogController {
  // GET /api/catalog/categories
  public getCategories(_req: Request, res: Response): void {
    try {
      const categories = catalogService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/catalog/brands
  public getBrands(_req: Request, res: Response): void {
    try {
      const brands = catalogService.getBrands();
      res.json({ success: true, data: brands });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/catalog/products
  public getProducts(req: Request, res: Response): void {
    try {
      const { category, brand, search } = req.query;
      const products = catalogService.getProducts({
        category: category as string,
        brand: brand as string,
        search: search as string,
      });
      res.json({ success: true, count: products.length, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/catalog/products/:identifier
  public getProductDetails(req: Request, res: Response): void {
    try {
      const identifier = Array.isArray(req.params.identifier)
        ? req.params.identifier[0]
        : req.params.identifier;
      const pdp = catalogService.getProductBySlugOrId(identifier as string);

      if (!pdp) {
        res.status(404).json({ success: false, message: "Product not found in master catalog" });
        return;
      }

      res.json({ success: true, data: pdp });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/catalog/products
  public createMasterProduct(req: Request, res: Response): void {
    try {
      const product = catalogService.createMasterProduct(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/catalog/listings
  public createSellerListing(req: Request, res: Response): void {
    try {
      const listing = catalogService.createSellerListing(req.body);
      res.status(201).json({ success: true, data: listing });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const catalogController = new CatalogController();
