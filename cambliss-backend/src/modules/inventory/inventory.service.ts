import prisma from "../../config/prisma";
import { ContactType, Prisma } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { createTransactionWithEntries } from "../accounting/accounting.service";

export class InventoryError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "InventoryError";
	}
}

type ProductInventorySettings = {
	category?: string;
	unit?: string;
	reorderLevel?: number;
};

type InventoryMetaStore = {
	productSettings: Record<string, ProductInventorySettings>;
};

const INVENTORY_META_FILE_PATH = path.join(process.cwd(), "data", "inventory-meta.json");

const ensureInventoryMetaStoreExists = async (): Promise<void> => {
	const directory = path.dirname(INVENTORY_META_FILE_PATH);
	await fs.mkdir(directory, { recursive: true });

	try {
		await fs.access(INVENTORY_META_FILE_PATH);
	} catch {
		const initial: InventoryMetaStore = { productSettings: {} };
		await fs.writeFile(INVENTORY_META_FILE_PATH, JSON.stringify(initial, null, 2), "utf-8");
	}
};

const loadInventoryMetaStore = async (): Promise<InventoryMetaStore> => {
	await ensureInventoryMetaStoreExists();

	try {
		const raw = await fs.readFile(INVENTORY_META_FILE_PATH, "utf-8");
		const parsed = JSON.parse(raw) as Partial<InventoryMetaStore>;
		return {
			productSettings: parsed.productSettings ?? {},
		};
	} catch {
		return { productSettings: {} };
	}
};

const saveInventoryMetaStore = async (store: InventoryMetaStore): Promise<void> => {
	await ensureInventoryMetaStoreExists();
	await fs.writeFile(INVENTORY_META_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
};

const normalizeProductInventorySettings = (
	input?: ProductInventorySettings,
): ProductInventorySettings | undefined => {
	if (!input) {
		return undefined;
	}

	const category = input.category?.trim() || undefined;
	const unit = input.unit?.trim() || undefined;
	const reorderLevel =
		typeof input.reorderLevel === "number" && Number.isInteger(input.reorderLevel) && input.reorderLevel >= 0
			? input.reorderLevel
			: undefined;

	if (!category && !unit && reorderLevel === undefined) {
		return undefined;
	}

	return { category, unit, reorderLevel };
};

const ensurePositiveQuantity = (quantity: number): void => {
	if (!Number.isInteger(quantity) || quantity <= 0) {
		throw new InventoryError(400, "quantity must be a positive integer");
	}
};

const validateLatitudeLongitude = (latitude?: number, longitude?: number): void => {
	if (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
		throw new InventoryError(400, "latitude must be between -90 and 90");
	}

	if (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
		throw new InventoryError(400, "longitude must be between -180 and 180");
	}

	if ((latitude === undefined) !== (longitude === undefined)) {
		throw new InventoryError(400, "Provide both latitude and longitude together");
	}
};

const validateOrganization = async (organizationId: string) => {
	const organization = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!organization) {
		throw new InventoryError(404, "Organization not found");
	}
};

const validateProductInOrg = async (productId: string, organizationId: string) => {
	const product = await prisma.product.findUnique({
		where: { id: productId },
		select: {
			id: true,
			organizationId: true,
			name: true,
			sku: true,
			isActive: true,
		},
	});

	if (!product) {
		throw new InventoryError(404, "Product not found");
	}

	if (product.organizationId !== organizationId) {
		throw new InventoryError(403, "Product does not belong to this organization");
	}

	if (!product.isActive) {
		throw new InventoryError(400, "Product is inactive");
	}

	return product;
};

const validateProduct = validateProductInOrg;

const validateWarehouseInOrg = async (warehouseId: string, organizationId: string) => {
	const warehouse = await prisma.warehouse.findUnique({
		where: { id: warehouseId },
		select: {
			id: true,
			organizationId: true,
			name: true,
		},
	});

	if (!warehouse) {
		throw new InventoryError(404, "Warehouse not found");
	}

	if (warehouse.organizationId !== organizationId) {
		throw new InventoryError(403, "Warehouse does not belong to this organization");
	}

	return warehouse;
};

const validateWarehouse = validateWarehouseInOrg;

const getOrCreateStockItem = async (
	productId: string,
	warehouseId: string,
	db: typeof prisma = prisma,
) => {
	const existing = await db.stockItem.findUnique({
		where: {
			productId_warehouseId: {
				productId,
				warehouseId,
			},
		},
	});

	if (existing) {
		return existing;
	}

	return db.stockItem.create({
		data: {
			productId,
			warehouseId,
			quantity: 0,
		},
	});
};

const createMovement = async (
	organizationId: string,
	productId: string,
	warehouseId: string,
	type: "PURCHASE" | "SALE" | "ADJUSTMENT" | "TRANSFER_OUT" | "TRANSFER_IN" | "PURCHASE_RETURN",
	quantity: number,
	referenceId?: string,
	notes?: string,
) => {
	return prisma.stockMovement.create({
		data: {
			organizationId,
			productId,
			warehouseId,
			type,
			quantity,
			referenceId,
			notes,
		},
	});
};

export interface CreateProductInput {
	name: string;
	sku: string;
	description?: string;
	unitPrice: number;
	costPrice?: number;
	taxRate?: number;
	category?: string;
	unit?: string;
	reorderLevel?: number;
}

export const createProduct = async (organizationId: string, input: CreateProductInput) => {
	await validateOrganization(organizationId);

	if (!input.name?.trim()) {
		throw new InventoryError(400, "name is required");
	}

	if (!input.sku?.trim()) {
		throw new InventoryError(400, "sku is required");
	}

	if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
		throw new InventoryError(400, "unitPrice must be a non-negative number");
	}

	if (input.costPrice !== undefined && (!Number.isFinite(input.costPrice) || input.costPrice < 0)) {
		throw new InventoryError(400, "costPrice must be a non-negative number");
	}

	if (input.taxRate !== undefined && (!Number.isFinite(input.taxRate) || input.taxRate < 0)) {
		throw new InventoryError(400, "taxRate must be a non-negative number");
	}

	if (input.reorderLevel !== undefined && (!Number.isInteger(input.reorderLevel) || input.reorderLevel < 0)) {
		throw new InventoryError(400, "reorderLevel must be a non-negative integer");
	}

	const createdProduct = await prisma.product.create({
		data: {
			organizationId,
			name: input.name.trim(),
			sku: input.sku.trim(),
			description: input.description,
			unitPrice: input.unitPrice,
			costPrice: input.costPrice,
			taxRate: input.taxRate,
		},
	});

	const normalizedSettings = normalizeProductInventorySettings({
		category: input.category,
		unit: input.unit,
		reorderLevel: input.reorderLevel,
	});

	if (normalizedSettings) {
		const store = await loadInventoryMetaStore();
		store.productSettings[createdProduct.id] = normalizedSettings;
		await saveInventoryMetaStore(store);
	}

	return {
		...createdProduct,
		...(normalizedSettings ?? {}),
	};
};

