"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";

declare global {
	interface Window {
		google?: any;
	}
}

let googleMapsScriptPromise: Promise<void> | null = null;

const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
	if (typeof window === "undefined") {
		return Promise.resolve();
	}

	if (window.google?.maps) {
		return Promise.resolve();
	}

	if (googleMapsScriptPromise) {
		return googleMapsScriptPromise;
	}

	googleMapsScriptPromise = new Promise((resolve, reject) => {
		const existing = document.querySelector('script[data-google-maps="inventory-warehouse"]') as HTMLScriptElement | null;
		if (existing) {
			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")), { once: true });
			return;
		}

		const script = document.createElement("script");
		script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
		script.async = true;
		script.defer = true;
		script.dataset.googleMaps = "inventory-warehouse";
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Failed to load Google Maps script"));
		document.head.appendChild(script);
	});

	return googleMapsScriptPromise;
};

type Product = {
	id: string;
	name: string;
	sku: string;
	description?: string | null;
	unitPrice: number;
	costPrice?: number | null;
	taxRate?: number | null;
	isActive?: boolean;
	category?: string;
	unit?: string;
	reorderLevel?: number;
};

type Warehouse = {
	id: string;
	name: string;
	location?: string | null;
	latitude?: number | null;
	longitude?: number | null;
};

type Vendor = {
	id: string;
	companyName?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	phone?: string | null;
	gstNumber?: string | null;
	isActive?: boolean;
};

type PurchaseOrder = {
	id: string;
	status: string;
	totalAmount: number;
	createdAt: string;
	totalOrderedQuantity?: number;
	totalReceivedQuantity?: number;
	totalReturnedQuantity?: number;
	totalReturnableQuantity?: number;
	totalPendingQuantity?: number;
	vendor?: Vendor;
	items: Array<{
		id: string;
		productId: string;
		quantity: number;
		receivedQuantity?: number;
		returnedQuantity?: number;
		returnableQuantity?: number;
		pendingQuantity?: number;
		unitPrice: number;
		product?: { id: string; name: string; sku: string };
	}>;
};

type ReorderSuggestion = {
	productId: string;
	productName: string;
	sku: string;
	warehouseId: string;
	warehouseName: string;
	currentQuantity: number;
	reorderLevel: number;
	shortfall: number;
	suggestedOrderQty: number;
	estimatedCost: number;
};

type InventoryAuditEntry = {
	id: string;
	eventType: string;
	occurredAt: string;
	title: string;
	details: string;
	referenceId?: string | null;
	notes?: string | null;
};

type Movement = {
	id: string;
	type: string;
	quantity: number;
	createdAt: string;
	notes?: string | null;
	product?: { id: string; name: string; sku: string };
	warehouse?: { id: string; name: string };
};

type GatePass = {
	id: string;
	passNumber: string;
	type: "INWARD" | "OUTWARD";
	status: "OPEN" | "CLOSED" | "CANCELLED";
	vehicleNumber?: string | null;
	driverName?: string | null;
	referenceType?: string | null;
	referenceId?: string | null;
	notes?: string | null;
	createdAt: string;
	closedAt?: string | null;
	warehouse?: { id: string; name: string };
	items: Array<{
		id: string;
		productId: string;
		quantity: number;
		product?: { id: string; name: string; sku: string };
	}>;
};

type InventorySummary = {
	totalProducts: number;
	totalStockValue: number;
	totalWarehouses: number;
	lowStockProducts: Array<{
		productId: string;
		name: string;
		sku: string;
		warehouseName: string;
		quantity: number;
		reorderLevel?: number;
	}>;
	topMovingProducts: Array<{
		productId: string;
		name: string;
		sku: string;
		movementCount: number;
	}>;
};

type InventoryTab = "overview" | "products" | "warehouses" | "stock" | "purchase" | "gatePass" | "movements";
type MovementType = "PURCHASE" | "SALE" | "ADJUSTMENT" | "TRANSFER_OUT" | "TRANSFER_IN" | "PURCHASE_RETURN";

const tabLabel: Record<InventoryTab, string> = {
	overview: "Overview",
	products: "Products",
	warehouses: "Warehouses",
	stock: "Stock Ops",
	purchase: "Purchase",
	gatePass: "Gate Pass",
	movements: "Movements",
};

const getApiErrorMessage = async (response: Response, fallback: string): Promise<string> => {
	const raw = await response.text();
	if (!raw) {
		return fallback;
	}

	try {
		const parsed = JSON.parse(raw) as { message?: string };
		return parsed.message || fallback;
	} catch {
		return raw;
	}
};

