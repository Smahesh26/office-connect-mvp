import { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken";
import type { RoleName } from "@prisma/client";
import prisma from "../config/prisma";

export type MarketplaceRole =
  | "SUPER_ADMIN"
  | "MARKETPLACE_ADMIN"
  | "FINANCE_ADMIN"
  | "SUPPORT_AGENT"
  | "CATALOG_MANAGER"
  | "SELLER_OWNER"
  | "SELLER_STAFF"
  | "CUSTOMER";

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  role: RoleName;
  marketplaceRole?: MarketplaceRole;
  sellerId?: string | null;
  customerId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const extractBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.trim().split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const isUsableToken = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value !== "null" && value !== "undefined";

const resolveTokenCandidates = (req: Request): string[] => {
  const candidates = [
    extractBearerToken(req.headers.authorization),
    (req as Request & { cookies?: Record<string, string> }).cookies?.authToken,
  ];
  return candidates.filter(isUsableToken);
};

export const isAuthenticatedUser = (decoded: JwtPayload | string): decoded is AuthenticatedUser => {
  if (typeof decoded !== "object" || decoded === null) return false;
  return typeof decoded.id === "string" && typeof decoded.email === "string";
};

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const candidates = resolveTokenCandidates(req);
    if (candidates.length === 0) {
      res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid authentication token" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || "fallback_dev_secret_never_use_in_prod";
    let lastError: unknown = null;

    for (const token of candidates) {
      try {
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        if (!isAuthenticatedUser(decoded)) {
          lastError = new JsonWebTokenError("Invalid token payload structure");
          continue;
        }

        // Server-side resolution of Seller identity & Marketplace Role
        let sellerId: string | null = null;
        let customerId: string | null = null;
        let mktRole: MarketplaceRole = "CUSTOMER";

        if (decoded.role === "SUPER_ADMIN" || decoded.role === "ADMIN") {
          mktRole = decoded.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "MARKETPLACE_ADMIN";
        }

        try {
          // Resolve Store ownership if user is associated with a Store
          const store = await prisma.store.findFirst({
            where: {
              OR: [
                { ownerUserId: decoded.id },
                { members: { some: { userId: decoded.id, isActive: true } } },
              ],
            },
            select: { id: true, members: { where: { userId: decoded.id }, select: { role: true } } },
          });

          if (store) {
            sellerId = store.id;
            const memberRole = store.members[0]?.role;
            mktRole = memberRole === "OWNER" ? "SELLER_OWNER" : "SELLER_STAFF";
          }
        } catch {
          // Fallback if DB lookup fails
        }

        req.user = {
          id: decoded.id,
          email: decoded.email,
          organizationId: decoded.organizationId || "platform",
          role: decoded.role as RoleName,
          marketplaceRole: mktRole,
          sellerId,
          customerId,
        };

        next();
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new JsonWebTokenError("Invalid token");
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({ success: false, message: "Unauthorized: Token has expired" });
      return;
    }
    if (error instanceof JsonWebTokenError) {
      res.status(401).json({ success: false, message: "Unauthorized: Invalid authentication token" });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error during authentication" });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized: Authentication required" });
    return;
  }
  const allowedAdminRoles: MarketplaceRole[] = ["SUPER_ADMIN", "MARKETPLACE_ADMIN", "FINANCE_ADMIN"];
  const isSaasAdmin = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";
  const isMktAdmin = req.user.marketplaceRole && allowedAdminRoles.includes(req.user.marketplaceRole);

  if (!isSaasAdmin && !isMktAdmin) {
    res.status(403).json({ success: false, message: "Forbidden: Super-Admin governance credentials required" });
    return;
  }
  next();
};

export const requireSeller = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized: Authentication required" });
    return;
  }
  const isSellerRole = req.user.marketplaceRole === "SELLER_OWNER" || req.user.marketplaceRole === "SELLER_STAFF";
  const isAdmin = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";

  if (!isSellerRole && !isAdmin) {
    res.status(403).json({ success: false, message: "Forbidden: Active 3P Merchant Seller credentials required" });
    return;
  }
  next();
};

export const authorizeRoles =
  (...roles: RoleName[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user?.role) {
        res.status(401).json({ message: "Unauthorized: User not authenticated" });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({ message: "Forbidden: Insufficient permissions" });
        return;
      }

      next();
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  };