export const updateProductSettings = async (
	organizationId: string,
	productId: string,
	settings: ProductInventorySettings,
) => {
	await validateOrganization(organizationId);
	await validateProduct(productId, organizationId);

	if (
		settings.reorderLevel !== undefined &&
		(!Number.isInteger(settings.reorderLevel) || settings.reorderLevel < 0)
	) {
		throw new InventoryError(400, "reorderLevel must be a non-negative integer");
	}

	const store = await loadInventoryMetaStore();
	const normalized = normalizeProductInventorySettings(settings);

	if (normalized) {
		store.productSettings[productId] = normalized;
	} else {
		delete store.productSettings[productId];
	}

	await saveInventoryMetaStore(store);

	const product = await prisma.product.findUnique({ where: { id: productId } });
	if (!product) {
		throw new InventoryError(404, "Product not found");
	}

	return {
		...product,
		...(store.productSettings[productId] ?? {}),
	};
};

export const createWarehouse = async (
	organizationId: string,
	name: string,
	location?: string,
	latitude?: number,
	longitude?: number,
) => {
	await validateOrganization(organizationId);

	if (!name?.trim()) {
		throw new InventoryError(400, "name is required");
	}

	validateLatitudeLongitude(latitude, longitude);

	return prisma.warehouse.create({
		data: {
			organizationId,
			name: name.trim(),
			location,
			latitude,
			longitude,
		},
	});
};

export const getProducts = async (organizationId: string) => {
	await validateOrganization(organizationId);
	const store = await loadInventoryMetaStore();
	const products = await prisma.product.findMany({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
	});

	return products.map((product) => ({
		...product,
		...(store.productSettings[product.id] ?? {}),
	}));
};

export const getWarehouses = async (organizationId: string) => {
	await validateOrganization(organizationId);

	return prisma.warehouse.findMany({
		where: { organizationId },
		orderBy: { name: "asc" },
	});
};

export const getVendors = async (organizationId: string) => {
	await validateOrganization(organizationId);

	return prisma.contact.findMany({
		where: {
			organizationId,
			type: "VENDOR",
			isActive: true,
		},
		select: {
			id: true,
			companyName: true,
			firstName: true,
			lastName: true,
			email: true,
			phone: true,
		},
		orderBy: { createdAt: "desc" },
	});
};

export interface CreateVendorInput {
	companyName?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	gstNumber?: string;
	panNumber?: string;
	state?: string;
	stateCode?: string;
	billingAddress?: string;
	shippingAddress?: string;
}

export interface UpdateVendorInput extends CreateVendorInput {
	isActive?: boolean;
}

export const createVendor = async (organizationId: string, input: CreateVendorInput) => {
	await validateOrganization(organizationId);

	if (!input.companyName?.trim() && !input.firstName?.trim() && !input.lastName?.trim()) {
		throw new InventoryError(400, "Provide companyName or vendor name");
	}

	return prisma.contact.create({
		data: {
			organizationId,
			type: ContactType.VENDOR,
			companyName: input.companyName?.trim() || undefined,
			firstName: input.firstName?.trim() || undefined,
			lastName: input.lastName?.trim() || undefined,
			email: input.email?.trim() || undefined,
			phone: input.phone?.trim() || undefined,
			gstNumber: input.gstNumber?.trim() || undefined,
			panNumber: input.panNumber?.trim() || undefined,
			state: input.state?.trim() || undefined,
			stateCode: input.stateCode?.trim() || undefined,
			billingAddress: input.billingAddress?.trim() || undefined,
			shippingAddress: input.shippingAddress?.trim() || undefined,
		},
	});
};

export const updateVendor = async (
	organizationId: string,
	vendorId: string,
	input: UpdateVendorInput,
) => {
	await validateOrganization(organizationId);

	const vendor = await prisma.contact.findUnique({
		where: { id: vendorId },
		select: { id: true, organizationId: true, type: true },
	});

	if (!vendor) {
		throw new InventoryError(404, "Vendor not found");
	}

	if (vendor.organizationId !== organizationId) {
		throw new InventoryError(403, "Vendor does not belong to this organization");
	}

	if (vendor.type !== ContactType.VENDOR) {
		throw new InventoryError(400, "Contact is not a vendor");
	}

	return prisma.contact.update({
		where: { id: vendorId },
		data: {
			companyName: input.companyName?.trim() || undefined,
			firstName: input.firstName?.trim() || undefined,
			lastName: input.lastName?.trim() || undefined,
			email: input.email?.trim() || undefined,
			phone: input.phone?.trim() || undefined,
			gstNumber: input.gstNumber?.trim() || undefined,
			panNumber: input.panNumber?.trim() || undefined,
			state: input.state?.trim() || undefined,
			stateCode: input.stateCode?.trim() || undefined,
			billingAddress: input.billingAddress?.trim() || undefined,
			shippingAddress: input.shippingAddress?.trim() || undefined,
			...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
		},
	});
};

export const deleteVendor = async (organizationId: string, vendorId: string) => {
	await validateOrganization(organizationId);

	const vendor = await prisma.contact.findUnique({
		where: { id: vendorId },
		select: { id: true, organizationId: true, type: true },
	});

	if (!vendor) {
		throw new InventoryError(404, "Vendor not found");
	}

	if (vendor.organizationId !== organizationId) {
		throw new InventoryError(403, "Vendor does not belong to this organization");
	}

	if (vendor.type !== ContactType.VENDOR) {
		throw new InventoryError(400, "Contact is not a vendor");
	}

	return prisma.contact.update({
		where: { id: vendorId },
		data: { isActive: false },
	});
};

export interface CreatePurchaseOrderItemInput {
	productId: string;
	quantity: number;
	unitPrice: number;
}

export interface ReceivePurchaseOrderItemInput {
	productId: string;
	quantity: number;
}

export interface ReturnPurchaseOrderItemInput {
	productId: string;
	quantity: number;
}

export interface CreateGatePassItemInput {
	productId: string;
	quantity: number;
}

export interface CreateGatePassInput {
	type: "INWARD" | "OUTWARD";
	warehouseId: string;
	vehicleNumber?: string;
	driverName?: string;
	referenceType?: string;
	referenceId?: string;
	notes?: string;
	items: CreateGatePassItemInput[];
}

