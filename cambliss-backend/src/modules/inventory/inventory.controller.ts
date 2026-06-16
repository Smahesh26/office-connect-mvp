import { Request, Response } from "express";
import {
	addStock,
	adjustStock,
	approvePurchaseOrder,
	createVendor,
	createProduct,
	createPurchaseOrder,
	createWarehouse,
	createGatePass,
	deleteVendor,
	exportStockLedgerCsv,
	getGatePasses,
	CreateProductInput,
	CreateVendorInput,
	CreatePurchaseOrderItemInput,
	getPurchaseOrders,
	getProducts,
	getInventoryAuditFeed,
	getReorderSuggestions,
	getStockMovements,
	getStockMovementsByOrganization,
	getInventorySummary,
	getVendors,
	getWarehouses,
	InventoryError,
	returnPurchaseOrder,
	updateGatePassStatus,
	receivePurchaseOrder,
	reduceStock,
	transferStock,
	updateDraftPurchaseOrderItems,
	updateProductSettings,
	updateVendor,
	UpdateVendorInput,
} from "./inventory.service";

const handleInventoryError = (res: Response, error: unknown): void => {
	if (error instanceof InventoryError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof Error) {
		res.status(500).json({ message: error.message });
		return;
	}

	res.status(500).json({ message: "Internal server error" });
};

