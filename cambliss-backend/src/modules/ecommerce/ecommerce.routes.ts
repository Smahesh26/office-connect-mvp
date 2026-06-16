import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { moduleGuard } from "../../middleware/module.middleware";
import { requireActiveSubscription } from "../../middleware/subscription.middleware";
import {
	addCartItemController,
	addMarketplaceCartItemController,
	addToCartController,
	approveReturnController,
	cancelOrderController,
	checkoutController,
	checkoutCartController,
	checkoutMarketplaceController,
	clearCartController,
	createCategoryController,
	createOrderController,
	createPaymentOrderController,
	createPublicStoreOrderController,
	createProductListingController,
	createStoreController,
	getPublicStoreByDomainController,
	getCategoryTreeController,
	getOrCreateCartController,
	getCartController,
	getMarketplaceCartController,
	getStorePaymentSettingsController,
	getStoreByOrganizationController,
	getStoreProductsController,
	listCategoriesController,
	listMarketplaceProductsController,
	listOrdersController,
	listProductListingsController,
	listStoresController,
	markAsDeliveredController,
	markAsPackedController,
	markAsShippedController,
	processRefundController,
	reconcileGatewayRefundController,
	requestReturnController,
	inspectReturnController,
	removeFromCartController,
	removeCartItemController,
	toggleProductListingController,
	toggleStoreStatusController,
	updateStorePaymentSettingsController,
	updateCartItemController,
	updateOrderStatusController,
	verifyPaymentWebhookController,
} from "./ecommerce.controller";

const ecommerceRouter = Router();

ecommerceRouter.get("/public/stores/:domain", getPublicStoreByDomainController);
ecommerceRouter.post("/public/orders", createPublicStoreOrderController);

ecommerceRouter.use(authenticateJWT, requireActiveSubscription, moduleGuard("ECOMMERCE"));

ecommerceRouter.post("/stores", createStoreController);
ecommerceRouter.get("/stores", listStoresController);
ecommerceRouter.get("/store", getStoreByOrganizationController);
ecommerceRouter.patch("/stores/:storeId/toggle", toggleStoreStatusController);
ecommerceRouter.get("/stores/payment-settings", getStorePaymentSettingsController);
ecommerceRouter.put("/stores/payment-settings", updateStorePaymentSettingsController);

ecommerceRouter.post("/categories", createCategoryController);
ecommerceRouter.get("/categories", listCategoriesController);
ecommerceRouter.get("/categories/tree", getCategoryTreeController);

ecommerceRouter.post("/listings", createProductListingController);
ecommerceRouter.get("/listings", listProductListingsController);
ecommerceRouter.get("/products", getStoreProductsController);
ecommerceRouter.get("/marketplace/products", listMarketplaceProductsController);
ecommerceRouter.patch("/listings/:listingId/toggle", toggleProductListingController);

ecommerceRouter.get("/cart", getCartController);
ecommerceRouter.get("/cart/current", getOrCreateCartController);
ecommerceRouter.get("/marketplace/cart", getMarketplaceCartController);
ecommerceRouter.post("/cart/items", addCartItemController);
ecommerceRouter.post("/cart/add", addToCartController);
ecommerceRouter.post("/marketplace/cart/items", addMarketplaceCartItemController);
ecommerceRouter.patch("/cart/items/:cartItemId", updateCartItemController);
ecommerceRouter.delete("/cart/items/:cartItemId", removeFromCartController);
ecommerceRouter.delete("/cart/items", removeCartItemController);
ecommerceRouter.delete("/cart", clearCartController);
ecommerceRouter.post("/cart/checkout", checkoutCartController);
ecommerceRouter.post("/checkout", checkoutController);
ecommerceRouter.post("/marketplace/checkout", checkoutMarketplaceController);

ecommerceRouter.post("/orders", createOrderController);
ecommerceRouter.get("/orders", listOrdersController);
ecommerceRouter.patch("/orders/:orderId/status", updateOrderStatusController);

ecommerceRouter.post("/payment/create", createPaymentOrderController);
ecommerceRouter.post("/payment/verify", verifyPaymentWebhookController);

ecommerceRouter.post("/fulfillment/pack", markAsPackedController);
ecommerceRouter.post("/fulfillment/ship", markAsShippedController);
ecommerceRouter.post("/fulfillment/deliver", markAsDeliveredController);
ecommerceRouter.post("/fulfillment/cancel", cancelOrderController);

ecommerceRouter.post("/returns/request", requestReturnController);
ecommerceRouter.post("/returns/approve", approveReturnController);
ecommerceRouter.post("/returns/inspect", inspectReturnController);
ecommerceRouter.post("/returns/refund", processRefundController);
ecommerceRouter.post("/returns/reconcile", reconcileGatewayRefundController);

export default ecommerceRouter;
