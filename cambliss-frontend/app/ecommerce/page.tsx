"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";

type StoreRecord = {
	id: string;
	name: string;
	domain?: string | null;
	description?: string | null;
	isActive: boolean;
	paymentDisplayName?: string | null;
	paymentUpiId?: string | null;
	paymentBankAccountName?: string | null;
	paymentBankAccountNo?: string | null;
	paymentBankIfsc?: string | null;
	paymentInstructions?: string | null;
	createdAt: string;
};

type MarketplaceListing = {
	id: string;
	sellingPrice: number;
	isActive: boolean;
	store: {
		id: string;
		name: string;
		domain?: string | null;
	};
	product: {
		id: string;
		name: string;
		sku: string;
		unitPrice: number;
	};
	category?: {
		id: string;
		name: string;
	} | null;
};

type CategoryRecord = {
	id: string;
	name: string;
	parentId?: string | null;
};

type InventoryProduct = {
	id: string;
	name: string;
	sku: string;
	unitPrice: number;
};

type PaymentOrderResponse = {
	orderId: string;
	razorpayOrderId: string;
	amount: number;
	currency: string;
	description: string;
};

type OrderRecord = {
	id: string;
	status: string;
	paymentStatus: string;
	totalAmount: number;
	createdAt: string;
	customer: {
		id: string;
		firstName?: string | null;
		lastName?: string | null;
		email?: string | null;
	};
};

type SellerTab = "products" | "categories" | "orders" | "payments";
type OrderAction = "pack" | "ship" | "deliver" | "cancel";

type ShipDraft = {
	trackingNumber: string;
	courierPartner: string;
};