export default function InventoryPage() {
	type MovementFiltersState = {
		productId: string;
		warehouseId: string;
		type: "" | MovementType;
		fromDate: string;
		toDate: string;
	};

	const [activeTab, setActiveTab] = useState<InventoryTab>("overview");
	const [loading, setLoading] = useState(true);
	const [notice, setNotice] = useState<string | null>(null);

	const [summary, setSummary] = useState<InventorySummary | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
	const [vendors, setVendors] = useState<Vendor[]>([]);
	const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
	const [movements, setMovements] = useState<Movement[]>([]);
	const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
	const [auditEntries, setAuditEntries] = useState<InventoryAuditEntry[]>([]);
	const [gatePasses, setGatePasses] = useState<GatePass[]>([]);

	const [productForm, setProductForm] = useState({
		name: "",
		sku: "",
		unitPrice: "",
		costPrice: "",
		taxRate: "",
		description: "",
		category: "",
		unit: "",
		reorderLevel: "",
	});
	const [warehouseForm, setWarehouseForm] = useState({ name: "", location: "", latitude: "", longitude: "" });
	const [stockForm, setStockForm] = useState({ productId: "", warehouseId: "", quantity: "", toWarehouseId: "", newQuantity: "", notes: "" });
	const [purchaseForm, setPurchaseForm] = useState({ vendorName: "", vendorEmail: "", vendorPhone: "", productId: "", quantity: "", unitPrice: "" });
	const [purchaseCreateItems, setPurchaseCreateItems] = useState<Array<{ productId: string; quantity: string; unitPrice: string }>>([
		{ productId: "", quantity: "", unitPrice: "" },
	]);
	const [editingDraftPurchaseId, setEditingDraftPurchaseId] = useState<string | null>(null);
	const [purchaseEditItems, setPurchaseEditItems] = useState<Array<{ productId: string; quantity: string; unitPrice: string }>>([]);
	const [vendorForm, setVendorForm] = useState({ companyName: "", firstName: "", lastName: "", email: "", phone: "", gstNumber: "" });
	const [purchaseReceiveWarehouseById, setPurchaseReceiveWarehouseById] = useState<Record<string, string>>({});
	const [purchaseReceiveQtyById, setPurchaseReceiveQtyById] = useState<Record<string, Record<string, string>>>({});
	const [purchaseReturnQtyById, setPurchaseReturnQtyById] = useState<Record<string, Record<string, string>>>({});
	const [movementFilters, setMovementFilters] = useState<MovementFiltersState>({
		productId: "",
		warehouseId: "",
		type: "" as "" | MovementType,
		fromDate: "",
		toDate: "",
	});
	const [gatePassForm, setGatePassForm] = useState({
		type: "OUTWARD" as "INWARD" | "OUTWARD",
		warehouseId: "",
		vehicleNumber: "",
		driverName: "",
		referenceType: "",
		referenceId: "",
		notes: "",
	});
	const [gatePassItems, setGatePassItems] = useState<Array<{ productId: string; quantity: string }>>([
		{ productId: "", quantity: "" },
	]);
	const [warehouseMapError, setWarehouseMapError] = useState<string | null>(null);
	const warehouseMapElementRef = useRef<HTMLDivElement | null>(null);
	const warehouseGoogleMapRef = useRef<any>(null);
	const warehouseGoogleMarkerRef = useRef<any>(null);

	const getAuthHeaders = () => {
		const headers = new Headers();
		if (typeof window !== "undefined") {
			const token = localStorage.getItem("authToken");
			if (token) {
				headers.set("Authorization", `Bearer ${token}`);
			}
		}
		return headers;
	};

	const getMovementQueryString = (filters: MovementFiltersState) => {
		const params = new URLSearchParams();
		params.set("limit", "200");

		if (filters.productId) {
			params.set("productId", filters.productId);
		}

		if (filters.warehouseId) {
			params.set("warehouseId", filters.warehouseId);
		}

		if (filters.type) {
			params.set("type", filters.type);
		}

		if (filters.fromDate) {
			params.set("fromDate", `${filters.fromDate}T00:00:00.000Z`);
		}

		if (filters.toDate) {
			params.set("toDate", `${filters.toDate}T23:59:59.999Z`);
		}

		return params.toString();
	};

	const loadAll = async (filtersOverride?: MovementFiltersState) => {
		setLoading(true);
		setNotice(null);
		try {
			const headers = getAuthHeaders();
			const movementQueryString = getMovementQueryString(filtersOverride ?? movementFilters);
			const [summaryRes, productsRes, warehousesRes, vendorsRes, purchaseRes, movementsRes, reorderRes, auditRes, gatePassRes] = await Promise.all([
				fetch("/api/inventory/stock/summary", { headers }),
				fetch("/api/inventory/products", { headers }),
				fetch("/api/inventory/warehouses", { headers }),
				fetch("/api/inventory/vendors", { headers }),
				fetch("/api/inventory/purchase", { headers }),
				fetch(`/api/inventory/stock/movements?${movementQueryString}`, { headers }),
				fetch("/api/inventory/stock/reorder-suggestions", { headers }),
				fetch("/api/inventory/audit?limit=100", { headers }),
				fetch("/api/inventory/gate-passes", { headers }),
			]);

			if (!summaryRes.ok) {
				setNotice(await getApiErrorMessage(summaryRes, "Unable to load inventory."));
				return;
			}

			setSummary((await summaryRes.json()) as InventorySummary);
			setProducts(productsRes.ok ? ((await productsRes.json()) as Product[]) : []);
			setWarehouses(warehousesRes.ok ? ((await warehousesRes.json()) as Warehouse[]) : []);
			setVendors(vendorsRes.ok ? ((await vendorsRes.json()) as Vendor[]) : []);
			setPurchaseOrders(purchaseRes.ok ? ((await purchaseRes.json()) as PurchaseOrder[]) : []);
			setMovements(movementsRes.ok ? ((await movementsRes.json()) as Movement[]) : []);
			setReorderSuggestions(reorderRes.ok ? ((await reorderRes.json()) as ReorderSuggestion[]) : []);
			setAuditEntries(auditRes.ok ? ((await auditRes.json()) as InventoryAuditEntry[]) : []);
			setGatePasses(gatePassRes.ok ? ((await gatePassRes.json()) as GatePass[]) : []);
		} catch {
			setNotice("Unable to load inventory.");
		} finally {
			setLoading(false);
		}
	};

	const createGatePassRecord = async (event: FormEvent) => {
		event.preventDefault();
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");

		if (!gatePassForm.warehouseId) {
			setNotice("Select warehouse for gate pass.");
			return;
		}

		const items = gatePassItems
			.map((line) => ({ productId: line.productId, quantity: Number(line.quantity || 0) }))
			.filter((line) => line.productId && Number.isInteger(line.quantity) && line.quantity > 0);

		if (items.length === 0) {
			setNotice("Add at least one valid gate pass item.");
			return;
		}

		const response = await fetch("/api/inventory/gate-passes", {
			method: "POST",
			headers,
			body: JSON.stringify({
				type: gatePassForm.type,
				warehouseId: gatePassForm.warehouseId,
				vehicleNumber: gatePassForm.vehicleNumber.trim() || undefined,
				driverName: gatePassForm.driverName.trim() || undefined,
				referenceType: gatePassForm.referenceType.trim() || undefined,
				referenceId: gatePassForm.referenceId.trim() || undefined,
				notes: gatePassForm.notes.trim() || undefined,
				items,
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to create gate pass."));
			return;
		}

		setGatePassForm({
			type: "OUTWARD",
			warehouseId: "",
			vehicleNumber: "",
			driverName: "",
			referenceType: "",
			referenceId: "",
			notes: "",
		});
		setGatePassItems([{ productId: "", quantity: "" }]);
		await loadAll();
		setNotice("Gate pass created.");
	};

	const updateGatePassRecordStatus = async (
		gatePassId: string,
		status: "OPEN" | "CLOSED" | "CANCELLED",
	) => {
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");

		const response = await fetch(`/api/inventory/gate-passes/${gatePassId}/status`, {
			method: "PATCH",
			headers,
			body: JSON.stringify({ status }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to update gate pass status."));
			return;
		}

		await loadAll();
		setNotice(`Gate pass marked ${status}.`);
	};

	useEffect(() => {
		void loadAll();
	}, []);

	useEffect(() => {
		const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
		if (activeTab !== "warehouses") {
			return;
		}

		if (!apiKey) {
			setWarehouseMapError("Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map pin placement.");
			return;
		}

		if (!warehouseMapElementRef.current) {
			return;
		}

		void loadGoogleMapsScript(apiKey)
			.then(() => {
				if (!warehouseMapElementRef.current || !window.google?.maps) {
					return;
				}

				setWarehouseMapError(null);

				if (!warehouseGoogleMapRef.current) {
					const map = new window.google.maps.Map(warehouseMapElementRef.current, {
						center: { lat: 20.5937, lng: 78.9629 },
						zoom: 5,
						mapTypeControl: false,
						streetViewControl: false,
						fullscreenControl: false,
					});

					map.addListener("click", (event: any) => {
						const lat = event.latLng?.lat?.();
						const lng = event.latLng?.lng?.();
						if (typeof lat !== "number" || typeof lng !== "number") {
							return;
						}

						setWarehouseForm((prev) => ({
							...prev,
							latitude: lat.toFixed(6),
							longitude: lng.toFixed(6),
						}));
					});

					warehouseGoogleMapRef.current = map;
				}
			})
			.catch(() => {
				setWarehouseMapError("Unable to load Google Maps. Check API key and network access.");
			});
	}, [activeTab]);

	useEffect(() => {
		if (!warehouseGoogleMapRef.current || !window.google?.maps) {
			return;
		}

		const lat = Number(warehouseForm.latitude);
		const lng = Number(warehouseForm.longitude);
		const hasPin = Number.isFinite(lat) && Number.isFinite(lng);

		if (!hasPin) {
			if (warehouseGoogleMarkerRef.current) {
				warehouseGoogleMarkerRef.current.setMap(null);
				warehouseGoogleMarkerRef.current = null;
			}
			return;
		}

		const position = { lat, lng };
		if (!warehouseGoogleMarkerRef.current) {
			warehouseGoogleMarkerRef.current = new window.google.maps.Marker({
				position,
				map: warehouseGoogleMapRef.current,
				draggable: true,
			});

			warehouseGoogleMarkerRef.current.addListener("dragend", (event: any) => {
				const nextLat = event.latLng?.lat?.();
				const nextLng = event.latLng?.lng?.();
				if (typeof nextLat !== "number" || typeof nextLng !== "number") {
					return;
				}

				setWarehouseForm((prev) => ({
					...prev,
					latitude: nextLat.toFixed(6),
					longitude: nextLng.toFixed(6),
				}));
			});
		} else {
			warehouseGoogleMarkerRef.current.setDraggable(true);
			warehouseGoogleMarkerRef.current.setPosition(position);
		}

		warehouseGoogleMapRef.current.panTo(position);
	}, [warehouseForm.latitude, warehouseForm.longitude]);

	const submitCreateProduct = async (event: FormEvent) => {
		event.preventDefault();
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch("/api/inventory/products", {
			method: "POST",
			headers,
			body: JSON.stringify({
				name: productForm.name.trim(),
				sku: productForm.sku.trim(),
				unitPrice: Number(productForm.unitPrice || 0),
				costPrice: productForm.costPrice ? Number(productForm.costPrice) : undefined,
				taxRate: productForm.taxRate ? Number(productForm.taxRate) : undefined,
				description: productForm.description.trim() || undefined,
				category: productForm.category.trim() || undefined,
				unit: productForm.unit.trim() || undefined,
				reorderLevel: productForm.reorderLevel ? Number(productForm.reorderLevel) : undefined,
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to create product."));
			return;
		}

		setProductForm({
			name: "",
			sku: "",
			unitPrice: "",
			costPrice: "",
			taxRate: "",
			description: "",
			category: "",
			unit: "",
			reorderLevel: "",
		});
		await loadAll();
		setNotice("Product created.");
	};

	const submitCreateVendor = async (event: FormEvent) => {
		event.preventDefault();
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch("/api/inventory/vendors", {
			method: "POST",
			headers,
			body: JSON.stringify({
				companyName: vendorForm.companyName.trim() || undefined,
				firstName: vendorForm.firstName.trim() || undefined,
				lastName: vendorForm.lastName.trim() || undefined,
				email: vendorForm.email.trim() || undefined,
				phone: vendorForm.phone.trim() || undefined,
				gstNumber: vendorForm.gstNumber.trim() || undefined,
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to create vendor."));
			return;
		}

		setVendorForm({ companyName: "", firstName: "", lastName: "", email: "", phone: "", gstNumber: "" });
		await loadAll();
		setNotice("Vendor created.");
	};

	const editVendor = async (vendor: Vendor) => {
		const companyName = window.prompt("Vendor company", vendor.companyName || "");
		if (companyName === null) return;
		const firstName = window.prompt("First name", vendor.firstName || "");
		if (firstName === null) return;
		const lastName = window.prompt("Last name", vendor.lastName || "");
		if (lastName === null) return;
		const email = window.prompt("Email", vendor.email || "");
		if (email === null) return;
		const phone = window.prompt("Phone", vendor.phone || "");
		if (phone === null) return;
		const gstNumber = window.prompt("GST Number", vendor.gstNumber || "");
		if (gstNumber === null) return;

		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch(`/api/inventory/vendors/${vendor.id}`, {
			method: "PUT",
			headers,
			body: JSON.stringify({ companyName, firstName, lastName, email, phone, gstNumber }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to update vendor."));
			return;
		}

		await loadAll();
		setNotice("Vendor updated.");
	};

	const deactivateVendor = async (vendorId: string) => {
		const headers = getAuthHeaders();
		const response = await fetch(`/api/inventory/vendors/${vendorId}`, {
			method: "DELETE",
			headers,
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to deactivate vendor."));
			return;
		}

		await loadAll();
		setNotice("Vendor deactivated.");
	};

	const submitCreateWarehouse = async (event: FormEvent) => {
		event.preventDefault();
		const latitudeRaw = warehouseForm.latitude.trim();
		const longitudeRaw = warehouseForm.longitude.trim();

		if ((latitudeRaw && !longitudeRaw) || (!latitudeRaw && longitudeRaw)) {
			setNotice("Provide both latitude and longitude for a map pin.");
			return;
		}

		const latitude = latitudeRaw ? Number(latitudeRaw) : undefined;
		const longitude = longitudeRaw ? Number(longitudeRaw) : undefined;

		if (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
			setNotice("Latitude must be between -90 and 90.");
			return;
		}

		if (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
			setNotice("Longitude must be between -180 and 180.");
			return;
		}

		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch("/api/inventory/warehouses", {
			method: "POST",
			headers,
			body: JSON.stringify({
				name: warehouseForm.name.trim(),
				location: warehouseForm.location.trim() || undefined,
				latitude,
				longitude,
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to create warehouse."));
			return;
		}

		setWarehouseForm({ name: "", location: "", latitude: "", longitude: "" });
		await loadAll();
		setNotice("Warehouse created.");
	};

	const editProductSettings = async (product: Product) => {
		const category = window.prompt("Category", product.category || "");
		if (category === null) return;
		const unit = window.prompt("Unit (e.g. pcs, kg)", product.unit || "");
		if (unit === null) return;
		const reorderLevelRaw = window.prompt("Reorder level", String(product.reorderLevel ?? 10));
		if (reorderLevelRaw === null) return;

		const reorderLevel = Number(reorderLevelRaw);
		if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
			setNotice("Reorder level must be a non-negative integer.");
			return;
		}

		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch(`/api/inventory/products/${product.id}/settings`, {
			method: "PUT",
			headers,
			body: JSON.stringify({ category, unit, reorderLevel }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to update product settings."));
			return;
		}

		await loadAll();
		setNotice("Product settings updated.");
	};

	const runStockAction = async (endpoint: string, payload: Record<string, unknown>, success: string) => {
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch(endpoint, {
			method: "POST",
			headers,
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Stock operation failed."));
			return;
		}

		await loadAll();
		setNotice(success);
	};

	const createPurchase = async (event: FormEvent) => {
		event.preventDefault();
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");

		const vendorName = purchaseForm.vendorName.trim();
		if (!vendorName) {
			setNotice("Vendor name is required.");
			return;
		}

		const normalizedVendorName = vendorName.toLowerCase();
		const matchedVendor = vendors.find((vendor) => {
			const displayName = (vendor.companyName || `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim() || "").toLowerCase();
			return displayName === normalizedVendorName;
		});

		let vendorId = matchedVendor?.id;
		if (!vendorId) {
			const vendorCreateResponse = await fetch("/api/inventory/vendors", {
				method: "POST",
				headers,
				body: JSON.stringify({
					companyName: vendorName,
					email: purchaseForm.vendorEmail.trim() || undefined,
					phone: purchaseForm.vendorPhone.trim() || undefined,
				}),
			});

			if (!vendorCreateResponse.ok) {
				setNotice(await getApiErrorMessage(vendorCreateResponse, "Unable to create vendor for purchase order."));
				return;
			}

			const createdVendor = (await vendorCreateResponse.json()) as Vendor;
			vendorId = createdVendor.id;
		}

		const rawItems = purchaseCreateItems
			.map((row) => ({
				productId: row.productId,
				quantity: Number(row.quantity || 0),
				unitPrice: Number(row.unitPrice || 0),
			}))
			.filter((row) => row.productId && Number.isInteger(row.quantity) && row.quantity > 0 && Number.isFinite(row.unitPrice) && row.unitPrice >= 0);

		const itemsByProduct = new Map<string, { productId: string; quantity: number; unitPrice: number }>();
		for (const row of rawItems) {
			const existing = itemsByProduct.get(row.productId);
			if (!existing) {
				itemsByProduct.set(row.productId, row);
				continue;
			}

			const mergedQty = existing.quantity + row.quantity;
			const mergedUnitPrice = Number(
				((existing.unitPrice * existing.quantity + row.unitPrice * row.quantity) / mergedQty).toFixed(2),
			);

			itemsByProduct.set(row.productId, {
				productId: row.productId,
				quantity: mergedQty,
				unitPrice: mergedUnitPrice,
			});
		}

		const items = Array.from(itemsByProduct.values());
		const mergedDuplicates = rawItems.length - items.length;

		if (items.length === 0) {
			setNotice("Add at least one valid PO item line.");
			return;
		}

		const response = await fetch("/api/inventory/purchase", {
			method: "POST",
			headers,
			body: JSON.stringify({
				vendorId,
				items,
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to create purchase order."));
			return;
		}

		setPurchaseForm({ vendorName: "", vendorEmail: "", vendorPhone: "", productId: "", quantity: "", unitPrice: "" });
		setPurchaseCreateItems([{ productId: "", quantity: "", unitPrice: "" }]);
		await loadAll();
		setNotice(mergedDuplicates > 0 ? `Purchase order created. Merged ${mergedDuplicates} duplicate product line(s).` : "Purchase order created.");
	};

	const startDraftEdit = (purchase: PurchaseOrder) => {
		setEditingDraftPurchaseId(purchase.id);
		setPurchaseEditItems(
			purchase.items.map((item) => ({
				productId: item.productId,
				quantity: String(item.quantity),
				unitPrice: String(item.unitPrice),
			})),
		);
	};

	const saveDraftItems = async (purchaseId: string) => {
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");

		const rawItems = purchaseEditItems
			.map((row) => ({
				productId: row.productId,
				quantity: Number(row.quantity || 0),
				unitPrice: Number(row.unitPrice || 0),
			}))
			.filter((row) => row.productId && Number.isInteger(row.quantity) && row.quantity > 0 && Number.isFinite(row.unitPrice) && row.unitPrice >= 0);

		const itemsByProduct = new Map<string, { productId: string; quantity: number; unitPrice: number }>();
		for (const row of rawItems) {
			const existing = itemsByProduct.get(row.productId);
			if (!existing) {
				itemsByProduct.set(row.productId, row);
				continue;
			}

			const mergedQty = existing.quantity + row.quantity;
			const mergedUnitPrice = Number(
				((existing.unitPrice * existing.quantity + row.unitPrice * row.quantity) / mergedQty).toFixed(2),
			);

			itemsByProduct.set(row.productId, {
				productId: row.productId,
				quantity: mergedQty,
				unitPrice: mergedUnitPrice,
			});
		}

		const items = Array.from(itemsByProduct.values());
		const mergedDuplicates = rawItems.length - items.length;

		if (items.length === 0) {
			setNotice("Add at least one valid draft PO line before saving.");
			return;
		}

		const response = await fetch(`/api/inventory/purchase/${purchaseId}/items`, {
			method: "PUT",
			headers,
			body: JSON.stringify({ items }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to update draft purchase items."));
			return;
		}

		setEditingDraftPurchaseId(null);
		setPurchaseEditItems([]);
		await loadAll();
		setNotice(mergedDuplicates > 0 ? `Draft purchase items updated. Merged ${mergedDuplicates} duplicate product line(s).` : "Draft purchase items updated.");
	};

	const approvePurchase = async (purchaseId: string) => {
		const headers = getAuthHeaders();
		const response = await fetch(`/api/inventory/purchase/${purchaseId}/approve`, {
			method: "POST",
			headers,
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to approve purchase order."));
			return;
		}

		await loadAll();
		setNotice("Purchase order approved.");
	};

	const receivePurchase = async (purchase: PurchaseOrder, mode: "selected" | "all") => {
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");

		const qtyDraft = purchaseReceiveQtyById[purchase.id] || {};
		const items = purchase.items
			.map((item) => {
				const raw = (qtyDraft[item.id] || "").trim();
				if (!raw) {
					return null;
				}

				const quantity = Number(raw);
				if (!Number.isInteger(quantity) || quantity <= 0) {
					setNotice(`Invalid receive quantity for ${item.product?.name || item.productId}. Use positive whole numbers.`);
					return null;
				}

				const pending = item.pendingQuantity ?? item.quantity;
				if (quantity > pending) {
					setNotice(`Receive quantity exceeds pending quantity for ${item.product?.name || item.productId}.`);
					return null;
				}

				return {
					productId: item.productId,
					quantity,
				};
			})
			.filter((item): item is { productId: string; quantity: number } => Boolean(item));

		if (mode === "selected" && items.length === 0) {
			setNotice("Enter receive quantity for at least one line, or use Receive All.");
			return;
		}

		if (mode === "all" && (purchase.totalPendingQuantity ?? 0) <= 0) {
			setNotice("No receivable quantity left for this purchase order.");
			return;
		}

		const warehouseId = purchaseReceiveWarehouseById[purchase.id] || undefined;

		const response = await fetch(`/api/inventory/purchase/${purchase.id}/receive`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				warehouseId,
				items: mode === "all" ? undefined : items,
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to receive purchase order."));
			return;
		}

		setPurchaseReceiveQtyById((prev) => {
			const next = { ...prev };
			delete next[purchase.id];
			return next;
		});
		setPurchaseReceiveWarehouseById((prev) => {
			const next = { ...prev };
			delete next[purchase.id];
			return next;
		});

		await loadAll();
		setNotice(mode === "all" ? "Full purchase receipt posted." : "Partial purchase receipt posted.");
	};

	const returnPurchase = async (purchase: PurchaseOrder, mode: "selected" | "all") => {
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");

		const qtyDraft = purchaseReturnQtyById[purchase.id] || {};
		const items = purchase.items
			.map((item) => {
				const raw = (qtyDraft[item.id] || "").trim();
				if (!raw) {
					return null;
				}

				const quantity = Number(raw);
				if (!Number.isInteger(quantity) || quantity <= 0) {
					setNotice(`Invalid return quantity for ${item.product?.name || item.productId}. Use positive whole numbers.`);
					return null;
				}

				const returnable = item.returnableQuantity ?? 0;
				if (quantity > returnable) {
					setNotice(`Return quantity exceeds returnable quantity for ${item.product?.name || item.productId}.`);
					return null;
				}

				return {
					productId: item.productId,
					quantity,
				};
			})
			.filter((item): item is { productId: string; quantity: number } => Boolean(item));

		if (mode === "selected" && items.length === 0) {
			setNotice("Enter return quantity for at least one line, or use Return All.");
			return;
		}

		if (mode === "all" && (purchase.totalReturnableQuantity ?? 0) <= 0) {
			setNotice("No returnable quantity left for this purchase order.");
			return;
		}

		const warehouseId = purchaseReceiveWarehouseById[purchase.id] || undefined;

		const response = await fetch(`/api/inventory/purchase/${purchase.id}/return`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				warehouseId,
				items: mode === "all" ? undefined : items,
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to return purchase order items."));
			return;
		}

		setPurchaseReturnQtyById((prev) => {
			const next = { ...prev };
			delete next[purchase.id];
			return next;
		});

		await loadAll();
		setNotice(mode === "all" ? "Full purchase return posted." : "Partial purchase return posted.");
	};

	const exportStockLedger = async () => {
		const headers = getAuthHeaders();
		const params = new URLSearchParams();
		if (movementFilters.productId) params.set("productId", movementFilters.productId);
		if (movementFilters.warehouseId) params.set("warehouseId", movementFilters.warehouseId);
		if (movementFilters.type) params.set("type", movementFilters.type);
		if (movementFilters.fromDate) params.set("fromDate", `${movementFilters.fromDate}T00:00:00.000Z`);
		if (movementFilters.toDate) params.set("toDate", `${movementFilters.toDate}T23:59:59.999Z`);

		const response = await fetch(`/api/inventory/stock/ledger/export?${params.toString()}`, { headers });
		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to export stock ledger."));
			return;
		}

		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `inventory-stock-ledger-${Date.now()}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const lowStockCount = useMemo(() => summary?.lowStockProducts.length ?? 0, [summary]);

	const tabClass = (tab: InventoryTab) =>
		`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${activeTab === tab ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"}`;

	const applyMovementFilters = async () => {
		if (movementFilters.fromDate && movementFilters.toDate && movementFilters.fromDate > movementFilters.toDate) {
			setNotice("From date must be before or equal to To date.");
			return;
		}

		await loadAll(movementFilters);
	};

	const resetMovementFilters = async () => {
		const cleared: MovementFiltersState = { productId: "", warehouseId: "", type: "", fromDate: "", toDate: "" };
		setMovementFilters(cleared);
		await loadAll(cleared);
	};

	const getWarehouseMapsUrl = (warehouse: Warehouse): string | null => {
		if (warehouse.latitude !== undefined && warehouse.latitude !== null && warehouse.longitude !== undefined && warehouse.longitude !== null) {
			return `https://www.google.com/maps?q=${warehouse.latitude},${warehouse.longitude}`;
		}

		const query = warehouse.location?.trim();
		if (query) {
			return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
		}

		return null;
	};

	return (
		<WorkspaceShell>
			<div className="mt-5 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)]">
				<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Inventory Control Center</h1>
				<p className="mt-1 text-sm text-zinc-600">Products, warehouses, stock movement and purchase receipts.</p>
				{notice && <p className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">{notice}</p>}

				<div className="mt-4 flex flex-wrap gap-2">
					{(Object.keys(tabLabel) as InventoryTab[]).map((tab) => (
						<button key={tab} type="button" onClick={() => setActiveTab(tab)} className={tabClass(tab)}>
							{tabLabel[tab]}
						</button>
					))}
				</div>

				{loading ? (
					<p className="mt-4 text-sm text-zinc-500">Loading inventory...</p>
				) : activeTab === "overview" ? (
					<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
						{[
							["Products", summary?.totalProducts ?? 0],
							["Warehouses", summary?.totalWarehouses ?? 0],
							["Stock Value", summary?.totalStockValue ?? 0],
							["Low Stock Alerts", lowStockCount],
						].map(([label, value]) => (
							<div key={String(label)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
								<p className="text-xs text-zinc-500">{label}</p>
								<p className="mt-1 text-lg font-semibold text-zinc-900">{String(value)}</p>
							</div>
						))}
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:col-span-2 xl:col-span-4">
							<p className="text-sm font-semibold text-zinc-900">Low Stock Products</p>
							<div className="mt-2 max-h-[260px] overflow-y-auto space-y-2">
								{summary?.lowStockProducts?.map((item) => (
									<div key={`${item.productId}-${item.warehouseName}`} className="rounded-md border border-zinc-200 p-2 text-xs text-zinc-700">
										{item.name} ({item.sku}) - {item.warehouseName}: {item.quantity} / reorder {item.reorderLevel ?? 10}
									</div>
								))}
								{summary?.lowStockProducts?.length === 0 && <p className="text-xs text-zinc-500">No low stock products.</p>}
							</div>
						</div>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:col-span-2 xl:col-span-4">
							<p className="text-sm font-semibold text-zinc-900">Reorder Suggestions</p>
							<div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200">
								<table className="min-w-full divide-y divide-zinc-200 text-xs">
									<thead className="bg-zinc-50">
										<tr>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Product</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Warehouse</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Current</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Reorder</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Suggested Qty</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Estimated Cost</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-100 bg-white">
										{reorderSuggestions.map((item) => (
											<tr key={`${item.productId}-${item.warehouseId}`}>
												<td className="px-3 py-2 text-zinc-700">{item.productName} ({item.sku})</td>
												<td className="px-3 py-2 text-zinc-700">{item.warehouseName}</td>
												<td className="px-3 py-2 text-zinc-700">{item.currentQuantity}</td>
												<td className="px-3 py-2 text-zinc-700">{item.reorderLevel}</td>
												<td className="px-3 py-2 text-zinc-700">{item.suggestedOrderQty}</td>
												<td className="px-3 py-2 text-zinc-700">{item.estimatedCost}</td>
											</tr>
										))}
										{reorderSuggestions.length === 0 && (
											<tr>
												<td colSpan={6} className="px-3 py-4 text-center text-zinc-500">No reorder suggestions.</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				) : activeTab === "products" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
						<form onSubmit={(event) => void submitCreateProduct(event)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2">
							<p className="text-sm font-semibold text-zinc-900">Create Product</p>
							<input value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
							<input value={productForm.sku} onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))} placeholder="SKU" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
							<input value={productForm.category} onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))} placeholder="Category (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={productForm.unit} onChange={(event) => setProductForm((prev) => ({ ...prev, unit: event.target.value }))} placeholder="Unit (optional, e.g. pcs, kg)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={productForm.reorderLevel} onChange={(event) => setProductForm((prev) => ({ ...prev, reorderLevel: event.target.value }))} placeholder="Reorder level (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={productForm.unitPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, unitPrice: event.target.value }))} placeholder="Unit price" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
							<input value={productForm.costPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, costPrice: event.target.value }))} placeholder="Cost price (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={productForm.taxRate} onChange={(event) => setProductForm((prev) => ({ ...prev, taxRate: event.target.value }))} placeholder="Tax rate (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<textarea value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Description" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" rows={3} />
							<button type="submit" className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">Create Product</button>
						</form>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Products</p>
							<div className="mt-2 max-h-[520px] overflow-y-auto space-y-2">
								{products.map((item) => (
									<div key={item.id} className="rounded-md border border-zinc-200 p-2 text-xs">
										<p className="font-semibold text-zinc-800">{item.name} ({item.sku})</p>
										<p className="text-zinc-500">Category: {item.category || "-"} | UOM: {item.unit || "-"} | Reorder: {item.reorderLevel ?? 10}</p>
										<p className="text-zinc-500">Unit Price: {item.unitPrice} | Cost: {item.costPrice ?? "-"} | Tax: {item.taxRate ?? "-"}</p>
										<button type="button" onClick={() => void editProductSettings(item)} className="mt-1 rounded border border-zinc-300 px-2 py-1 text-[11px]">Edit Settings</button>
									</div>
								))}
								{products.length === 0 && <p className="text-xs text-zinc-500">No products found.</p>}
							</div>
						</div>
					</div>
				) : activeTab === "warehouses" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
						<form onSubmit={(event) => void submitCreateWarehouse(event)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2">
							<p className="text-sm font-semibold text-zinc-900">Create Warehouse</p>
							<input value={warehouseForm.name} onChange={(event) => setWarehouseForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
							<input value={warehouseForm.location} onChange={(event) => setWarehouseForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="Location" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
								<p className="text-xs font-semibold text-zinc-700">Warehouse Map Pin</p>
								{warehouseMapError ? (
									<p className="mt-1 text-[11px] text-rose-600">{warehouseMapError}</p>
								) : (
									<div ref={warehouseMapElementRef} className="mt-1 h-56 w-full rounded-md border border-zinc-200 bg-zinc-100" />
								)}
								<div className="mt-2 flex items-center justify-between gap-2">
									<p className="text-[11px] text-zinc-600">
										{warehouseForm.latitude && warehouseForm.longitude
											? `Selected pin: ${warehouseForm.latitude}, ${warehouseForm.longitude}`
											: "Click map to drop a pin."}
									</p>
									<button
										type="button"
										onClick={() => setWarehouseForm((prev) => ({ ...prev, latitude: "", longitude: "" }))}
										className="rounded border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700"
									>
										Clear Pin
									</button>
								</div>
							</div>
							<button type="submit" className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">Create Warehouse</button>
						</form>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Warehouses</p>
							<div className="mt-2 max-h-[520px] overflow-y-auto space-y-2">
								{warehouses.map((item) => (
									<div key={item.id} className="rounded-md border border-zinc-200 p-2 text-xs">
										<p className="font-semibold text-zinc-800">{item.name}</p>
										<p className="text-zinc-500">{item.location || "No location"}</p>
										{item.latitude !== undefined && item.latitude !== null && item.longitude !== undefined && item.longitude !== null && (
											<p className="text-zinc-500">Pin: {item.latitude}, {item.longitude}</p>
										)}
										{getWarehouseMapsUrl(item) && (
											<a href={getWarehouseMapsUrl(item) || "#"} target="_blank" rel="noreferrer" className="mt-1 inline-block rounded border border-sky-300 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">
												Open Google Maps Pin
											</a>
										)}
									</div>
								))}
								{warehouses.length === 0 && <p className="text-xs text-zinc-500">No warehouses found.</p>}
							</div>
						</div>
					</div>
				) : activeTab === "stock" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2">
							<p className="text-sm font-semibold text-zinc-900">Stock Operations</p>
							<select value={stockForm.productId} onChange={(event) => setStockForm((prev) => ({ ...prev, productId: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="">Product</option>
								{products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
							</select>
							<select value={stockForm.warehouseId} onChange={(event) => setStockForm((prev) => ({ ...prev, warehouseId: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="">Warehouse</option>
								{warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
							</select>
							<input value={stockForm.quantity} onChange={(event) => setStockForm((prev) => ({ ...prev, quantity: event.target.value }))} placeholder="Quantity" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={stockForm.notes} onChange={(event) => setStockForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Notes" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<div className="flex flex-wrap gap-2">
								<button type="button" onClick={() => void runStockAction("/api/inventory/stock/add", { productId: stockForm.productId, warehouseId: stockForm.warehouseId, quantity: Number(stockForm.quantity || 0), notes: stockForm.notes || undefined }, "Stock added.")} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">Add</button>
								<button type="button" onClick={() => void runStockAction("/api/inventory/stock/reduce", { productId: stockForm.productId, warehouseId: stockForm.warehouseId, quantity: Number(stockForm.quantity || 0), notes: stockForm.notes || undefined }, "Stock reduced.")} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">Reduce</button>
							</div>
						</div>

						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2">
							<p className="text-sm font-semibold text-zinc-900">Transfer / Adjust</p>
							<select value={stockForm.toWarehouseId} onChange={(event) => setStockForm((prev) => ({ ...prev, toWarehouseId: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="">To warehouse (for transfer)</option>
								{warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
							</select>
							<input value={stockForm.newQuantity} onChange={(event) => setStockForm((prev) => ({ ...prev, newQuantity: event.target.value }))} placeholder="New quantity (for adjust)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<div className="flex flex-wrap gap-2">
								<button type="button" onClick={() => void runStockAction("/api/inventory/stock/transfer", { productId: stockForm.productId, fromWarehouseId: stockForm.warehouseId, toWarehouseId: stockForm.toWarehouseId, quantity: Number(stockForm.quantity || 0), notes: stockForm.notes || undefined }, "Stock transferred.")} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">Transfer</button>
								<button type="button" onClick={() => void runStockAction("/api/inventory/stock/adjust", { productId: stockForm.productId, warehouseId: stockForm.warehouseId, newQuantity: Number(stockForm.newQuantity || 0), reason: stockForm.notes || "Manual adjustment" }, "Stock adjusted.")} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">Adjust</button>
							</div>
						</div>
					</div>
				) : activeTab === "purchase" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
						<form onSubmit={(event) => void createPurchase(event)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2">
							<p className="text-sm font-semibold text-zinc-900">Create Purchase Order</p>
							<input value={purchaseForm.vendorName} onChange={(event) => setPurchaseForm((prev) => ({ ...prev, vendorName: event.target.value }))} placeholder="Vendor name" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
							<input value={purchaseForm.vendorEmail} onChange={(event) => setPurchaseForm((prev) => ({ ...prev, vendorEmail: event.target.value }))} placeholder="Vendor email (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={purchaseForm.vendorPhone} onChange={(event) => setPurchaseForm((prev) => ({ ...prev, vendorPhone: event.target.value }))} placeholder="Vendor phone (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<div className="space-y-2 rounded-lg border border-zinc-200 p-2">
								<p className="text-xs font-semibold text-zinc-700">PO Item Lines</p>
								{purchaseCreateItems.map((row, index) => (
									<div key={`create-line-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-12">
										<select value={row.productId} onChange={(event) => setPurchaseCreateItems((prev) => prev.map((line, lineIndex) => lineIndex === index ? { ...line, productId: event.target.value } : line))} className="md:col-span-6 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
											<option value="">Product</option>
											{products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
										</select>
										<input value={row.quantity} onChange={(event) => setPurchaseCreateItems((prev) => prev.map((line, lineIndex) => lineIndex === index ? { ...line, quantity: event.target.value } : line))} placeholder="Qty" className="md:col-span-2 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
										<input value={row.unitPrice} onChange={(event) => setPurchaseCreateItems((prev) => prev.map((line, lineIndex) => lineIndex === index ? { ...line, unitPrice: event.target.value } : line))} placeholder="Unit price" className="md:col-span-3 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
										<button type="button" onClick={() => setPurchaseCreateItems((prev) => prev.length > 1 ? prev.filter((_, lineIndex) => lineIndex !== index) : prev)} className="md:col-span-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs font-semibold text-zinc-700">Remove</button>
									</div>
								))}
								<button type="button" onClick={() => setPurchaseCreateItems((prev) => [...prev, { productId: "", quantity: "", unitPrice: "" }])} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs font-semibold text-zinc-700">Add Line</button>
							</div>
							<button type="submit" className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">Create Purchase Order</button>
						</form>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Purchase Orders</p>
							<div className="mt-2 max-h-[520px] overflow-y-auto space-y-2">
								{purchaseOrders.map((po) => (
									<div key={po.id} className="rounded-md border border-zinc-200 p-2">
										<p className="text-xs font-semibold text-zinc-800">PO {po.id.slice(0, 10)} | {po.status}</p>
										<p className="text-[11px] text-zinc-500">Amount: {po.totalAmount} | {new Date(po.createdAt).toLocaleString()}</p>
										<p className="text-[11px] text-zinc-500">Ordered: {po.totalOrderedQuantity ?? "-"} | Received: {po.totalReceivedQuantity ?? "-"} | Returned: {po.totalReturnedQuantity ?? "-"} | Returnable: {po.totalReturnableQuantity ?? "-"} | Pending: {po.totalPendingQuantity ?? "-"}</p>
										<div className="mt-1 space-y-1">
											{po.items.map((item) => (
												<div key={item.id} className="flex items-center gap-2 text-[11px] text-zinc-600">
													<span className="w-[170px] truncate">{item.product?.name || item.productId}</span>
													<span>Ord: {item.quantity}</span>
													<span>Rec: {item.receivedQuantity ?? 0}</span>
													<span>Ret: {item.returnedQuantity ?? 0}</span>
													<span>CanReturn: {item.returnableQuantity ?? 0}</span>
													<span>Pend: {item.pendingQuantity ?? item.quantity}</span>
													{["APPROVED", "PARTIAL_RECEIVED"].includes(po.status) && (
														<input
															value={purchaseReceiveQtyById[po.id]?.[item.id] || ""}
															onChange={(event) =>
																setPurchaseReceiveQtyById((prev) => ({
																	...prev,
																	[po.id]: {
																		...(prev[po.id] || {}),
																		[item.id]: event.target.value,
																	},
																}))
															}
															placeholder="recv"
															className="w-16 rounded border border-zinc-300 px-1 py-0.5"
														/>
													)}
													{["RECEIVED", "PARTIAL_RECEIVED"].includes(po.status) && (
														<input
															value={purchaseReturnQtyById[po.id]?.[item.id] || ""}
															onChange={(event) =>
																setPurchaseReturnQtyById((prev) => ({
																	...prev,
																	[po.id]: {
																		...(prev[po.id] || {}),
																		[item.id]: event.target.value,
																	},
																}))
															}
															placeholder="ret"
															className="w-16 rounded border border-zinc-300 px-1 py-0.5"
														/>
													)}
												</div>
											))}
										</div>
										{po.status === "DRAFT" && (
											<div className="mt-1 flex flex-wrap items-center gap-2">
												<button type="button" onClick={() => startDraftEdit(po)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700">Edit Items</button>
												<button type="button" onClick={() => void approvePurchase(po.id)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700">Approve</button>
											</div>
										)}
										{po.status === "DRAFT" && editingDraftPurchaseId === po.id && (
											<div className="mt-2 space-y-2 rounded-md border border-zinc-200 p-2">
												<p className="text-[11px] font-semibold text-zinc-700">Edit Draft Items</p>
												{purchaseEditItems.map((row, index) => (
													<div key={`edit-line-${po.id}-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-12">
														<select value={row.productId} onChange={(event) => setPurchaseEditItems((prev) => prev.map((line, lineIndex) => lineIndex === index ? { ...line, productId: event.target.value } : line))} className="md:col-span-6 rounded border border-zinc-300 px-1 py-1 text-[11px]">
															<option value="">Product</option>
															{products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
														</select>
														<input value={row.quantity} onChange={(event) => setPurchaseEditItems((prev) => prev.map((line, lineIndex) => lineIndex === index ? { ...line, quantity: event.target.value } : line))} placeholder="Qty" className="md:col-span-2 rounded border border-zinc-300 px-1 py-1 text-[11px]" />
														<input value={row.unitPrice} onChange={(event) => setPurchaseEditItems((prev) => prev.map((line, lineIndex) => lineIndex === index ? { ...line, unitPrice: event.target.value } : line))} placeholder="Unit price" className="md:col-span-3 rounded border border-zinc-300 px-1 py-1 text-[11px]" />
														<button type="button" onClick={() => setPurchaseEditItems((prev) => prev.length > 1 ? prev.filter((_, lineIndex) => lineIndex !== index) : prev)} className="md:col-span-1 rounded border border-zinc-300 px-1 py-1 text-[11px]">X</button>
													</div>
												))}
												<div className="flex flex-wrap gap-2">
													<button type="button" onClick={() => setPurchaseEditItems((prev) => [...prev, { productId: "", quantity: "", unitPrice: "" }])} className="rounded border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700">Add Line</button>
													<button type="button" onClick={() => void saveDraftItems(po.id)} className="rounded border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700">Save Draft Items</button>
													<button type="button" onClick={() => { setEditingDraftPurchaseId(null); setPurchaseEditItems([]); }} className="rounded border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700">Cancel</button>
												</div>
											</div>
										)}
										{["APPROVED", "PARTIAL_RECEIVED"].includes(po.status) && (
											<div className="mt-1 flex flex-wrap items-center gap-2">
												<select
													value={purchaseReceiveWarehouseById[po.id] || ""}
													onChange={(event) =>
														setPurchaseReceiveWarehouseById((prev) => ({
															...prev,
															[po.id]: event.target.value,
														}))
													}
													className="rounded-md border border-zinc-300 px-2 py-1 text-[11px]"
												>
													<option value="">Default warehouse</option>
													{warehouses.map((warehouse) => (
														<option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
													))}
												</select>
												<button type="button" onClick={() => void receivePurchase(po, "selected")} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700">Receive Selected</button>
												<button type="button" onClick={() => void receivePurchase(po, "all")} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700">Receive All</button>
											</div>
										)}
										{["RECEIVED", "PARTIAL_RECEIVED"].includes(po.status) && (
											<div className="mt-1 flex flex-wrap items-center gap-2">
												<button type="button" onClick={() => void returnPurchase(po, "selected")} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700">Return Selected</button>
												<button type="button" onClick={() => void returnPurchase(po, "all")} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700">Return All</button>
											</div>
										)}
									</div>
								))}
								{purchaseOrders.length === 0 && <p className="text-xs text-zinc-500">No purchase orders.</p>}
							</div>
						</div>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Vendor Master</p>
							<form onSubmit={(event) => void submitCreateVendor(event)} className="mt-2 space-y-2">
								<input value={vendorForm.companyName} onChange={(event) => setVendorForm((prev) => ({ ...prev, companyName: event.target.value }))} placeholder="Company name" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs" />
								<input value={vendorForm.firstName} onChange={(event) => setVendorForm((prev) => ({ ...prev, firstName: event.target.value }))} placeholder="First name" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs" />
								<input value={vendorForm.lastName} onChange={(event) => setVendorForm((prev) => ({ ...prev, lastName: event.target.value }))} placeholder="Last name" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs" />
								<input value={vendorForm.email} onChange={(event) => setVendorForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs" />
								<input value={vendorForm.phone} onChange={(event) => setVendorForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs" />
								<input value={vendorForm.gstNumber} onChange={(event) => setVendorForm((prev) => ({ ...prev, gstNumber: event.target.value }))} placeholder="GST Number" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs" />
								<button type="submit" className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">Create Vendor</button>
							</form>
							<div className="mt-3 max-h-[300px] overflow-y-auto space-y-2">
								{vendors.map((vendor) => {
									const name = vendor.companyName || `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim() || "Unnamed";
									return (
										<div key={vendor.id} className="rounded-md border border-zinc-200 p-2 text-xs">
											<p className="font-semibold text-zinc-800">{name}</p>
											<p className="text-zinc-500">{vendor.email || "No email"} | {vendor.phone || "No phone"}</p>
											<div className="mt-1 flex gap-1">
												<button type="button" onClick={() => void editVendor(vendor)} className="rounded border border-zinc-300 px-2 py-1 text-[11px]">Edit</button>
												<button type="button" onClick={() => void deactivateVendor(vendor.id)} className="rounded border border-rose-300 px-2 py-1 text-[11px] text-rose-700">Deactivate</button>
											</div>
										</div>
									);
								})}
								{vendors.length === 0 && <p className="text-xs text-zinc-500">No active vendors.</p>}
							</div>
						</div>
					</div>
				) : activeTab === "gatePass" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
						<form onSubmit={(event) => void createGatePassRecord(event)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2">
							<p className="text-sm font-semibold text-zinc-900">Create Gate Pass</p>
							<select value={gatePassForm.type} onChange={(event) => setGatePassForm((prev) => ({ ...prev, type: event.target.value as "INWARD" | "OUTWARD" }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="OUTWARD">OUTWARD</option>
								<option value="INWARD">INWARD</option>
							</select>
							<select value={gatePassForm.warehouseId} onChange={(event) => setGatePassForm((prev) => ({ ...prev, warehouseId: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required>
								<option value="">Warehouse</option>
								{warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
							</select>
							<input value={gatePassForm.vehicleNumber} onChange={(event) => setGatePassForm((prev) => ({ ...prev, vehicleNumber: event.target.value }))} placeholder="Vehicle number (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={gatePassForm.driverName} onChange={(event) => setGatePassForm((prev) => ({ ...prev, driverName: event.target.value }))} placeholder="Driver name (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
								<input value={gatePassForm.referenceType} onChange={(event) => setGatePassForm((prev) => ({ ...prev, referenceType: event.target.value }))} placeholder="Reference type (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
								<input value={gatePassForm.referenceId} onChange={(event) => setGatePassForm((prev) => ({ ...prev, referenceId: event.target.value }))} placeholder="Reference id (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							</div>
							<textarea value={gatePassForm.notes} onChange={(event) => setGatePassForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Notes (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" rows={3} />
							<div className="space-y-2 rounded-lg border border-zinc-200 p-2">
								<p className="text-xs font-semibold text-zinc-700">Gate Pass Item Lines</p>
								{gatePassItems.map((line, index) => (
									<div key={`gate-pass-line-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-12">
										<select value={line.productId} onChange={(event) => setGatePassItems((prev) => prev.map((row, rowIndex) => rowIndex === index ? { ...row, productId: event.target.value } : row))} className="md:col-span-8 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
											<option value="">Product</option>
											{products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
										</select>
										<input value={line.quantity} onChange={(event) => setGatePassItems((prev) => prev.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: event.target.value } : row))} placeholder="Qty" className="md:col-span-3 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
										<button type="button" onClick={() => setGatePassItems((prev) => prev.length > 1 ? prev.filter((_, rowIndex) => rowIndex !== index) : prev)} className="md:col-span-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs font-semibold text-zinc-700">X</button>
									</div>
								))}
								<button type="button" onClick={() => setGatePassItems((prev) => [...prev, { productId: "", quantity: "" }])} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs font-semibold text-zinc-700">Add Line</button>
							</div>
							<button type="submit" className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">Create Gate Pass</button>
						</form>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm xl:col-span-2">
							<p className="text-sm font-semibold text-zinc-900">Gate Pass Register</p>
							<div className="mt-2 max-h-[560px] overflow-y-auto space-y-2">
								{gatePasses.map((gatePass) => (
									<div key={gatePass.id} className="rounded-md border border-zinc-200 p-2">
										<p className="text-xs font-semibold text-zinc-800">{gatePass.passNumber} | {gatePass.type} | {gatePass.status}</p>
										<p className="text-[11px] text-zinc-500">Warehouse: {gatePass.warehouse?.name || "-"} | {new Date(gatePass.createdAt).toLocaleString()}</p>
										<p className="text-[11px] text-zinc-500">Vehicle: {gatePass.vehicleNumber || "-"} | Driver: {gatePass.driverName || "-"}</p>
										{gatePass.referenceType || gatePass.referenceId ? (
											<p className="text-[11px] text-zinc-500">Ref: {gatePass.referenceType || "-"} / {gatePass.referenceId || "-"}</p>
										) : null}
										{gatePass.notes ? <p className="text-[11px] text-zinc-500">{gatePass.notes}</p> : null}
										<div className="mt-1 space-y-1">
											{gatePass.items.map((item) => (
												<p key={item.id} className="text-[11px] text-zinc-600">{item.product?.name || item.productId} ({item.product?.sku || "-"}) - Qty {item.quantity}</p>
											))}
										</div>
										{gatePass.status === "OPEN" ? (
											<div className="mt-2 flex flex-wrap gap-2">
												<button type="button" onClick={() => void updateGatePassRecordStatus(gatePass.id, "CLOSED")} className="rounded border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700">Close</button>
												<button type="button" onClick={() => void updateGatePassRecordStatus(gatePass.id, "CANCELLED")} className="rounded border border-rose-300 px-2 py-1 text-[11px] font-semibold text-rose-700">Cancel</button>
											</div>
										) : null}
									</div>
								))}
								{gatePasses.length === 0 && <p className="text-xs text-zinc-500">No gate passes found.</p>}
							</div>
						</div>
					</div>
				) : (
					<div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
						<div className="flex items-center justify-between">
							<p className="text-sm font-semibold text-zinc-900">Stock Movements</p>
							<button type="button" onClick={() => void exportStockLedger()} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Export Ledger CSV</button>
						</div>
						<div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
							<div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
								<select value={movementFilters.productId} onChange={(event) => setMovementFilters((prev) => ({ ...prev, productId: event.target.value }))} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs">
									<option value="">All products</option>
									{products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
								</select>
								<select value={movementFilters.warehouseId} onChange={(event) => setMovementFilters((prev) => ({ ...prev, warehouseId: event.target.value }))} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs">
									<option value="">All warehouses</option>
									{warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
								</select>
								<select value={movementFilters.type} onChange={(event) => setMovementFilters((prev) => ({ ...prev, type: event.target.value as "" | MovementType }))} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs">
									<option value="">All types</option>
									<option value="PURCHASE">PURCHASE</option>
									<option value="SALE">SALE</option>
									<option value="ADJUSTMENT">ADJUSTMENT</option>
									<option value="TRANSFER_OUT">TRANSFER_OUT</option>
									<option value="TRANSFER_IN">TRANSFER_IN</option>
									<option value="PURCHASE_RETURN">PURCHASE_RETURN</option>
								</select>
								<input type="date" value={movementFilters.fromDate} onChange={(event) => setMovementFilters((prev) => ({ ...prev, fromDate: event.target.value }))} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs" />
								<input type="date" value={movementFilters.toDate} onChange={(event) => setMovementFilters((prev) => ({ ...prev, toDate: event.target.value }))} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs" />
								<div className="flex gap-2">
									<button type="button" onClick={() => void applyMovementFilters()} className="rounded-lg border border-zinc-900 bg-zinc-900 px-2 py-1.5 text-xs font-semibold text-white">Apply</button>
									<button
										type="button"
										onClick={() => void resetMovementFilters()}
										className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs font-semibold text-zinc-700"
									>
										Reset
									</button>
								</div>
							</div>
						</div>
						<div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200">
							<table className="min-w-full divide-y divide-zinc-200 text-xs">
								<thead className="bg-zinc-50">
									<tr>
										<th className="px-3 py-2 text-left font-semibold text-zinc-600">Time</th>
										<th className="px-3 py-2 text-left font-semibold text-zinc-600">Type</th>
										<th className="px-3 py-2 text-left font-semibold text-zinc-600">Product</th>
										<th className="px-3 py-2 text-left font-semibold text-zinc-600">Warehouse</th>
										<th className="px-3 py-2 text-left font-semibold text-zinc-600">Qty</th>
										<th className="px-3 py-2 text-left font-semibold text-zinc-600">Notes</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-100 bg-white">
									{movements.map((mv) => (
										<tr key={mv.id}>
											<td className="px-3 py-2 text-zinc-700">{new Date(mv.createdAt).toLocaleString()}</td>
											<td className="px-3 py-2 text-zinc-700">{mv.type}</td>
											<td className="px-3 py-2 text-zinc-700">{mv.product?.name || "-"}</td>
											<td className="px-3 py-2 text-zinc-700">{mv.warehouse?.name || "-"}</td>
											<td className="px-3 py-2 text-zinc-700">{mv.quantity}</td>
											<td className="px-3 py-2 text-zinc-700">{mv.notes || "-"}</td>
										</tr>
									))}
									{movements.length === 0 && (
										<tr>
											<td colSpan={6} className="px-3 py-4 text-center text-zinc-500">No stock movements found.</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
						<div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
							<p className="text-sm font-semibold text-zinc-900">Inventory Audit Feed</p>
							<div className="mt-2 max-h-[280px] overflow-y-auto space-y-2">
								{auditEntries.map((entry) => (
									<div key={entry.id} className="rounded-md border border-zinc-200 bg-white p-2 text-xs">
										<p className="font-semibold text-zinc-800">{entry.title}</p>
										<p className="text-zinc-600">{entry.details}</p>
										<p className="text-zinc-500">{new Date(entry.occurredAt).toLocaleString()} | {entry.eventType}</p>
									</div>
								))}
								{auditEntries.length === 0 && <p className="text-xs text-zinc-500">No audit events.</p>}
							</div>
						</div>
					</div>
				)}
			</div>
		</WorkspaceShell>
	);
}