export const createProductController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const product = await createProduct(req.user.organizationId, req.body as CreateProductInput);
		res.status(201).json(product);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const createPurchaseOrderController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { vendorId, items } = req.body;
		const purchaseOrder = await createPurchaseOrder(
			req.user.organizationId,
			vendorId,
			(items ?? []) as CreatePurchaseOrderItemInput[],
		);

		res.status(201).json(purchaseOrder);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const approvePurchaseOrderController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const purchaseId = String(req.params.id);
		const organizationId = String(req.user.organizationId);

		if (!purchaseId) {
			throw new InventoryError(400, "purchase id is required");
		}

		const result = await approvePurchaseOrder(purchaseId, organizationId);
		res.status(200).json(result);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const updateDraftPurchaseOrderItemsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const purchaseId = String(req.params.id);
		const { items } = req.body;
		const result = await updateDraftPurchaseOrderItems(
			req.user.organizationId,
			purchaseId,
			(items ?? []) as CreatePurchaseOrderItemInput[],
		);

		res.status(200).json(result);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const getPurchaseOrdersController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const purchaseOrders = await getPurchaseOrders(req.user.organizationId);
		res.status(200).json(purchaseOrders);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const receivePurchaseOrderController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const purchaseId = String(req.params.id);
		const { warehouseId, items } = req.body as { warehouseId?: string; items?: Array<{ productId: string; quantity: number }> };
		const result = await receivePurchaseOrder(purchaseId, req.user.organizationId, warehouseId, items);
		res.status(200).json(result);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const returnPurchaseOrderController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const purchaseId = String(req.params.id);
		const { warehouseId, items } = req.body as { warehouseId?: string; items?: Array<{ productId: string; quantity: number }> };
		const result = await returnPurchaseOrder(purchaseId, req.user.organizationId, warehouseId, items);
		res.status(200).json(result);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const createWarehouseController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { name, location, latitude, longitude } = req.body as {
			name: string;
			location?: string;
			latitude?: number;
			longitude?: number;
		};
		const warehouse = await createWarehouse(req.user.organizationId, name, location, latitude, longitude);
		res.status(201).json(warehouse);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const getProductsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const products = await getProducts(req.user.organizationId);
		res.status(200).json(products);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const getWarehousesController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const warehouses = await getWarehouses(req.user.organizationId);
		res.status(200).json(warehouses);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const getVendorsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const vendors = await getVendors(req.user.organizationId);
		res.status(200).json(vendors);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const createGatePassController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const gatePass = await createGatePass(req.user.organizationId, req.body);
		res.status(201).json(gatePass);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const getGatePassesController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const gatePasses = await getGatePasses(req.user.organizationId);
		res.status(200).json(gatePasses);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const updateGatePassStatusController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const gatePassId = String(req.params.id);
		const { status } = req.body as { status: "OPEN" | "CLOSED" | "CANCELLED" };
		const gatePass = await updateGatePassStatus(req.user.organizationId, gatePassId, status);
		res.status(200).json(gatePass);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const createVendorController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const vendor = await createVendor(req.user.organizationId, req.body as CreateVendorInput);
		res.status(201).json(vendor);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const updateVendorController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const vendorId = String(req.params.id);
		const vendor = await updateVendor(req.user.organizationId, vendorId, req.body as UpdateVendorInput);
		res.status(200).json(vendor);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const deleteVendorController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const vendorId = String(req.params.id);
		const vendor = await deleteVendor(req.user.organizationId, vendorId);
		res.status(200).json(vendor);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const updateProductSettingsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const productId = String(req.params.id);
		const updated = await updateProductSettings(req.user.organizationId, productId, req.body);
		res.status(200).json(updated);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const addStockController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { productId, warehouseId, quantity, referenceId, notes } = req.body;
		const result = await addStock(
			req.user.organizationId,
			productId,
			warehouseId,
			Number(quantity),
			referenceId,
			notes,
		);

		res.status(200).json(result);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const reduceStockController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { productId, warehouseId, quantity, referenceId, notes } = req.body;
		const result = await reduceStock(
			req.user.organizationId,
			productId,
			warehouseId,
			Number(quantity),
			referenceId,
			notes,
		);

		res.status(200).json(result);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const transferStockController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { productId, fromWarehouseId, toWarehouseId, quantity, referenceId, notes } = req.body;
		const result = await transferStock(
			req.user.organizationId,
			productId,
			fromWarehouseId,
			toWarehouseId,
			Number(quantity),
			referenceId,
			notes,
		);

		res.status(200).json(result);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const adjustStockController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { productId, warehouseId, newQuantity, reason, referenceId } = req.body;
		const result = await adjustStock(
			req.user.organizationId,
			productId,
			warehouseId,
			Number(newQuantity),
			reason,
			referenceId,
		);

		res.status(200).json(result);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const getStockSummaryController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const summary = await getInventorySummary(req.user.organizationId);
		res.status(200).json(summary);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const getStockMovementsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
		const warehouseId = typeof req.query.warehouseId === "string" ? req.query.warehouseId : undefined;
		const type =
			typeof req.query.type === "string"
				? (req.query.type as "PURCHASE" | "SALE" | "ADJUSTMENT" | "TRANSFER_OUT" | "TRANSFER_IN" | "PURCHASE_RETURN")
				: undefined;
		const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
		const fromDate = typeof req.query.fromDate === "string" ? req.query.fromDate : undefined;
		const toDate = typeof req.query.toDate === "string" ? req.query.toDate : undefined;

		const movements =
			productId && !warehouseId && !type && !limit
				? await getStockMovements(productId, req.user.organizationId)
				: await getStockMovementsByOrganization(req.user.organizationId, {
					productId,
					warehouseId,
					type,
					fromDate,
					toDate,
					limit,
				});

		res.status(200).json(movements);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const getReorderSuggestionsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const suggestions = await getReorderSuggestions(req.user.organizationId);
		res.status(200).json(suggestions);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const exportStockLedgerController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
		const warehouseId = typeof req.query.warehouseId === "string" ? req.query.warehouseId : undefined;
		const type =
			typeof req.query.type === "string"
				? (req.query.type as "PURCHASE" | "SALE" | "ADJUSTMENT" | "TRANSFER_OUT" | "TRANSFER_IN" | "PURCHASE_RETURN")
				: undefined;
		const fromDate = typeof req.query.fromDate === "string" ? req.query.fromDate : undefined;
		const toDate = typeof req.query.toDate === "string" ? req.query.toDate : undefined;

		const csv = await exportStockLedgerCsv(req.user.organizationId, {
			productId,
			warehouseId,
			type,
			fromDate,
			toDate,
		});

		res.setHeader("Content-Type", "text/csv; charset=utf-8");
		res.setHeader("Content-Disposition", `attachment; filename=inventory-stock-ledger-${Date.now()}.csv`);
		res.status(200).send(csv);
	} catch (error) {
		handleInventoryError(res, error);
	}
};

export const getInventoryAuditController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
		const audit = await getInventoryAuditFeed(req.user.organizationId, limit);
		res.status(200).json(audit);
	} catch (error) {
		handleInventoryError(res, error);
	}
};
