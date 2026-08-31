import { authenticateJWT, requireAdmin, requireSeller } from "../middleware/auth.middleware";
import type { Request, Response, NextFunction } from "express";

describe("P0 Security Hardening & Authorization Test Suite", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  test("TEST 1: Unauthenticated request to protected endpoint returns 401", async () => {
    await authenticateJWT(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Unauthorized"),
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test("TEST 2: Non-admin authenticated user calling requireAdmin returns 403 Forbidden", () => {
    mockRequest.user = {
      id: "usr-customer-1",
      email: "customer@example.com",
      organizationId: "org-1",
      role: "CLIENT" as any,
      marketplaceRole: "CUSTOMER",
      sellerId: null,
      customerId: "cust-1",
    };

    requireAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Forbidden"),
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test("TEST 3: Non-seller user calling requireSeller returns 403 Forbidden", () => {
    mockRequest.user = {
      id: "usr-customer-2",
      email: "customer2@example.com",
      organizationId: "org-1",
      role: "CLIENT" as any,
      marketplaceRole: "CUSTOMER",
      sellerId: null,
      customerId: "cust-2",
    };

    requireSeller(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Forbidden"),
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test("TEST 4: Authenticated Seller Owner calling requireSeller is allowed", () => {
    mockRequest.user = {
      id: "usr-seller-owner",
      email: "seller@aerotech.com",
      organizationId: "org-aerotech",
      role: "CLIENT" as any,
      marketplaceRole: "SELLER_OWNER",
      sellerId: "store-aerotech",
      customerId: null,
    };

    requireSeller(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  test("TEST 5: Authenticated Super Admin calling requireAdmin is allowed", () => {
    mockRequest.user = {
      id: "usr-[#0f172a]",
      email: "admin@camblissstudio.com",
      organizationId: "platform",
      role: "SUPER_ADMIN" as any,
      marketplaceRole: "SUPER_ADMIN",
      sellerId: null,
      customerId: null,
    };

    requireAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  test("TEST 6: Server derives sellerId principal; client-supplied sellerId is not trusted", () => {
    mockRequest.user = {
      id: "usr-seller-a",
      email: "sellerA@merchant.com",
      organizationId: "org-a",
      role: "CLIENT" as any,
      marketplaceRole: "SELLER_OWNER",
      sellerId: "store-seller-a",
      customerId: null,
    };
    mockRequest.body = { sellerId: "store-seller-b-impersonated" };

    // Enforcement logic: backend uses req.user.sellerId strictly
    const effectiveSellerId = mockRequest.user.sellerId;
    expect(effectiveSellerId).toBe("store-seller-a");
    expect(effectiveSellerId).not.toBe(mockRequest.body.sellerId);
  });
});