const generateGatePassNumber = (): string => {
	const now = new Date();
	const y = now.getUTCFullYear();
	const m = String(now.getUTCMonth() + 1).padStart(2, "0");
	const d = String(now.getUTCDate()).padStart(2, "0");
	const suffix = Math.floor(Math.random() * 9000 + 1000);
	return `GP-${y}${m}${d}-${suffix}`;
};

export const createGatePass = async (organizationId: string, input: CreateGatePassInput) => {
	await validateOrganization(organizationId);

	if (!["INWARD", "OUTWARD"].includes(input.type)) {
		throw new InventoryError(400, "type must be INWARD or OUTWARD");
	}

	if (!input.warehouseId?.trim()) {
		throw new InventoryError(400, "warehouseId is required");
	}

	if (!Array.isArray(input.items) || input.items.length === 0) {
		throw new InventoryError(400, "items must be a non-empty array");
	}

	await validateWarehouse(input.warehouseId, organizationId);

	for (const item of input.items) {
		if (!item.productId?.trim()) {
			throw new InventoryError(400, "productId is required for each gate pass item");
		}
		ensurePositiveQuantity(item.quantity);
		await validateProduct(item.productId, organizationId);
	}

	let passNumber = generateGatePassNumber();
	for (let attempt = 0; attempt < 5; attempt += 1) {
		const existing = await prisma.gatePass.findFirst({
			where: { organizationId, passNumber },
			select: { id: true },
		});
		if (!existing) {
			break;
		}
		passNumber = generateGatePassNumber();
	}

	return prisma.gatePass.create({
		data: {
			organizationId,
			passNumber,
			type: input.type,
			status: "OPEN",
			warehouseId: input.warehouseId,
			vehicleNumber: input.vehicleNumber?.trim() || undefined,
			driverName: input.driverName?.trim() || undefined,
			referenceType: input.referenceType?.trim() || undefined,
			referenceId: input.referenceId?.trim() || undefined,
			notes: input.notes?.trim() || undefined,
			items: {
				create: input.items.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
				})),
			},
		},
		include: {
			warehouse: { select: { id: true, name: true } },
			items: {
				include: {
					product: {
						select: { id: true, name: true, sku: true },
					},
				},
			},
		},
	});
};

export const getGatePasses = async (organizationId: string) => {
	await validateOrganization(organizationId);

	return prisma.gatePass.findMany({
		where: { organizationId },
		include: {
			warehouse: { select: { id: true, name: true } },
			items: {
				include: {
					product: {
						select: { id: true, name: true, sku: true },
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});
};

export const updateGatePassStatus = async (
	organizationId: string,
	gatePassId: string,
	status: "OPEN" | "CLOSED" | "CANCELLED",
) => {
	await validateOrganization(organizationId);

	if (!["OPEN", "CLOSED", "CANCELLED"].includes(status)) {
		throw new InventoryError(400, "status must be OPEN, CLOSED, or CANCELLED");
	}

	const gatePass = await prisma.gatePass.findUnique({
		where: { id: gatePassId },
		select: { id: true, organizationId: true, status: true },
	});

	if (!gatePass) {
		throw new InventoryError(404, "Gate pass not found");
	}

	if (gatePass.organizationId !== organizationId) {
		throw new InventoryError(403, "Gate pass does not belong to this organization");
	}

	if (gatePass.status === "CANCELLED") {
		throw new InventoryError(400, "Cancelled gate pass cannot be updated");
	}

	return prisma.gatePass.update({
		where: { id: gatePassId },
		data: {
			status,
			closedAt: status === "CLOSED" ? new Date() : null,
		},
		include: {
			warehouse: { select: { id: true, name: true } },
			items: {
				include: {
					product: { select: { id: true, name: true, sku: true } },
				},
			},
		},
	});
};

const mergeDuplicatePurchaseItems = (
	items: CreatePurchaseOrderItemInput[],
): CreatePurchaseOrderItemInput[] => {
	const merged = new Map<string, CreatePurchaseOrderItemInput>();

	for (const item of items) {
		const existing = merged.get(item.productId);
		if (!existing) {
			merged.set(item.productId, { ...item });
			continue;
		}

		const mergedQty = existing.quantity + item.quantity;
		const mergedUnitPrice = Number(
			((existing.unitPrice * existing.quantity + item.unitPrice * item.quantity) / mergedQty).toFixed(2),
		);

		merged.set(item.productId, {
			productId: item.productId,
			quantity: mergedQty,
			unitPrice: mergedUnitPrice,
		});
	}

	return Array.from(merged.values());
};

export const createPurchaseOrder = async (
	organizationId: string,
	vendorId: string,
	items: CreatePurchaseOrderItemInput[],
) => {
	await validateOrganization(organizationId);

	if (!vendorId?.trim()) {
		throw new InventoryError(400, "vendorId is required");
	}

	if (!Array.isArray(items) || items.length === 0) {
		throw new InventoryError(400, "items must be a non-empty array");
	}

	const vendor = await prisma.contact.findUnique({
		where: { id: vendorId },
		select: {
			id: true,
			organizationId: true,
			type: true,
			companyName: true,
			firstName: true,
			lastName: true,
		},
	});

	if (!vendor) {
		throw new InventoryError(404, "Vendor not found");
	}

	if (vendor.organizationId !== organizationId) {
		throw new InventoryError(403, "Vendor does not belong to this organization");
	}

	if (vendor.type !== "VENDOR") {
		throw new InventoryError(400, "Selected contact is not a vendor");
	}

	const normalizedItems = mergeDuplicatePurchaseItems(items);

	for (const item of normalizedItems) {
		ensurePositiveQuantity(item.quantity);
		if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
			throw new InventoryError(400, "unitPrice must be a non-negative number");
		}
		await validateProduct(item.productId, organizationId);
	}

	const totalAmount = Number(
		normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2),
	);

	return prisma.purchaseOrder.create({
		data: {
			organizationId,
			vendorId,
			status: "DRAFT",
			totalAmount,
			items: {
				create: normalizedItems.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
				})),
			},
		},
		include: {
			vendor: {
				select: {
					id: true,
					companyName: true,
					firstName: true,
					lastName: true,
				},
			},
			items: {
				include: {
					product: {
						select: {
							id: true,
							name: true,
							sku: true,
						},
					},
				},
			},
		},
	});
};

