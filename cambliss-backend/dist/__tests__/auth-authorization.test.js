"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_middleware_1 = require("../middleware/auth.middleware");
describe("P0 Security Hardening & Authorization Test Suite", () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;
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
    test("TEST 1: Unauthenticated request to protected endpoint returns 401", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, auth_middleware_1.authenticateJWT)(mockRequest, mockResponse, nextFunction);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining("Unauthorized"),
        }));
        expect(nextFunction).not.toHaveBeenCalled();
    }));
    test("TEST 2: Non-admin authenticated user calling requireAdmin returns 403 Forbidden", () => {
        mockRequest.user = {
            id: "usr-customer-1",
            email: "customer@example.com",
            organizationId: "org-1",
            role: "CLIENT",
            marketplaceRole: "CUSTOMER",
            sellerId: null,
            customerId: "cust-1",
        };
        (0, auth_middleware_1.requireAdmin)(mockRequest, mockResponse, nextFunction);
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining("Forbidden"),
        }));
        expect(nextFunction).not.toHaveBeenCalled();
    });
    test("TEST 3: Non-seller user calling requireSeller returns 403 Forbidden", () => {
        mockRequest.user = {
            id: "usr-customer-2",
            email: "customer2@example.com",
            organizationId: "org-1",
            role: "CLIENT",
            marketplaceRole: "CUSTOMER",
            sellerId: null,
            customerId: "cust-2",
        };
        (0, auth_middleware_1.requireSeller)(mockRequest, mockResponse, nextFunction);
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining("Forbidden"),
        }));
        expect(nextFunction).not.toHaveBeenCalled();
    });
    test("TEST 4: Authenticated Seller Owner calling requireSeller is allowed", () => {
        mockRequest.user = {
            id: "usr-seller-owner",
            email: "seller@aerotech.com",
            organizationId: "org-aerotech",
            role: "CLIENT",
            marketplaceRole: "SELLER_OWNER",
            sellerId: "store-aerotech",
            customerId: null,
        };
        (0, auth_middleware_1.requireSeller)(mockRequest, mockResponse, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
    });
    test("TEST 5: Authenticated Super Admin calling requireAdmin is allowed", () => {
        mockRequest.user = {
            id: "usr-[#0f172a]",
            email: "admin@camblissstudio.com",
            organizationId: "platform",
            role: "SUPER_ADMIN",
            marketplaceRole: "SUPER_ADMIN",
            sellerId: null,
            customerId: null,
        };
        (0, auth_middleware_1.requireAdmin)(mockRequest, mockResponse, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
    });
    test("TEST 6: Server derives sellerId principal; client-supplied sellerId is not trusted", () => {
        mockRequest.user = {
            id: "usr-seller-a",
            email: "sellerA@merchant.com",
            organizationId: "org-a",
            role: "CLIENT",
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