const formatMoney = (value: number) =>
	new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function EcommercePage() {
	const [stores, setStores] = useState<StoreRecord[]>([]);
	const [listings, setListings] = useState<MarketplaceListing[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<SellerTab>("products");
	const [form, setForm] = useState({ name: "", domain: "", description: "" });
	const [selectedStoreId, setSelectedStoreId] = useState("");
	const [categories, setCategories] = useState<CategoryRecord[]>([]);
	const [products, setProducts] = useState<InventoryProduct[]>([]);
	const [orders, setOrders] = useState<OrderRecord[]>([]);
	const [loadingOrders, setLoadingOrders] = useState(false);
	const [shipDrafts, setShipDrafts] = useState<Record<string, ShipDraft>>({});
	const [actionOrderId, setActionOrderId] = useState<string | null>(null);
	const [categoryForm, setCategoryForm] = useState({ name: "", parentId: "" });
	const [listingForm, setListingForm] = useState({ productId: "", categoryId: "", sellingPrice: "" });
	const [paymentForm, setPaymentForm] = useState({ orderId: "" });
	const [storePaymentForm, setStorePaymentForm] = useState({
		paymentDisplayName: "",
		paymentUpiId: "",
		paymentBankAccountName: "",
		paymentBankAccountNo: "",
		paymentBankIfsc: "",
		paymentInstructions: "",
	});
	const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);
	const [verifyPaymentForm, setVerifyPaymentForm] = useState({
		razorpayOrderId: "",
		razorpayPaymentId: "",
		razorpaySignature: "",
	});
	const [paymentData, setPaymentData] = useState<PaymentOrderResponse | null>(null);
	const [saving, setSaving] = useState(false);

	const authHeaders = useMemo(() => {
		if (typeof window === "undefined") {
			return { "Content-Type": "application/json" };
		}

		const token = localStorage.getItem("authToken");
		return {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		};
	}, []);

	const loadData = async () => {
		setLoading(true);
		setError(null);
		setSuccess(null);

		try {
			const [storesResponse, listingsResponse, productsResponse] = await Promise.all([
				fetch("/api/ecommerce/stores", { headers: authHeaders }),
				fetch("/api/ecommerce/marketplace/products", { headers: authHeaders }),
				fetch("/api/inventory/products", { headers: authHeaders }),
			]);

			if (!storesResponse.ok) {
				const payload = (await storesResponse.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to load stores");
			}
			if (!listingsResponse.ok) {
				const payload = (await listingsResponse.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to load marketplace products");
			}
			if (!productsResponse.ok) {
				const payload = (await productsResponse.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to load products");
			}

			const storesPayload = (await storesResponse.json()) as StoreRecord[];
			const listingsPayload = (await listingsResponse.json()) as MarketplaceListing[];
			const productsPayload = (await productsResponse.json()) as InventoryProduct[];

			setStores(Array.isArray(storesPayload) ? storesPayload : []);
			setListings(Array.isArray(listingsPayload) ? listingsPayload : []);
			setProducts(Array.isArray(productsPayload) ? productsPayload : []);
			if (!selectedStoreId && Array.isArray(storesPayload) && storesPayload.length > 0) {
				setSelectedStoreId(storesPayload[0].id);
			}
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Failed to load ecommerce data");
		} finally {
			setLoading(false);
		}
	};

	const loadOrdersForStore = async (storeId: string) => {
		if (!storeId) {
			setOrders([]);
			return;
		}

		setLoadingOrders(true);
		try {
			const response = await fetch(`/api/ecommerce/orders?storeId=${encodeURIComponent(storeId)}`, {
				headers: authHeaders,
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to load orders");
			}

			const payload = (await response.json()) as OrderRecord[];
			setOrders(Array.isArray(payload) ? payload : []);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Failed to load orders");
		} finally {
			setLoadingOrders(false);
		}
	};

	useEffect(() => {
		void loadData();
	}, []);

	useEffect(() => {
		const loadStorePaymentSettings = async () => {
			if (!selectedStoreId) {
				setStorePaymentForm({
					paymentDisplayName: "",
					paymentUpiId: "",
					paymentBankAccountName: "",
					paymentBankAccountNo: "",
					paymentBankIfsc: "",
					paymentInstructions: "",
				});
				return;
			}

			try {
				const response = await fetch(
					`/api/ecommerce/stores/payment-settings?storeId=${encodeURIComponent(selectedStoreId)}`,
					{ headers: authHeaders },
				);

				if (!response.ok) {
					const payload = (await response.json().catch(() => null)) as { message?: string } | null;
					throw new Error(payload?.message ?? "Failed to load store payment settings");
				}

				const payload = (await response.json()) as StoreRecord;
				setStorePaymentForm({
					paymentDisplayName: payload.paymentDisplayName || "",
					paymentUpiId: payload.paymentUpiId || "",
					paymentBankAccountName: payload.paymentBankAccountName || "",
					paymentBankAccountNo: payload.paymentBankAccountNo || "",
					paymentBankIfsc: payload.paymentBankIfsc || "",
					paymentInstructions: payload.paymentInstructions || "",
				});
			} catch (requestError) {
				setError(requestError instanceof Error ? requestError.message : "Failed to load payment settings");
			}
		};

		void loadStorePaymentSettings();
	}, [selectedStoreId, authHeaders]);

	useEffect(() => {
		const loadCategories = async () => {
			if (!selectedStoreId) {
				setCategories([]);
				return;
			}

			try {
				const response = await fetch(`/api/ecommerce/categories?storeId=${encodeURIComponent(selectedStoreId)}`, {
					headers: authHeaders,
				});

				if (!response.ok) {
					const payload = (await response.json().catch(() => null)) as { message?: string } | null;
					throw new Error(payload?.message ?? "Failed to load categories");
				}

				const payload = (await response.json()) as CategoryRecord[];
				setCategories(Array.isArray(payload) ? payload : []);
			} catch (requestError) {
				setError(requestError instanceof Error ? requestError.message : "Failed to load categories");
			}
		};

		void loadCategories();
	}, [selectedStoreId, authHeaders]);

	useEffect(() => {
		void loadOrdersForStore(selectedStoreId);
	}, [selectedStoreId, authHeaders]);

	const createStore = async (event: FormEvent) => {
		event.preventDefault();
		if (!form.name.trim()) {
			setError("Store name is required");
			return;
		}

		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const response = await fetch("/api/ecommerce/stores", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({
					name: form.name.trim(),
					domain: form.domain.trim() || undefined,
					description: form.description.trim() || undefined,
				}),
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to create store");
			}

			setForm({ name: "", domain: "", description: "" });
			setSuccess("Store created successfully");
			await loadData();
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Failed to create store");
		} finally {
			setSaving(false);
		}
	};

	const createCategory = async (event: FormEvent) => {
		event.preventDefault();
		if (!selectedStoreId) {
			setError("Please select a store first");
			return;
		}
		if (!categoryForm.name.trim()) {
			setError("Category name is required");
			return;
		}

		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const response = await fetch("/api/ecommerce/categories", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({
					storeId: selectedStoreId,
					name: categoryForm.name.trim(),
					parentId: categoryForm.parentId || undefined,
				}),
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to create category");
			}

			setCategoryForm({ name: "", parentId: "" });
			setSuccess("Category created successfully");
			const refreshed = await fetch(`/api/ecommerce/categories?storeId=${encodeURIComponent(selectedStoreId)}`, {
				headers: authHeaders,
			});
			if (refreshed.ok) {
				const payload = (await refreshed.json()) as CategoryRecord[];
				setCategories(Array.isArray(payload) ? payload : []);
			}
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Failed to create category");
		} finally {
			setSaving(false);
		}
	};

	const createListing = async (event: FormEvent) => {
		event.preventDefault();
		if (!selectedStoreId) {
			setError("Please select a store first");
			return;
		}
		if (!listingForm.productId) {
			setError("Please select a product");
			return;
		}

		const parsedPrice = Number(listingForm.sellingPrice);
		if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
			setError("Selling price must be a positive number");
			return;
		}

		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const response = await fetch("/api/ecommerce/listings", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({
					storeId: selectedStoreId,
					productId: listingForm.productId,
					categoryId: listingForm.categoryId || undefined,
					sellingPrice: parsedPrice,
				}),
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to create listing");
			}

			setListingForm({ productId: "", categoryId: "", sellingPrice: "" });
			setSuccess("Product listed successfully");
			await loadData();
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Failed to create listing");
		} finally {
			setSaving(false);
		}
	};

	const createPaymentOrder = async (event: FormEvent) => {
		event.preventDefault();
		if (!paymentForm.orderId.trim()) {
			setError("Order ID is required");
			return;
		}

		setSaving(true);
		setError(null);
		setSuccess(null);
		setPaymentData(null);
		try {
			const response = await fetch("/api/ecommerce/payment/create", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({ orderId: paymentForm.orderId.trim() }),
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to create payment order");
			}

			const payload = (await response.json()) as PaymentOrderResponse;
			setPaymentData(payload);
			setSuccess("Payment order created. Use Razorpay order ID in your checkout flow.");
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Failed to create payment order");
		} finally {
			setSaving(false);
		}
	};

	const verifyPayment = async (event: FormEvent) => {
		event.preventDefault();
		if (!verifyPaymentForm.razorpayOrderId.trim() || !verifyPaymentForm.razorpayPaymentId.trim() || !verifyPaymentForm.razorpaySignature.trim()) {
			setError("All verification fields are required");
			return;
		}

		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const response = await fetch("/api/ecommerce/payment/verify", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({
					razorpayOrderId: verifyPaymentForm.razorpayOrderId.trim(),
					razorpayPaymentId: verifyPaymentForm.razorpayPaymentId.trim(),
					razorpaySignature: verifyPaymentForm.razorpaySignature.trim(),
				}),
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to verify payment");
			}

			setSuccess("Payment verified and order marked as paid");
			setVerifyPaymentForm({ razorpayOrderId: "", razorpayPaymentId: "", razorpaySignature: "" });
			await loadOrdersForStore(selectedStoreId);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Failed to verify payment");
		} finally {
			setSaving(false);
		}
	};

	const updateStorePaymentSettings = async (event: FormEvent) => {
		event.preventDefault();
		if (!selectedStoreId) {
			setError("Please select a store first");
			return;
		}

		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const response = await fetch("/api/ecommerce/stores/payment-settings", {
				method: "PUT",
				headers: authHeaders,
				body: JSON.stringify({
					storeId: selectedStoreId,
					...storePaymentForm,
				}),
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to update store payment settings");
			}

			setSuccess("Store payment settings updated");
			await loadData();
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Failed to update payment settings");
		} finally {
			setSaving(false);
		}
	};

	const selectedStore = useMemo(() => stores.find((store) => store.id === selectedStoreId), [stores, selectedStoreId]);

	const storefrontBaseUrl = useMemo(() => {
		if (typeof window !== "undefined") {
			return window.location.origin;
		}

		const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
		return configured || "";
	}, []);

	const getStorefrontUrl = (domain?: string | null) => {
		if (!domain) {
			return "";
		}

		if (!storefrontBaseUrl) {
			return `/store/${domain}`;
		}

		return `${storefrontBaseUrl}/store/${domain}`;
	};

	const copyStorefrontUrl = async (storeId: string, domain?: string | null) => {
		const url = getStorefrontUrl(domain);
		if (!url) {
			setError("Store domain is not available");
			return;
		}

		try {
			await navigator.clipboard.writeText(url);
			setCopiedStoreId(storeId);
			setSuccess("Store URL copied");
		} catch {
			setError("Unable to copy URL. Please copy manually.");
		}
	};

	const selectedStoreListings = useMemo(
		() => listings.filter((item) => item.store.id === selectedStoreId),
		[listings, selectedStoreId],
	);

	const updateShipDraft = (orderId: string, key: keyof ShipDraft, value: string) => {
		setShipDrafts((prev) => ({
			...prev,
			[orderId]: {
				trackingNumber: prev[orderId]?.trackingNumber ?? "",
				courierPartner: prev[orderId]?.courierPartner ?? "",
				[key]: value,
			},
		}));
	};

	const runOrderAction = async (endpoint: string, body: Record<string, string>, successMessage: string) => {
		const orderId = body.orderId;
		setActionOrderId(orderId);
		setError(null);
		setSuccess(null);
		try {
			const response = await fetch(endpoint, {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to update order");
			}

			setSuccess(successMessage);
			if (selectedStoreId) {
				await loadOrdersForStore(selectedStoreId);
			}
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Failed to update order");
		} finally {
			setActionOrderId(null);
		}
	};

	const submitShipOrder = async (orderId: string) => {
		const draft = shipDrafts[orderId];
		if (!draft?.trackingNumber.trim() || !draft.courierPartner.trim()) {
			setError("Tracking number and courier partner are required to ship an order");
			return;
		}

		await runOrderAction(
			"/api/ecommerce/fulfillment/ship",
			{
				orderId,
				trackingNumber: draft.trackingNumber.trim(),
				courierPartner: draft.courierPartner.trim(),
			},
			"Order marked as shipped",
		);
	};

	const getOrderActions = (status: string): OrderAction[] => {
		switch (status.toUpperCase()) {
			case "PAID":
				return ["pack", "cancel"];
			case "PACKED":
				return ["ship", "cancel"];
			case "SHIPPED":
				return ["deliver"];
			case "PENDING":
				return ["cancel"];
			default:
				return [];
		}
	};

	return (
		<WorkspaceShell>
			<div className="mt-5 space-y-5">
				<section className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6">
					<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Ecommerce Marketplace</h1>
					<p className="mt-2 text-sm text-zinc-600">
						Admin can sell directly from a platform store and can also onboard additional seller stores under the same organization.
					</p>
					<div className="mt-4 grid gap-3 text-sm text-zinc-700 md:grid-cols-3">
						<div className="rounded-xl border border-zinc-200 bg-white p-3">Platform + Vendor stores supported</div>
						<div className="rounded-xl border border-zinc-200 bg-white p-3">Marketplace catalog across active stores</div>
						<div className="rounded-xl border border-zinc-200 bg-white p-3">Multi-store cart and checkout APIs ready</div>
					</div>
				</section>

				<section className="rounded-2xl border border-zinc-200 bg-white p-4">
					<div className="flex flex-wrap gap-2">
						{([
							{ key: "products", label: "Products" },
							{ key: "categories", label: "Categories" },
							{ key: "orders", label: "Orders" },
							{ key: "payments", label: "Payments" },
						] as Array<{ key: SellerTab; label: string }>).map((tab) => (
							<button
								key={tab.key}
								type="button"
								onClick={() => setActiveTab(tab.key)}
								className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
									activeTab === tab.key
										? "border-zinc-900 bg-zinc-900 text-white"
										: "border-zinc-300 bg-white text-zinc-700"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
					<div className="mt-3">
						<label className="mb-1 block text-xs font-medium text-zinc-600">Working Store</label>
						<select
							value={selectedStoreId}
							onChange={(event) => setSelectedStoreId(event.target.value)}
							className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
						>
							<option value="">Select a store</option>
							{stores.map((store) => (
								<option key={store.id} value={store.id}>
									{store.name}
								</option>
							))}
						</select>
					</div>
					{error && <p className="mt-3 text-sm text-red-600">{error}</p>}
					{success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
				</section>

				<section className="rounded-2xl border border-zinc-200 bg-white p-6">
					<h2 className="text-lg font-semibold text-zinc-900">Create Seller Store</h2>
					<form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={createStore}>
						<input
							value={form.name}
							onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
							placeholder="Store name (for admin or a seller)"
							className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
						/>
						<input
							value={form.domain}
							onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
							placeholder="Store domain (optional)"
							className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
						/>
						<textarea
							value={form.description}
							onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
							placeholder="Store description"
							className="md:col-span-2 rounded-xl border border-zinc-300 px-3 py-2 text-sm"
							rows={3}
						/>
						<div className="md:col-span-2 flex items-center gap-3">
							<button
								type="submit"
								disabled={saving}
								className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
							>
								{saving ? "Creating..." : "Create Store"}
							</button>
							<button
								type="button"
								onClick={() => void loadData()}
								className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800"
							>
								Refresh
							</button>
						</div>
					</form>
					{error && <p className="mt-3 text-sm text-red-600">{error}</p>}
					{success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
				</section>

				{activeTab === "categories" && (
				<section className="rounded-2xl border border-zinc-200 bg-white p-6">
					<h2 className="text-lg font-semibold text-zinc-900">Category-wise Product Upload</h2>
					<p className="mt-1 text-sm text-zinc-600">
						Create categories, then list inventory products inside each category for the selected store.
					</p>

					<div className="mt-4 grid gap-5 md:grid-cols-2">
						<form className="space-y-3 rounded-xl border border-zinc-200 p-4" onSubmit={createCategory}>
							<h3 className="text-sm font-semibold text-zinc-900">Create Category</h3>
							<input
								value={categoryForm.name}
								onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
								placeholder="Category name"
								className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
							/>
							<select
								value={categoryForm.parentId}
								onChange={(event) => setCategoryForm((prev) => ({ ...prev, parentId: event.target.value }))}
								className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
							>
								<option value="">No parent (root category)</option>
								{categories.map((category) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
							<button
								type="submit"
								disabled={saving}
								className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
							>
								{saving ? "Saving..." : "Add Category"}
							</button>
						</form>

						<form className="space-y-3 rounded-xl border border-zinc-200 p-4" onSubmit={createListing}>
							<h3 className="text-sm font-semibold text-zinc-900">Upload Product to Category</h3>
							<select
								value={listingForm.productId}
								onChange={(event) => setListingForm((prev) => ({ ...prev, productId: event.target.value }))}
								className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
							>
								<option value="">Select product from inventory</option>
								{products.map((product) => (
									<option key={product.id} value={product.id}>
										{product.name} ({product.sku})
									</option>
								))}
							</select>
							<select
								value={listingForm.categoryId}
								onChange={(event) => setListingForm((prev) => ({ ...prev, categoryId: event.target.value }))}
								className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
							>
								<option value="">Uncategorized</option>
								{categories.map((category) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
							<input
								type="number"
								min="0"
								step="0.01"
								value={listingForm.sellingPrice}
								onChange={(event) => setListingForm((prev) => ({ ...prev, sellingPrice: event.target.value }))}
								placeholder="Selling price"
								className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
							/>
							<button
								type="submit"
								disabled={saving}
								className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
							>
								{saving ? "Saving..." : "Upload Listing"}
							</button>
						</form>
					</div>
				</section>
				)}

				{activeTab === "products" && (
				<section className="rounded-2xl border border-zinc-200 bg-white p-6">
					<h2 className="text-lg font-semibold text-zinc-900">Products Panel</h2>
					<p className="mt-1 text-sm text-zinc-600">Inventory products are your upload source; listed products are what customers see.</p>
					<div className="mt-4 grid gap-4 md:grid-cols-2">
						<div className="rounded-xl border border-zinc-200 p-4">
							<h3 className="text-sm font-semibold text-zinc-900">Inventory Products</h3>
							{products.length === 0 ? (
								<p className="mt-2 text-sm text-zinc-600">No products found. Add products from Inventory first.</p>
							) : (
								<ul className="mt-2 space-y-2 text-sm text-zinc-700">
									{products.slice(0, 12).map((product) => (
										<li key={product.id} className="rounded-lg border border-zinc-200 p-2">
											<p className="font-medium text-zinc-900">{product.name}</p>
											<p className="text-xs text-zinc-600">SKU: {product.sku}</p>
										</li>
									))}
								</ul>
							)}
						</div>
						<div className="rounded-xl border border-zinc-200 p-4">
							<h3 className="text-sm font-semibold text-zinc-900">Listed In Selected Store</h3>
							{selectedStoreListings.length === 0 ? (
								<p className="mt-2 text-sm text-zinc-600">No listings for this store yet.</p>
							) : (
								<ul className="mt-2 space-y-2 text-sm text-zinc-700">
									{selectedStoreListings.map((item) => (
										<li key={item.id} className="rounded-lg border border-zinc-200 p-2">
											<p className="font-medium text-zinc-900">{item.product.name}</p>
											<p className="text-xs text-zinc-600">{item.category?.name || "Uncategorized"} • {formatMoney(item.sellingPrice)}</p>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</section>
				)}

				{activeTab === "payments" && (
				<section className="rounded-2xl border border-zinc-200 bg-white p-6">
					<h2 className="text-lg font-semibold text-zinc-900">Payment (Razorpay)</h2>
					<p className="mt-1 text-sm text-zinc-600">
						After creating an order, generate a Razorpay payment order here using that order ID.
					</p>
					<form className="mt-4 flex flex-col gap-3 md:flex-row" onSubmit={createPaymentOrder}>
						<input
							value={paymentForm.orderId}
							onChange={(event) => setPaymentForm({ orderId: event.target.value })}
							placeholder="Enter ecommerce order ID"
							className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
						/>
						<button
							type="submit"
							disabled={saving}
							className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
						>
							{saving ? "Processing..." : "Create Payment Order"}
						</button>
					</form>
					{paymentData && (
						<div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
							<p><span className="font-semibold text-zinc-900">Order:</span> {paymentData.orderId}</p>
							<p><span className="font-semibold text-zinc-900">Razorpay Order:</span> {paymentData.razorpayOrderId}</p>
							<p><span className="font-semibold text-zinc-900">Amount:</span> {paymentData.currency} {paymentData.amount}</p>
							<p><span className="font-semibold text-zinc-900">Description:</span> {paymentData.description}</p>
						</div>
					)}
					<form className="mt-5 grid gap-3 md:grid-cols-3" onSubmit={verifyPayment}>
						<input
							value={verifyPaymentForm.razorpayOrderId}
							onChange={(event) => setVerifyPaymentForm((prev) => ({ ...prev, razorpayOrderId: event.target.value }))}
							placeholder="Razorpay Order ID"
							className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
						/>
						<input
							value={verifyPaymentForm.razorpayPaymentId}
							onChange={(event) => setVerifyPaymentForm((prev) => ({ ...prev, razorpayPaymentId: event.target.value }))}
							placeholder="Razorpay Payment ID"
							className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
						/>
						<input
							value={verifyPaymentForm.razorpaySignature}
							onChange={(event) => setVerifyPaymentForm((prev) => ({ ...prev, razorpaySignature: event.target.value }))}
							placeholder="Razorpay Signature"
							className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
						/>
						<button
							type="submit"
							disabled={saving}
							className="md:col-span-3 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
						>
							{saving ? "Verifying..." : "Verify Payment"}
						</button>
					</form>
					<p className="mt-3 text-xs text-zinc-600">Gateway keys are currently managed from backend environment variables.</p>

					<div className="mt-6 rounded-xl border border-zinc-200 p-4">
						<h3 className="text-sm font-semibold text-zinc-900">Store Payment Details (what customers see)</h3>
						<p className="mt-1 text-xs text-zinc-600">Configure UPI/bank details for your selected store.</p>
						<form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={updateStorePaymentSettings}>
							<input
								value={storePaymentForm.paymentDisplayName}
								onChange={(event) => setStorePaymentForm((prev) => ({ ...prev, paymentDisplayName: event.target.value }))}
								placeholder="Display name"
								className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
							/>
							<input
								value={storePaymentForm.paymentUpiId}
								onChange={(event) => setStorePaymentForm((prev) => ({ ...prev, paymentUpiId: event.target.value }))}
								placeholder="UPI ID"
								className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
							/>
							<input
								value={storePaymentForm.paymentBankAccountName}
								onChange={(event) => setStorePaymentForm((prev) => ({ ...prev, paymentBankAccountName: event.target.value }))}
								placeholder="Bank account name"
								className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
							/>
							<input
								value={storePaymentForm.paymentBankAccountNo}
								onChange={(event) => setStorePaymentForm((prev) => ({ ...prev, paymentBankAccountNo: event.target.value }))}
								placeholder="Bank account number"
								className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
							/>
							<input
								value={storePaymentForm.paymentBankIfsc}
								onChange={(event) => setStorePaymentForm((prev) => ({ ...prev, paymentBankIfsc: event.target.value }))}
								placeholder="IFSC"
								className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
							/>
							<textarea
								value={storePaymentForm.paymentInstructions}
								onChange={(event) => setStorePaymentForm((prev) => ({ ...prev, paymentInstructions: event.target.value }))}
								placeholder="Payment instructions"
								className="rounded-xl border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
								rows={3}
							/>
							<button
								type="submit"
								disabled={saving}
								className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2"
							>
								{saving ? "Saving..." : "Save Payment Details"}
							</button>
						</form>
					</div>
				</section>
				)}

				{activeTab === "orders" && (
				<section className="rounded-2xl border border-zinc-200 bg-white p-6">
					<h2 className="text-lg font-semibold text-zinc-900">Orders</h2>
					<p className="mt-1 text-sm text-zinc-600">Orders for the currently selected store.</p>
					{loadingOrders ? (
						<p className="mt-3 text-sm text-zinc-600">Loading orders...</p>
					) : orders.length === 0 ? (
						<p className="mt-3 text-sm text-zinc-600">No orders for this store yet.</p>
					) : (
						<div className="mt-4 overflow-x-auto">
							<table className="min-w-full text-left text-sm">
								<thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
									<tr>
										<th className="pb-2 pr-3">Order ID</th>
										<th className="pb-2 pr-3">Customer</th>
										<th className="pb-2 pr-3">Status</th>
										<th className="pb-2 pr-3">Payment</th>
										<th className="pb-2 pr-3">Amount</th>
										<th className="pb-2 pr-3">Actions</th>
									</tr>
								</thead>
								<tbody>
									{orders.map((order) => (
										<tr key={order.id} className="border-b border-zinc-100">
											<td className="py-2 pr-3 text-xs text-zinc-700">{order.id}</td>
											<td className="py-2 pr-3 text-zinc-700">{[order.customer.firstName, order.customer.lastName].filter(Boolean).join(" ") || order.customer.email || "Customer"}</td>
											<td className="py-2 pr-3 text-zinc-700">{order.status}</td>
											<td className="py-2 pr-3 text-zinc-700">{order.paymentStatus}</td>
											<td className="py-2 pr-3 font-medium text-zinc-900">{formatMoney(Number(order.totalAmount))}</td>
											<td className="py-2 pr-3">
												<div className="flex min-w-[220px] flex-col gap-2">
													<div className="flex flex-wrap gap-2">
														{getOrderActions(order.status).includes("pack") && (
															<button
																type="button"
																onClick={() => void runOrderAction("/api/ecommerce/fulfillment/pack", { orderId: order.id }, "Order marked as packed")}
																disabled={actionOrderId === order.id}
																className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-60"
															>
																Pack
															</button>
														)}
														{getOrderActions(order.status).includes("deliver") && (
															<button
																type="button"
																onClick={() => void runOrderAction("/api/ecommerce/fulfillment/deliver", { orderId: order.id }, "Order marked as delivered")}
																disabled={actionOrderId === order.id}
																className="rounded-lg border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-60"
															>
																Deliver
															</button>
														)}
														{getOrderActions(order.status).includes("cancel") && (
															<button
																type="button"
																onClick={() => void runOrderAction("/api/ecommerce/fulfillment/cancel", { orderId: order.id }, "Order cancelled")}
																disabled={actionOrderId === order.id}
																className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
															>
																Cancel
															</button>
														)}
													</div>
													{getOrderActions(order.status).includes("ship") && (
														<div className="grid gap-2 md:grid-cols-3">
															<input
																value={shipDrafts[order.id]?.trackingNumber ?? ""}
																onChange={(event) => updateShipDraft(order.id, "trackingNumber", event.target.value)}
																placeholder="Tracking no."
																className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
															/>
															<input
																value={shipDrafts[order.id]?.courierPartner ?? ""}
																onChange={(event) => updateShipDraft(order.id, "courierPartner", event.target.value)}
																placeholder="Courier"
																className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
															/>
															<button
																type="button"
																onClick={() => void submitShipOrder(order.id)}
																disabled={actionOrderId === order.id}
																className="rounded-lg border border-sky-300 px-2 py-1 text-xs font-semibold text-sky-700 disabled:opacity-60"
															>
																Ship
															</button>
														</div>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
				)}

				{activeTab === "products" && (
				<section className="rounded-2xl border border-zinc-200 bg-white p-6">
					<h2 className="text-lg font-semibold text-zinc-900">Stores</h2>
					{loading ? (
						<p className="mt-3 text-sm text-zinc-600">Loading stores...</p>
					) : stores.length === 0 ? (
						<p className="mt-3 text-sm text-zinc-600">No stores found yet.</p>
					) : (
						<div className="mt-4 grid gap-3 md:grid-cols-2">
							{stores.map((store) => (
								<div key={store.id} className="rounded-xl border border-zinc-200 p-3">
									<p className="text-sm font-semibold text-zinc-900">{store.name}</p>
									<p className="mt-1 text-xs text-zinc-600">{store.domain || "No domain"}</p>
									{store.domain ? (
										<div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
											<a
												href={getStorefrontUrl(store.domain)}
												target="_blank"
												rel="noreferrer"
												className="font-medium text-zinc-700 underline"
											>
												{getStorefrontUrl(store.domain)}
											</a>
											<button
												type="button"
												onClick={() => void copyStorefrontUrl(store.id, store.domain)}
												className="rounded-md border border-zinc-300 px-2 py-0.5 font-semibold text-zinc-700"
											>
												{copiedStoreId === store.id ? "Copied" : "Copy URL"}
											</button>
										</div>
									) : (
										<p className="mt-1 text-xs text-zinc-600">URL will appear after domain is generated</p>
									)}
									<p className="mt-1 text-xs text-zinc-600">{store.isActive ? "Active" : "Inactive"}</p>
								</div>
							))}
						</div>
					)}
					{selectedStore?.domain && (
						<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-700">
							<span>Selected Store URL:</span>
							<a
								href={getStorefrontUrl(selectedStore.domain)}
								target="_blank"
								rel="noreferrer"
								className="font-medium underline"
							>
								{getStorefrontUrl(selectedStore.domain)}
							</a>
							<button
								type="button"
								onClick={() => void copyStorefrontUrl(selectedStore.id, selectedStore.domain)}
								className="rounded-md border border-zinc-300 px-2 py-0.5 font-semibold text-zinc-700"
							>
								{copiedStoreId === selectedStore.id ? "Copied" : "Copy URL"}
							</button>
						</div>
					)}
				</section>
				)}

				{activeTab === "products" && (
				<section className="rounded-2xl border border-zinc-200 bg-white p-6">
					<h2 className="text-lg font-semibold text-zinc-900">Marketplace Catalog</h2>
					<p className="mt-1 text-sm text-zinc-600">Active listings across all active stores.</p>
					{loading ? (
						<p className="mt-3 text-sm text-zinc-600">Loading catalog...</p>
					) : listings.length === 0 ? (
						<p className="mt-3 text-sm text-zinc-600">No active product listings found.</p>
					) : (
						<div className="mt-4 overflow-x-auto">
							<table className="min-w-full text-left text-sm">
								<thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
									<tr>
										<th className="pb-2 pr-3">Product</th>
										<th className="pb-2 pr-3">Seller Store</th>
										<th className="pb-2 pr-3">Category</th>
										<th className="pb-2 pr-3">Price</th>
									</tr>
								</thead>
								<tbody>
									{listings.map((item) => (
										<tr key={item.id} className="border-b border-zinc-100">
											<td className="py-2 pr-3">
												<p className="font-medium text-zinc-900">{item.product.name}</p>
												<p className="text-xs text-zinc-500">SKU: {item.product.sku}</p>
											</td>
											<td className="py-2 pr-3 text-zinc-700">{item.store.name}</td>
											<td className="py-2 pr-3 text-zinc-700">{item.category?.name || "Uncategorized"}</td>
											<td className="py-2 pr-3 font-medium text-zinc-900">{formatMoney(item.sellingPrice)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
				)}
			</div>
		</WorkspaceShell>
	);
}