export const updateDraftPurchaseOrderItems = async (
	organizationId: string,
	purchaseId: string,
	items: CreatePurchaseOrderItemInput[],
) => {
	await validateOrganization(organizationId);

	if (!Array.isArray(items) || items.length === 0) {
		throw new InventoryError(400, "items must be a non-empty array");
	}

	const purchaseOrder = await prisma.purchaseOrder.findUnique({
		where: { id: purchaseId },
		select: {
			id: true,
			organizationId: true,
			status: true,
		},
	});

	if (!purchaseOrder) {
		throw new InventoryError(404, "Purchase order not found");
	}

	if (purchaseOrder.organizationId !== organizationId) {
		throw new InventoryError(403, "Purchase order does not belong to this organization");
	}

	if (purchaseOrder.status !== "DRAFT") {
		throw new InventoryError(400, "Only DRAFT purchase orders can be edited");
	}

	const normalizedItems = mergeDuplicatePurchaseItems(items);

	for (const item of normalizedItems) {
		ensurePositiveQuantity(item.quantity);
		if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
			throw new InventoryError(400, "unitPrice must be a non-negative number");
		}
		await validateProduct(item.productId, organizationId);
	}

	const totalAmount = Number(normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2));

	await prisma.$transaction(async (tx) => {
		await tx.purchaseItem.deleteMany({ where: { purchaseId: purchaseOrder.id } });

		await tx.purchaseOrder.update({
			where: { id: purchaseOrder.id },
			data: {
				totalAmount,
				items: {
					create: normalizedItems.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
					})),
				},
			},
		});
	});

	return prisma.purchaseOrder.findUnique({
		where: { id: purchaseOrder.id },
		include: {
			vendor: {
				select: {
					id: true,
					companyName: true,
					firstName: true,
					lastName: true,
					email: true,
					phone: true,
				},
			},
			items: {
				include: {
					product: {
						select: {
							id: true,
							name: true,
							sku: true,
						},
					},
				},
			},
		},
	});
};

const getOrCreateLedgerAccount = async (
	organizationId: string,
	name: string,
	type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE",
) => {
	const existing = await prisma.ledgerAccount.findFirst({
		where: {
			organizationId,
			name,
			type,
		},
		select: {
			id: true,
		},
	});

	if (existing) {
		return existing;
	}

	return prisma.ledgerAccount.create({
		data: {
			organizationId,
			name,
			type,
		},
		select: {
			id: true,
		},
	});
};

export const approvePurchaseOrder = async (
	purchaseId: string,
	organizationId: string,
) => {
	await validateOrganization(organizationId);

	const purchaseOrder = await prisma.purchaseOrder.findUnique({
		where: { id: purchaseId },
		select: {
			id: true,
			organizationId: true,
			status: true,
		},
	});

	if (!purchaseOrder) {
		throw new InventoryError(404, "Purchase order not found");
	}

	if (purchaseOrder.organizationId !== organizationId) {
		throw new InventoryError(403, "Purchase order does not belong to this organization");
	}

	if (purchaseOrder.status !== "DRAFT") {
		throw new InventoryError(400, "Only DRAFT purchase orders can be approved");
	}

	return prisma.purchaseOrder.update({
		where: { id: purchaseOrder.id },
		data: { status: "APPROVED" },
	});
};

const getPurchaseOrderReceiptsByProduct = async (purchaseId: string) => {
	const grouped = await prisma.stockMovement.groupBy({
		by: ["productId"],
		where: {
			referenceId: purchaseId,
			type: "PURCHASE",
		},
		_sum: {
			quantity: true,
		},
	});

	const map = new Map<string, number>();
	for (const row of grouped) {
		map.set(row.productId, row._sum.quantity ?? 0);
	}

	return map;
};

export const receivePurchaseOrder = async (
	purchaseId: string,
	organizationId: string,
	warehouseId?: string,
	items?: ReceivePurchaseOrderItemInput[],
) => {
	await validateOrganization(organizationId);

	const purchaseOrder = await prisma.purchaseOrder.findUnique({
		where: { id: purchaseId },
		include: {
			items: {
				include: {
					product: {
						select: {
							id: true,
							organizationId: true,
						},
					},
				},
			},
			vendor: {
				select: {
					id: true,
					organizationId: true,
					type: true,
				},
			},
		},
	});

	if (!purchaseOrder) {
		throw new InventoryError(404, "Purchase order not found");
	}

	if (purchaseOrder.organizationId !== organizationId) {
		throw new InventoryError(403, "Purchase order does not belong to this organization");
	}

	if (!["APPROVED", "PARTIAL_RECEIVED"].includes(purchaseOrder.status)) {
		throw new InventoryError(400, "Only APPROVED or PARTIAL_RECEIVED purchase orders can be received");
	}

	if (purchaseOrder.items.length === 0) {
		throw new InventoryError(400, "Cannot receive purchase order without items");
	}

	if (purchaseOrder.vendor.organizationId !== organizationId || purchaseOrder.vendor.type !== "VENDOR") {
		throw new InventoryError(400, "Purchase order vendor is invalid for this organization");
	}

	const targetWarehouse = warehouseId
		? await validateWarehouse(warehouseId, organizationId)
		: await prisma.warehouse.findFirst({
			where: { organizationId },
			orderBy: { name: "asc" },
			select: { id: true, organizationId: true, name: true },
		});

	if (!targetWarehouse) {
		throw new InventoryError(400, "No warehouse found for stock receipt. Create a warehouse first.");
	}

	const previouslyReceived = await getPurchaseOrderReceiptsByProduct(purchaseOrder.id);

	const itemByProductId = new Map(purchaseOrder.items.map((item) => [item.productId, item]));

	let requestedItems: ReceivePurchaseOrderItemInput[] = [];
	if (Array.isArray(items) && items.length > 0) {
		requestedItems = items;
	} else {
		requestedItems = purchaseOrder.items
			.map((item) => {
				const received = previouslyReceived.get(item.productId) ?? 0;
				const remaining = item.quantity - received;
				return {
					productId: item.productId,
					quantity: remaining,
				};
			})
			.filter((entry) => entry.quantity > 0);
	}

	if (requestedItems.length === 0) {
		throw new InventoryError(400, "No receivable quantity left for this purchase order");
	}

	const receiptPlan = requestedItems.map((entry) => {
		ensurePositiveQuantity(entry.quantity);
		const purchaseItem = itemByProductId.get(entry.productId);
		if (!purchaseItem) {
			throw new InventoryError(400, `productId ${entry.productId} does not belong to this purchase order`);
		}

		if (purchaseItem.product.organizationId !== organizationId) {
			throw new InventoryError(400, "Purchase item product does not belong to this organization");
		}

		const alreadyReceived = previouslyReceived.get(entry.productId) ?? 0;
		const remaining = purchaseItem.quantity - alreadyReceived;
		if (remaining <= 0) {
			throw new InventoryError(400, `Product ${entry.productId} is already fully received`);
		}

		if (entry.quantity > remaining) {
			throw new InventoryError(400, `Requested quantity exceeds remaining quantity for product ${entry.productId}`);
		}

		return {
			productId: entry.productId,
			quantity: entry.quantity,
			unitPrice: Number(purchaseItem.unitPrice),
		};
	});

	const receivedValue = Number(
		receiptPlan.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0).toFixed(2),
	);

	return prisma.$transaction(async (tx) => {
		for (const line of receiptPlan) {
			await tx.stockItem.upsert({
				where: {
					productId_warehouseId: {
						productId: line.productId,
						warehouseId: targetWarehouse.id,
					},
				},
				update: {
					quantity: { increment: line.quantity },
				},
				create: {
					productId: line.productId,
					warehouseId: targetWarehouse.id,
					quantity: line.quantity,
				},
			});

			await tx.stockMovement.create({
				data: {
					organizationId,
					productId: line.productId,
					warehouseId: targetWarehouse.id,
					type: "PURCHASE",
					quantity: line.quantity,
					referenceId: purchaseOrder.id,
					notes: `Stock receipt for PO ${purchaseOrder.id}`,
				},
			});
		}

		const totalReceivedByProduct = new Map<string, number>(previouslyReceived);
		for (const line of receiptPlan) {
			totalReceivedByProduct.set(
				line.productId,
				(totalReceivedByProduct.get(line.productId) ?? 0) + line.quantity,
			);
		}

		const allItemsReceived = purchaseOrder.items.every((item) => {
			const received = totalReceivedByProduct.get(item.productId) ?? 0;
			return received >= item.quantity;
		});

		const updatedPurchase = await tx.purchaseOrder.update({
			where: { id: purchaseOrder.id },
			data: { status: allItemsReceived ? "RECEIVED" : "PARTIAL_RECEIVED" },
		});

		const inventoryAccount = await getOrCreateLedgerAccount(organizationId, "Inventory", "ASSET");
		const accountsPayableAccount = await getOrCreateLedgerAccount(
			organizationId,
			"Accounts Payable",
			"LIABILITY",
		);

		const transaction = await createTransactionWithEntries(
			organizationId,
			"PURCHASE",
			`${purchaseOrder.id}:RCV:${Date.now()}`,
			[
				{
					ledgerAccountId: inventoryAccount.id,
					debit: receivedValue,
				},
				{
					ledgerAccountId: accountsPayableAccount.id,
					credit: receivedValue,
				},
			],
			{
				contactId: purchaseOrder.vendorId,
				totalAmount: receivedValue,
				status: "POSTED",
				transactionDate: new Date(),
				tx,
			},
		);

		return {
			purchaseOrder: updatedPurchase,
			transaction,
			receivingWarehouse: targetWarehouse,
			receivedValue,
		};
	});
};

