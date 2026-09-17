import { Request, Response } from "express";
import * as supplyChainService from "./supply-chain.service";

export const getSupplyChainOverviewController = async (req: Request, res: Response) => {
	try {
		const orgId = req.user?.organizationId || "org_default";
		const telemetry = await supplyChainService.getInterconnectedSupplyChainTelemetry(orgId);
		return res.json(telemetry);
	} catch (error: any) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const syncCommerceOrderStockController = async (req: Request, res: Response) => {
	try {
		const orgId = req.user?.organizationId || "org_default";
		const { orderId, items } = req.body;
		if (!orderId || !items || !Array.isArray(items)) {
			return res.status(400).json({ success: false, message: "orderId and items array are required." });
		}
		const result = await supplyChainService.handleCommerceOrderStockDeduction(orderId, items, orgId);
		return res.json(result);
	} catch (error: any) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const triggerAutoReorderController = async (req: Request, res: Response) => {
	try {
		const orgId = req.user?.organizationId || "org_default";
		const result = await supplyChainService.generateAutoReorderPurchaseOrders(orgId);
		return res.json(result);
	} catch (error: any) {
		return res.status(500).json({ success: false, message: error.message });
	}
};