const getPurchaseOrderReturnsByProduct = async (purchaseId: string) => {
	const grouped = await prisma.stockMovement.groupBy({
		by: ["productId"],
		where: {
			referenceId: purchaseId,
			type: "PURCHASE_RETURN",
		},
		_sum: {
			quantity: true,
		},
	});

	const map = new Map<string, number>();
	for (const row of grouped) {
		const raw = row._sum.quantity ?? 0;
		map.set(row.productId, Math.abs(raw));
	}

	return map;
};

export const returnPurchaseOrder = async (
	purchaseId: string,
	organizationId: string,
	warehouseId?: string,
	items?: ReturnPurchaseOrderItemInput[],
) => {
	await validateOrganization(organizationId);

	const purchaseOrder = await prisma.purchaseOrder.findUnique({
		where: { id: purchaseId },
		include: {
			items: {
				include: {
					product: {
						select: {
							id: true,
							organizationId: true,
						},
					},
				},
			},
			vendor: {
				select: {
					id: true,
					organizationId: true,
					type: true,
				},
			},
		},
	});

	if (!purchaseOrder) {
		throw new InventoryError(404, "Purchase order not found");
	}

	if (purchaseOrder.organizationId !== organizationId) {
		throw new InventoryError(403, "Purchase order does not belong to this organization");
	}

	if (!["RECEIVED", "PARTIAL_RECEIVED"].includes(purchaseOrder.status)) {
		throw new InventoryError(400, "Only RECEIVED or PARTIAL_RECEIVED purchase orders can be returned");
	}

	if (purchaseOrder.vendor.organizationId !== organizationId || purchaseOrder.vendor.type !== "VENDOR") {
		throw new InventoryError(400, "Purchase order vendor is invalid for this organization");
	}

	const targetWarehouse = warehouseId
		? await validateWarehouse(warehouseId, organizationId)
		: await prisma.warehouse.findFirst({
			where: { organizationId },
			orderBy: { name: "asc" },
			select: { id: true, organizationId: true, name: true },
		});

	if (!targetWarehouse) {
		throw new InventoryError(400, "No warehouse found for purchase return. Create a warehouse first.");
	}

	const receivedByProduct = await getPurchaseOrderReceiptsByProduct(purchaseOrder.id);
	const returnedByProduct = await getPurchaseOrderReturnsByProduct(purchaseOrder.id);
	const itemByProductId = new Map(purchaseOrder.items.map((item) => [item.productId, item]));

	let requestedItems: ReturnPurchaseOrderItemInput[] = [];
	if (Array.isArray(items) && items.length > 0) {
		requestedItems = items;
	} else {
		requestedItems = purchaseOrder.items
			.map((item) => {
				const received = receivedByProduct.get(item.productId) ?? 0;
				const alreadyReturned = returnedByProduct.get(item.productId) ?? 0;
				const returnable = received - alreadyReturned;
				return {
					productId: item.productId,
					quantity: returnable,
				};
			})
			.filter((entry) => entry.quantity > 0);
	}

	if (requestedItems.length === 0) {
		throw new InventoryError(400, "No returnable quantity left for this purchase order");
	}

	const returnPlan = requestedItems.map((entry) => {
		ensurePositiveQuantity(entry.quantity);

		const purchaseItem = itemByProductId.get(entry.productId);
		if (!purchaseItem) {
			throw new InventoryError(400, `productId ${entry.productId} does not belong to this purchase order`);
		}

		if (purchaseItem.product.organizationId !== organizationId) {
			throw new InventoryError(400, "Purchase item product does not belong to this organization");
		}

		const received = receivedByProduct.get(entry.productId) ?? 0;
		const alreadyReturned = returnedByProduct.get(entry.productId) ?? 0;
		const returnable = received - alreadyReturned;

		if (returnable <= 0) {
			throw new InventoryError(400, `Product ${entry.productId} has no returnable quantity`);
		}

		if (entry.quantity > returnable) {
			throw new InventoryError(400, `Requested return quantity exceeds returnable quantity for product ${entry.productId}`);
		}

		return {
			productId: entry.productId,
			quantity: entry.quantity,
			unitPrice: Number(purchaseItem.unitPrice),
		};
	});

	const returnedValue = Number(returnPlan.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0).toFixed(2));

	return prisma.$transaction(async (tx) => {
		for (const line of returnPlan) {
			const stockItem = await tx.stockItem.findUnique({
				where: {
					productId_warehouseId: {
						productId: line.productId,
						warehouseId: targetWarehouse.id,
					},
				},
			});

			if (!stockItem || stockItem.quantity < line.quantity) {
				throw new InventoryError(400, `Insufficient stock in ${targetWarehouse.name} for return product ${line.productId}`);
			}

			await tx.stockItem.update({
				where: { id: stockItem.id },
				data: { quantity: { decrement: line.quantity } },
			});

			await tx.stockMovement.create({
				data: {
					organizationId,
					productId: line.productId,
					warehouseId: targetWarehouse.id,
					type: "PURCHASE_RETURN",
					quantity: -line.quantity,
					referenceId: purchaseOrder.id,
					notes: `Purchase return for PO ${purchaseOrder.id}`,
				},
			});
		}

		const inventoryAccount = await getOrCreateLedgerAccount(organizationId, "Inventory", "ASSET");
		const accountsPayableAccount = await getOrCreateLedgerAccount(organizationId, "Accounts Payable", "LIABILITY");

		const transaction = await createTransactionWithEntries(
			organizationId,
			"PURCHASE",
			`${purchaseOrder.id}:RET:${Date.now()}`,
			[
				{
					ledgerAccountId: accountsPayableAccount.id,
					debit: returnedValue,
				},
				{
					ledgerAccountId: inventoryAccount.id,
					credit: returnedValue,
				},
			],
			{
				contactId: purchaseOrder.vendorId,
				totalAmount: returnedValue,
				status: "POSTED",
				transactionDate: new Date(),
				tx,
			},
		);

		return {
			purchaseOrderId: purchaseOrder.id,
			transaction,
			returningWarehouse: targetWarehouse,
			returnedValue,
		};
	});
};

export const getPurchaseOrders = async (organizationId: string) => {
	await validateOrganization(organizationId);
	const purchaseOrders = await prisma.purchaseOrder.findMany({
		where: {
			organizationId,
		},
		include: {
			vendor: {
				select: {
					id: true,
					companyName: true,
					firstName: true,
					lastName: true,
					email: true,
					phone: true,
				},
			},
			items: {
				include: {
					product: {
						select: {
							id: true,
							name: true,
							sku: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	const purchaseIds = purchaseOrders.map((order) => order.id);
	const receiptRows = purchaseIds.length
		? await prisma.stockMovement.groupBy({
			by: ["referenceId", "productId"],
			where: {
				referenceId: { in: purchaseIds },
				type: "PURCHASE",
			},
			_sum: {
				quantity: true,
			},
		})
		: [];

	const returnRows = purchaseIds.length
		? await prisma.stockMovement.groupBy({
			by: ["referenceId", "productId"],
			where: {
				referenceId: { in: purchaseIds },
				type: "PURCHASE_RETURN",
			},
			_sum: {
				quantity: true,
			},
		})
		: [];

	const receiptMap = new Map<string, number>();
	for (const row of receiptRows) {
		if (!row.referenceId) continue;
		receiptMap.set(`${row.referenceId}:${row.productId}`, row._sum.quantity ?? 0);
	}

	const returnMap = new Map<string, number>();
	for (const row of returnRows) {
		if (!row.referenceId) continue;
		returnMap.set(`${row.referenceId}:${row.productId}`, Math.abs(row._sum.quantity ?? 0));
	}

	return purchaseOrders.map((order) => {
		const items = order.items.map((item) => {
			const receivedQuantity = receiptMap.get(`${order.id}:${item.productId}`) ?? 0;
			const returnedQuantity = returnMap.get(`${order.id}:${item.productId}`) ?? 0;
			const returnableQuantity = Math.max(receivedQuantity - returnedQuantity, 0);
			const pendingQuantity = Math.max(item.quantity - receivedQuantity, 0);
			return {
				...item,
				receivedQuantity,
				returnedQuantity,
				returnableQuantity,
				pendingQuantity,
			};
		});

		const totalOrderedQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
		const totalReceivedQuantity = items.reduce((sum, item) => sum + item.receivedQuantity, 0);
		const totalReturnedQuantity = items.reduce((sum, item) => sum + item.returnedQuantity, 0);
		const totalReturnableQuantity = items.reduce((sum, item) => sum + item.returnableQuantity, 0);
		const totalPendingQuantity = Math.max(totalOrderedQuantity - totalReceivedQuantity, 0);

		return {
			...order,
			items,
			totalOrderedQuantity,
			totalReceivedQuantity,
			totalReturnedQuantity,
			totalReturnableQuantity,
			totalPendingQuantity,
		};
	});
};

export const addStock = async (
	organizationId: string,
	productId: string,
	warehouseId: string,
	quantity: number,
	referenceId?: string,
	notes?: string,
) => {
	ensurePositiveQuantity(quantity);
	await validateProduct(productId, organizationId);
	await validateWarehouse(warehouseId, organizationId);

	return prisma.$transaction(async (tx) => {
		const baseStockItem = await getOrCreateStockItem(productId, warehouseId, tx as typeof prisma);

		const stockItem = await tx.stockItem.update({
			where: { id: baseStockItem.id },
			data: {
				quantity: { increment: quantity },
			},
		});

		const movement = await tx.stockMovement.create({
			data: {
				organizationId,
				productId,
				warehouseId,
				type: "PURCHASE",
				quantity,
				referenceId,
				notes,
			},
		});

		return { stockItem, movement };
	});
};

export const reduceStock = async (
	organizationId: string,
	productId: string,
	warehouseId: string,
	quantity: number,
	referenceId?: string,
	notes?: string,
) => {
	ensurePositiveQuantity(quantity);
	await validateProduct(productId, organizationId);
	await validateWarehouse(warehouseId, organizationId);

	return reduceStockWithDb(prisma, organizationId, productId, warehouseId, quantity, referenceId, notes);
};

export const reduceStockWithDb = async (
	db: Prisma.TransactionClient | typeof prisma,
	organizationId: string,
	productId: string,
	warehouseId: string,
	quantity: number,
	referenceId?: string,
	notes?: string,
) => {
	ensurePositiveQuantity(quantity);

	const stockItem = await db.stockItem.findUnique({
		where: {
			productId_warehouseId: { productId, warehouseId },
		},
	});

	if (!stockItem || stockItem.quantity < quantity) {
		throw new InventoryError(400, "Insufficient stock for this warehouse");
	}

	const updated = await db.stockItem.update({
		where: { id: stockItem.id },
		data: { quantity: { decrement: quantity } },
	});

	const movement = await db.stockMovement.create({
		data: {
			organizationId,
			productId,
			warehouseId,
			type: "SALE",
			quantity: -quantity,
			referenceId,
			notes,
		},
	});

	return { stockItem: updated, movement };
};

export const transferStock = async (
	organizationId: string,
	productId: string,
	fromWarehouseId: string,
	toWarehouseId: string,
	quantity: number,
	referenceId?: string,
	notes?: string,
) => {
	ensurePositiveQuantity(quantity);

	if (fromWarehouseId === toWarehouseId) {
		throw new InventoryError(400, "Source and destination warehouse must be different");
	}

	await validateProduct(productId, organizationId);
	await validateWarehouse(fromWarehouseId, organizationId);
	await validateWarehouse(toWarehouseId, organizationId);

	return prisma.$transaction(async (tx) => {
		const source = await tx.stockItem.findUnique({
			where: {
				productId_warehouseId: { productId, warehouseId: fromWarehouseId },
			},
		});

		if (!source || source.quantity < quantity) {
			throw new InventoryError(400, "Insufficient stock in source warehouse");
		}

		await tx.stockItem.update({
			where: { id: source.id },
			data: { quantity: { decrement: quantity } },
		});

		const destination = await tx.stockItem.upsert({
			where: {
				productId_warehouseId: { productId, warehouseId: toWarehouseId },
			},
			update: { quantity: { increment: quantity } },
			create: {
				productId,
				warehouseId: toWarehouseId,
				quantity,
			},
		});

		const [outMovement, inMovement] = await Promise.all([
			tx.stockMovement.create({
				data: {
					organizationId,
					productId,
					warehouseId: fromWarehouseId,
					type: "TRANSFER_OUT",
					quantity: -quantity,
					referenceId,
					notes,
				},
			}),
			tx.stockMovement.create({
				data: {
					organizationId,
					productId,
					warehouseId: toWarehouseId,
					type: "TRANSFER_IN",
					quantity,
					referenceId,
					notes,
				},
			}),
		]);

		return {
			destination,
			movements: {
				outMovement,
				inMovement,
			},
		};
	});
};

export const adjustStock = async (
	organizationId: string,
	productId: string,
	warehouseId: string,
	newQuantity: number,
	reason: string,
	referenceId?: string,
) => {
	if (!Number.isInteger(newQuantity) || newQuantity < 0) {
		throw new InventoryError(400, "newQuantity must be a non-negative integer");
	}

	if (!reason?.trim()) {
		throw new InventoryError(400, "reason is required for stock adjustment");
	}

	await validateProduct(productId, organizationId);
	await validateWarehouse(warehouseId, organizationId);

	return prisma.$transaction(async (tx) => {
		const stockItem = await tx.stockItem.upsert({
			where: {
				productId_warehouseId: { productId, warehouseId },
			},
			update: {},
			create: {
				productId,
				warehouseId,
				quantity: 0,
			},
		});

		const quantityDelta = newQuantity - stockItem.quantity;
		if (quantityDelta === 0) {
			throw new InventoryError(400, "No adjustment needed. Stock quantity is unchanged");
		}

		const updated = await tx.stockItem.update({
			where: { id: stockItem.id },
			data: { quantity: newQuantity },
		});

		const movement = await tx.stockMovement.create({
			data: {
				organizationId,
				productId,
				warehouseId,
				type: "ADJUSTMENT",
				quantity: quantityDelta,
				referenceId,
				notes: reason.trim(),
			},
		});

		return { stockItem: updated, movement };
	});
};

export const getInventorySummary = async (organizationId: string) => {
	await validateOrganization(organizationId);
	const store = await loadInventoryMetaStore();

	const [productsCount, warehousesCount, stockItems, movementAgg] = await Promise.all([
		prisma.product.count({
			where: { organizationId, isActive: true },
		}),
		prisma.warehouse.count({
			where: { organizationId },
		}),
		prisma.stockItem.findMany({
		where: {
			product: {
				organizationId,
			},
			warehouse: {
				organizationId,
			},
		},
		include: {
			product: {
				select: {
					id: true,
					name: true,
					sku: true,
					unitPrice: true,
					costPrice: true,
				},
			},
			warehouse: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		}),
		prisma.stockMovement.groupBy({
			by: ["productId"],
			where: { organizationId },
			_count: { productId: true },
		}),
	]);

	const totalStockValue = Number(
		stockItems
			.reduce((sum, item) => {
				const unitCost = Number(item.product.costPrice ?? item.product.unitPrice);
				return sum + unitCost * item.quantity;
			}, 0)
			.toFixed(2),
	);

	const lowStockProducts = stockItems
		.filter((item) => {
			const reorderLevel = store.productSettings[item.product.id]?.reorderLevel ?? 10;
			return item.quantity <= reorderLevel;
		})
		.map((item) => ({
			productId: item.product.id,
			name: item.product.name,
			sku: item.product.sku,
			warehouseId: item.warehouse.id,
			warehouseName: item.warehouse.name,
			quantity: item.quantity,
			reorderLevel: store.productSettings[item.product.id]?.reorderLevel ?? 10,
		}))
		.sort((a, b) => a.quantity - b.quantity)
		.slice(0, 20);

	const movementCountMap = new Map<string, number>();
	for (const row of movementAgg) {
		movementCountMap.set(row.productId, row._count.productId);
	}

	const productStats = new Map<string, { productId: string; name: string; sku: string; movementCount: number }>();
	for (const item of stockItems) {
		if (!productStats.has(item.product.id)) {
			productStats.set(item.product.id, {
				productId: item.product.id,
				name: item.product.name,
				sku: item.product.sku,
				movementCount: movementCountMap.get(item.product.id) ?? 0,
			});
		}
	}

	const topMovingProducts = Array.from(productStats.values())
		.sort((a, b) => b.movementCount - a.movementCount)
		.slice(0, 5);

	return {
		totalProducts: productsCount,
		totalStockValue,
		totalWarehouses: warehousesCount,
		lowStockProducts,
		topMovingProducts,
	};
};

export const getStockSummary = getInventorySummary;

export const getStockMovements = async (
	productId: string,
	organizationId: string,
) => {
	await validateOrganization(organizationId);
	await validateProduct(productId, organizationId);

	return prisma.stockMovement.findMany({
		where: {
			organizationId,
			productId,
		},
		include: {
			product: {
				select: {
					id: true,
					name: true,
					sku: true,
				},
			},
			warehouse: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});
};

export const getStockMovementsByOrganization = async (
	organizationId: string,
	options?: {
		productId?: string;
		warehouseId?: string;
		type?: "PURCHASE" | "SALE" | "ADJUSTMENT" | "TRANSFER_OUT" | "TRANSFER_IN" | "PURCHASE_RETURN";
		fromDate?: string;
		toDate?: string;
		limit?: number;
	},
) => {
	await validateOrganization(organizationId);

	if (options?.productId) {
		await validateProduct(options.productId, organizationId);
	}

	if (options?.warehouseId) {
		await validateWarehouse(options.warehouseId, organizationId);
	}

	const createdAtFilter: Prisma.DateTimeFilter = {};
	if (options?.fromDate) {
		const from = new Date(options.fromDate);
		if (Number.isNaN(from.getTime())) {
			throw new InventoryError(400, "Invalid fromDate");
		}
		createdAtFilter.gte = from;
	}

	if (options?.toDate) {
		const to = new Date(options.toDate);
		if (Number.isNaN(to.getTime())) {
			throw new InventoryError(400, "Invalid toDate");
		}
		createdAtFilter.lte = to;
	}

	if (createdAtFilter.gte && createdAtFilter.lte && createdAtFilter.gte > createdAtFilter.lte) {
		throw new InventoryError(400, "fromDate must be before or equal to toDate");
	}

	const limit = options?.limit && options.limit > 0 ? Math.min(options.limit, 500) : 100;

	return prisma.stockMovement.findMany({
		where: {
			organizationId,
			...(options?.productId ? { productId: options.productId } : {}),
			...(options?.warehouseId ? { warehouseId: options.warehouseId } : {}),
			...(options?.type ? { type: options.type } : {}),
			...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
		},
		include: {
			product: {
				select: {
					id: true,
					name: true,
					sku: true,
				},
			},
			warehouse: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});
};

export const getReorderSuggestions = async (organizationId: string) => {
	await validateOrganization(organizationId);
	const store = await loadInventoryMetaStore();

	const stockItems = await prisma.stockItem.findMany({
		where: {
			product: {
				organizationId,
				isActive: true,
			},
			warehouse: {
				organizationId,
			},
		},
		include: {
			product: {
				select: {
					id: true,
					name: true,
					sku: true,
					costPrice: true,
					unitPrice: true,
				},
			},
			warehouse: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: {
			product: {
				name: "asc",
			},
		},
	});

	return stockItems
		.map((item) => {
			const reorderLevel = store.productSettings[item.product.id]?.reorderLevel ?? 10;
			const shortfall = reorderLevel - item.quantity;
			const suggestedOrderQty = shortfall > 0 ? shortfall : 0;
			const unitCost = Number(item.product.costPrice ?? item.product.unitPrice ?? 0);
			return {
				productId: item.product.id,
				productName: item.product.name,
				sku: item.product.sku,
				warehouseId: item.warehouse.id,
				warehouseName: item.warehouse.name,
				currentQuantity: item.quantity,
				reorderLevel,
				shortfall: shortfall > 0 ? shortfall : 0,
				suggestedOrderQty,
				estimatedCost: Number((suggestedOrderQty * unitCost).toFixed(2)),
			};
		})
		.filter((item) => item.shortfall > 0)
		.sort((a, b) => b.shortfall - a.shortfall);
};

export const exportStockLedgerCsv = async (
	organizationId: string,
	options?: {
		productId?: string;
		warehouseId?: string;
		type?: "PURCHASE" | "SALE" | "ADJUSTMENT" | "TRANSFER_OUT" | "TRANSFER_IN" | "PURCHASE_RETURN";
		fromDate?: string;
		toDate?: string;
	},
) => {
	const rows = await getStockMovementsByOrganization(organizationId, {
		...options,
		limit: 5000,
	});

	const escape = (value: string | number | null | undefined) => {
		const text = value === null || value === undefined ? "" : String(value);
		return `"${text.replace(/"/g, '""')}"`;
	};

	const header = [
		"Movement ID",
		"Created At",
		"Type",
		"Product",
		"SKU",
		"Warehouse",
		"Quantity",
		"Reference ID",
		"Notes",
	];

	const lines = rows.map((row) => [
		row.id,
		row.createdAt.toISOString(),
		row.type,
		row.product?.name ?? "",
		row.product?.sku ?? "",
		row.warehouse?.name ?? "",
		row.quantity,
		row.referenceId ?? "",
		row.notes ?? "",
	]);

	return [header, ...lines].map((line) => line.map((cell) => escape(cell)).join(",")).join("\n");
};

export const getInventoryAuditFeed = async (organizationId: string, limit = 200) => {
	await validateOrganization(organizationId);
	const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 500) : 200;

	const [movements, purchaseOrders] = await Promise.all([
		prisma.stockMovement.findMany({
			where: { organizationId },
			include: {
				product: {
					select: {
						name: true,
						sku: true,
					},
				},
				warehouse: {
					select: {
						name: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: safeLimit,
		}),
		prisma.purchaseOrder.findMany({
			where: { organizationId },
			select: {
				id: true,
				status: true,
				totalAmount: true,
				createdAt: true,
			},
			orderBy: { createdAt: "desc" },
			take: safeLimit,
		}),
	]);

	const movementEvents = movements.map((item) => ({
		id: `mv:${item.id}`,
		eventType: "STOCK_MOVEMENT",
		occurredAt: item.createdAt,
		title: `${item.type} ${item.quantity > 0 ? "+" : ""}${item.quantity}`,
		details: `${item.product?.name || "Product"} (${item.product?.sku || "-"}) @ ${item.warehouse?.name || "Warehouse"}`,
		referenceId: item.referenceId,
		notes: item.notes,
	}));

	const purchaseEvents = purchaseOrders.map((item) => ({
		id: `po:${item.id}:${item.createdAt.toISOString()}`,
		eventType: "PURCHASE_ORDER",
		occurredAt: item.createdAt,
		title: `PO ${item.id.slice(0, 10)} status ${item.status}`,
		details: `Total amount ${item.totalAmount}`,
		referenceId: item.id,
		notes: "Created",
	}));

	return [...movementEvents, ...purchaseEvents]
		.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
		.slice(0, safeLimit);
};
