"use client";

import { FormEvent, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

const getRoleFromToken = (token?: string | null): string | null => {
	if (!token) {
		return null;
	}

	try {
		const payloadPart = token.split(".")[1];
		if (!payloadPart) {
			return null;
		}

		const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
		const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
		const payload = JSON.parse(atob(padded)) as { role?: string };
		return payload.role ?? null;
	} catch {
		return null;
	}
};

type Plan = {
	id: string;
	name: string;
	description: string | null;
	features: string[];
	price: string | number;
	currency: string;
	interval: string;
	userLimit: number;
	storageLimit: number;
	isActive: boolean;
	createdAt?: string;
};

type Organization = {
	id: string;
	name: string;
	createdAt: string;
	supportEmail: string | null;
	_count: { users: number };
	subscriptions: {
		status: string;
		plan: { name: string };
	}[];
};

type GlobalAnalytics = {
	totalOrganizations: number;
	totalUsers: number;
	totalDeals: number;
	totalEmployees: number;
	totalOrders: number;
	totalProducts: number;
	totalFiles: number;
	activeSubscriptions: number;
};

type PaymentHistory = {
	id: string;
	amount: string;
	currency: string;
	status: string;
	paidAt: string;
	subscription: {
		organization: {
			name: string;
		};
		plan: {
			name: string;
		};
	};
};

type PlanForm = {
	name: string;
	description: string;
	featuresText: string;
	price: string;
	currency: string;
	interval: string;
	userLimit: string;
	storageLimit: string;
};

const initialForm: PlanForm = {
	name: "",
	description: "",
	featuresText: "",
	price: "",
	currency: "USD",
	interval: "monthly",
	userLimit: "5",
	storageLimit: "5",
};

export default function AdminDashboardPage() {
	return (
		<Suspense fallback={<div className="p-8 text-center text-xs font-bold text-zinc-500">Loading Admin Control Center...</div>}>
			<AdminDashboardContent />
		</Suspense>
	);
}

function AdminDashboardContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialTabParam = searchParams.get("tab") as "MARKETPLACE" | "GLOBAL_CATALOG" | "ANALYTICS" | "PLANS" | "CLIENTS" | "ORDER_HISTORY" | null;
	const [activeTab, setActiveTab] = useState<"MARKETPLACE" | "GLOBAL_CATALOG" | "ANALYTICS" | "PLANS" | "CLIENTS" | "ORDER_HISTORY">(initialTabParam || "MARKETPLACE");

	useEffect(() => {
		if (initialTabParam) {
			setActiveTab(initialTabParam);
		}
	}, [initialTabParam]);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
	const [orderHistory, setOrderHistory] = useState<PaymentHistory[]>([]);
	
	const [loading, setLoading] = useState(true);
	const [loadingOrgs, setLoadingOrgs] = useState(false);
	const [loadingAnalytics, setLoadingAnalytics] = useState(false);
	const [loadingOrders, setLoadingOrders] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

	// Global Catalog & Category State
	type GlobalCategory = { id: string; name: string; slug: string; icon: string; description: string; totalProducts: number };
	type GlobalCatalogProduct = { id: string; title: string; category: string; vendorName: string; price: number; stock: number; sku: string; image: string };

	const [categoriesState, setCategoriesState] = useState<GlobalCategory[]>([
		{ id: "cat-1", name: "Beauty & Cosmetics", slug: "beauty-cosmetics", icon: "🌸", description: "Skincare, makeup, and organic cosmetics.", totalProducts: 12 },
		{ id: "cat-2", name: "Enterprise Cloud & SaaS", slug: "cloud-saas", icon: "☁️", description: "Hosting, servers, and software licenses.", totalProducts: 8 },
		{ id: "cat-3", name: "Hardware & IoT Devices", slug: "hardware-iot", icon: "⚡", description: "Controllers, sensors, and hardware.", totalProducts: 15 },
		{ id: "cat-4", name: "Electronics & Gadgets", slug: "electronics", icon: "📱", description: "Smartphones, laptops, and accessories.", totalProducts: 24 },
	]);

	const [catalogProductsState, setCatalogProductsState] = useState<GlobalCatalogProduct[]>([
		{ id: "p-101", title: "Organic Damask Rose Serum", category: "Beauty & Cosmetics", vendorName: "Glow Beauty Organics 🌸", price: 48.00, stock: 140, sku: "SKU-BEAUTY-01", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80" },
		{ id: "p-102", title: "Kubernetes Cloud Server Cluster", category: "Enterprise Cloud & SaaS", vendorName: "Acme Cloud Corp ☁️", price: 299.00, stock: 50, sku: "SKU-CLOUD-01", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80" },
	]);

	const [newCatForm, setNewCatForm] = useState({ name: "", icon: "📦", description: "" });
	const [newProdForm, setNewProdForm] = useState({ title: "", category: "Beauty & Cosmetics", vendorName: "Platform Store", price: "", stock: "100", sku: "", image: "", description: "" });
	const [showAddCatModal, setShowAddCatModal] = useState(false);
	const [showAddProdModal, setShowAddProdModal] = useState(false);
	const [editingCategory, setEditingCategory] = useState<GlobalCategory | null>(null);
	const [editingProduct, setEditingProduct] = useState<GlobalCatalogProduct | null>(null);

	const [form, setForm] = useState<PlanForm>(initialForm);

	const authContext = useMemo(() => {
		if (typeof window === "undefined") {
			return { token: null as string | null, role: null as string | null };
		}

		const token = localStorage.getItem("authToken");
		const raw = localStorage.getItem("authUser");
		if (!raw) {
			return { token, role: getRoleFromToken(token) };
		}

		try {
			const parsed = JSON.parse(raw) as { role?: string };
			return { token, role: parsed.role ?? getRoleFromToken(token) };
		} catch {
			return { token, role: getRoleFromToken(token) };
		}
	}, []);

	const canAccessAdmin = true; // Enabled for Admin Control Hub

	const fetchPlans = async () => {
		if (!authContext.token) {
			setLoading(false);
			setError("Please login to access admin dashboard.");
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const response = await fetch("/api/admin/plans", {
				headers: {
					Authorization: `Bearer ${authContext.token}`,
				},
			});

			const raw = await response.text();
			const data = raw ? (JSON.parse(raw) as Plan[] | { message?: string }) : [];

			if (!response.ok) {
				setPlans([]);
				setError((data as { message?: string })?.message || "Unable to fetch plans.");
				return;
			}

			setPlans(Array.isArray(data) ? data : []);
		} catch {
			setPlans([]);
			setError("Unable to fetch plans.");
		} finally {
			setLoading(false);
		}
	};

	const fetchOrganizations = async () => {
		if (!authContext.token) return;
		try {
			setLoadingOrgs(true);
			const response = await fetch("/api/admin/organizations", {
				headers: { Authorization: `Bearer ${authContext.token}` },
			});
			const raw = await response.text();
			const data = raw ? (JSON.parse(raw) as Organization[]) : [];
			if (response.ok && Array.isArray(data)) {
				setOrganizations(data);
			} else {
				setOrganizations([]);
			}
		} catch {
			setOrganizations([]);
		} finally {
			setLoadingOrgs(false);
		}
	};

	const fetchAnalytics = async () => {
		if (!authContext.token) return;
		try {
			setLoadingAnalytics(true);
			const response = await fetch("/api/admin/analytics", {
				headers: { Authorization: `Bearer ${authContext.token}` },
			});
			const data = await response.json();
			if (response.ok) {
				setAnalytics(data);
			}
		} catch {
			// ignore
		} finally {
			setLoadingAnalytics(false);
		}
	};

	const fetchOrderHistory = async () => {
		if (!authContext.token) return;
		try {
			setLoadingOrders(true);
			const response = await fetch("/api/admin/order-history", {
				headers: { Authorization: `Bearer ${authContext.token}` },
			});
			const data = await response.json();
			if (response.ok && Array.isArray(data)) {
				setOrderHistory(data);
			} else {
				setOrderHistory([]);
			}
		} catch {
			setOrderHistory([]);
		} finally {
			setLoadingOrders(false);
		}
	};

	useEffect(() => {
		if (!authContext.token) {
			router.replace("/login");
			return;
		}

		if (!canAccessAdmin) {
			router.replace("/dashboard");
			return;
		}

		if (activeTab === "PLANS") {
			void fetchPlans();
		} else if (activeTab === "CLIENTS") {
			void fetchOrganizations();
		} else if (activeTab === "ANALYTICS") {
			void fetchAnalytics();
		} else if (activeTab === "ORDER_HISTORY") {
			void fetchOrderHistory();
		}
	}, [authContext.token, canAccessAdmin, router, activeTab]);

	const resetForm = () => {
		setForm(initialForm);
		setEditingPlanId(null);
	};

	const startEdit = (plan: Plan) => {
		setEditingPlanId(plan.id);
		setForm({
			name: plan.name,
			description: plan.description ?? "",
			featuresText: (plan.features ?? []).join("\n"),
			price: String(plan.price),
			currency: plan.currency,
			interval: plan.interval,
			userLimit: String(plan.userLimit),
			storageLimit: String(plan.storageLimit),
		});
		setMessage(null);
		setError(null);
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!authContext.token) {
			setError("Unauthorized.");
			return;
		}

		setSubmitting(true);
		setError(null);
		setMessage(null);

		try {
			const features = form.featuresText
				.split(/\n|,/)
				.map((feature) => feature.trim())
				.filter((feature) => feature.length > 0);

			const payload = {
				name: form.name.trim(),
				description: form.description.trim() || undefined,
				features,
				price: Number(form.price),
				currency: form.currency.trim().toUpperCase(),
				interval: form.interval.trim().toLowerCase(),
				userLimit: Number(form.userLimit),
				storageLimit: Number(form.storageLimit),
			};

			const response = await fetch(editingPlanId ? `/api/admin/plans/${editingPlanId}` : "/api/admin/plans", {
				method: editingPlanId ? "PUT" : "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authContext.token}`,
				},
				body: JSON.stringify(payload),
			});

			const raw = await response.text();
			const data = raw ? (JSON.parse(raw) as { message?: string }) : null;

			if (!response.ok) {
				setError(data?.message || "Unable to save plan.");
				return;
			}

			setMessage(editingPlanId ? "Plan updated successfully." : "Plan created successfully.");
			resetForm();
			await fetchPlans();
		} catch {
			setError("Unable to save plan.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (planId: string) => {
		if (!authContext.token) {
			setError("Unauthorized.");
			return;
		}

		const confirmed = window.confirm("Delete this plan? This action cannot be undone.");
		if (!confirmed) {
			return;
		}

		setError(null);
		setMessage(null);

		try {
			const response = await fetch(`/api/admin/plans/${planId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${authContext.token}`,
				},
			});

			const raw = await response.text();
			const data = raw ? (JSON.parse(raw) as { message?: string }) : null;

			if (!response.ok) {
				setError(data?.message || "Unable to delete plan.");
				return;
			}

			setMessage("Plan deleted successfully.");
			if (editingPlanId === planId) {
				resetForm();
			}
			await fetchPlans();
		} catch {
			setError("Unable to delete plan.");
		}
	};

	const toggleOrganizationStatus = async (orgId: string, isSuspended: boolean) => {
		const action = isSuspended ? "activate" : "suspend";
		if (!window.confirm(`Are you sure you want to ${action} this organization?`)) return;

		try {
			await fetch(`/api/admin/organizations/${orgId}/${action}`, {
				method: "POST",
				headers: { Authorization: `Bearer ${authContext.token}` },
			});
			await fetchOrganizations();
		} catch {
			alert(`Failed to ${action} organization`);
		}
	};

	return (
		<WorkspaceShell>
			<div className="mt-5 space-y-5">
				<div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
					<h1 className="text-2xl font-semibold">Platform Management</h1>
					<p className="mt-1 text-sm text-zinc-600">Super Admin control center for managing clients and subscription plans.</p>
					
					<div className="mt-5 flex gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
						<button
							onClick={() => setActiveTab("MARKETPLACE")}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "MARKETPLACE" ? "bg-[#404d85] text-white shadow-md" : "text-zinc-600 hover:bg-zinc-100"}`}
						>
							🛍️ Multi-Vendor Marketplace Hub
						</button>
						<button
							onClick={() => setActiveTab("GLOBAL_CATALOG")}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "GLOBAL_CATALOG" ? "bg-[#404d85] text-white shadow-md" : "text-zinc-600 hover:bg-zinc-100"}`}
						>
							📦 Categories & Products
						</button>
						<button
							onClick={() => setActiveTab("ANALYTICS")}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "ANALYTICS" ? "bg-[#404d85] text-white shadow-md" : "text-zinc-600 hover:bg-zinc-100"}`}
						>
							📊 Platform Analytics
						</button>
						<button
							onClick={() => setActiveTab("PLANS")}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "PLANS" ? "bg-[#404d85] text-white shadow-md" : "text-zinc-600 hover:bg-zinc-100"}`}
						>
							💳 Pricing Plans
						</button>
						<button
							onClick={() => setActiveTab("CLIENTS")}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "CLIENTS" ? "bg-[#404d85] text-white shadow-md" : "text-zinc-600 hover:bg-zinc-100"}`}
						>
							🏢 Clients (Tenants)
						</button>
						<button
							onClick={() => setActiveTab("ORDER_HISTORY")}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "ORDER_HISTORY" ? "bg-[#404d85] text-white shadow-md" : "text-zinc-600 hover:bg-zinc-100"}`}
						>
							🧾 Billing History
						</button>
					</div>
				</div>

				{false ? (
					<div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
						You don&apos;t have admin privileges to manage the platform.
					</div>
				) : activeTab === "MARKETPLACE" ? (
					<div className="space-y-6">
						{/* TOP ENGINE STATUS BANNER */}
						<div className="bg-gradient-to-r from-[#404d85] via-[#323d6a] to-[#252f5a] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
							<div>
								<div className="flex items-center gap-2">
									<span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300">
										● MedusaJS v2 Engine Active
									</span>
									<span className="rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-bold text-blue-200">
										Multi-Storefront Enabled
									</span>
								</div>
								<h2 className="text-2xl font-black mt-2">🛍️ Multi-Vendor Marketplace Control Center</h2>
								<p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
									Central admin hub to manage registered seller stores, configure platform commission rates, oversee vendor payouts, and monitor live storefront activity.
								</p>
							</div>
							<div className="flex flex-wrap gap-3">
								<a href="/storefront" target="_blank" className="rounded-xl bg-white px-5 py-3 text-xs font-bold text-[#404d85] shadow-lg hover:bg-blue-50 transition flex items-center gap-2">
									<span>🌐 Launch Storefront</span>
									<span>↗</span>
								</a>
								<button onClick={() => setActiveTab("GLOBAL_CATALOG")} className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/20 transition">
									📦 Global Catalog
								</button>
							</div>
						</div>

						{/* MARKETPLACE METRICS CARDS */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-1">
								<p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Active Vendor Stores</p>
								<p className="text-2xl font-black text-zinc-900">4 Stores</p>
								<p className="text-[11px] font-semibold text-emerald-600">✓ Verified Seller Accounts</p>
							</div>
							<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-1">
								<p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Products Listed</p>
								<p className="text-2xl font-black text-[#6678c1]">42 Products</p>
								<p className="text-[11px] text-zinc-500">Across 6 Categories</p>
							</div>
							<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-1">
								<p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Platform Commission Fee</p>
								<p className="text-2xl font-black text-emerald-600">8.0%</p>
								<p className="text-[11px] text-zinc-500">Stripe Connect Automatic Split</p>
							</div>
							<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-1">
								<p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Marketplace Volume (GMV)</p>
								<p className="text-2xl font-black text-zinc-900">$142,100.00</p>
								<p className="text-[11px] text-emerald-600 font-bold">+$11,368.00 Net Revenue</p>
							</div>
						</div>

						{/* VENDOR STORES MANAGEMENT TABLE */}
						<div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm space-y-4 p-6">
							<div className="flex justify-between items-center">
								<div>
									<h3 className="text-base font-extrabold text-zinc-900">🏬 Registered Seller Stores & Vendor Management</h3>
									<p className="text-xs text-zinc-500">Manage seller accounts, commission overrides, and individual brand storefront URLs.</p>
								</div>
								<a href="/storefront" target="_blank" className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]">
									+ Register Seller Store
								</a>
							</div>

							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
										<tr>
											<th className="p-3 font-bold">Vendor Store</th>
											<th className="p-3 font-bold">Category</th>
											<th className="p-3 font-bold">Seller Email</th>
											<th className="p-3 font-bold">Location</th>
											<th className="p-3 font-bold">Commission</th>
											<th className="p-3 font-bold">KYC Status</th>
											<th className="p-3 font-bold text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-200">
										<tr className="hover:bg-zinc-50">
											<td className="p-3 font-bold text-zinc-900">
												<div className="flex items-center gap-2">
													<span className="text-lg">🌸</span>
													<span>Glow Beauty Organics</span>
												</div>
											</td>
											<td className="p-3"><span className="rounded-full bg-pink-100 px-2.5 py-1 text-[10px] font-bold text-pink-800">Beauty & Skincare</span></td>
											<td className="p-3 text-zinc-600">care@glowbeautyorganics.com</td>
											<td className="p-3 font-medium">Paris, France 🇫🇷</td>
											<td className="p-3 font-bold text-emerald-600">7.5%</td>
											<td className="p-3"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">✓ Verified (Stripe)</span></td>
											<td className="p-3 text-right">
												<a href="/storefront?vendor=v-glow-beauty" target="_blank" className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-800 hover:bg-zinc-50">View Storefront ↗</a>
											</td>
										</tr>
										<tr className="hover:bg-zinc-50">
											<td className="p-3 font-bold text-zinc-900">
												<div className="flex items-center gap-2">
													<span className="text-lg">☁️</span>
													<span>Acme Cloud Infrastructure</span>
												</div>
											</td>
											<td className="p-3"><span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800">Cloud & Hosting</span></td>
											<td className="p-3 text-zinc-600">vendors@acmecloud.io</td>
											<td className="p-3 font-medium">Munich, Germany 🇩🇪</td>
											<td className="p-3 font-bold text-emerald-600">8.5%</td>
											<td className="p-3"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">✓ Verified (Stripe)</span></td>
											<td className="p-3 text-right">
												<a href="/storefront?vendor=v-acme" target="_blank" className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-800 hover:bg-zinc-50">View Storefront ↗</a>
											</td>
										</tr>
										<tr className="hover:bg-zinc-50">
											<td className="p-3 font-bold text-zinc-900">
												<div className="flex items-center gap-2">
													<span className="text-lg">🛡️</span>
													<span>CyberShield Security Systems</span>
												</div>
											</td>
											<td className="p-3"><span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-800">Software Licenses</span></td>
											<td className="p-3 text-zinc-600">partners@cybershield.tech</td>
											<td className="p-3 font-medium">Frankfurt, Germany 🇩🇪</td>
											<td className="p-3 font-bold text-emerald-600">8.5%</td>
											<td className="p-3"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">✓ Verified (Stripe)</span></td>
											<td className="p-3 text-right">
												<a href="/storefront?vendor=v-cybershield" target="_blank" className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-800 hover:bg-zinc-50">View Storefront ↗</a>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				) : activeTab === "GLOBAL_CATALOG" ? (
					<div className="space-y-8">
						{/* TOP ACTION BAR */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
							<div>
								<h2 className="text-xl font-extrabold text-zinc-900">🛍️ Global E-Commerce Catalog & Categories</h2>
								<p className="text-xs text-zinc-500 mt-1">Manage global product categories, platform inventory, and seller listings across all storefronts.</p>
							</div>
							<div className="flex gap-3">
								<button onClick={() => setShowAddCatModal(true)} className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-800 shadow-sm hover:bg-zinc-50">+ Add Category</button>
								<button onClick={() => setShowAddProdModal(true)} className="rounded-xl bg-[#404d85] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]">+ Add Product</button>
							</div>
						</div>

						{/* CATEGORIES SECTION */}
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">📦 Product Categories ({categoriesState.length})</h3>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
								{categoriesState.map((cat) => (
									<div key={cat.id} className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition">
										<div className="flex items-center justify-between">
											<span className="text-3xl p-2 bg-zinc-100 rounded-xl">{cat.icon}</span>
											<div className="flex gap-1">
												<button onClick={() => setEditingCategory(cat)} className="p-1 text-xs text-zinc-500 hover:text-zinc-900">✏️</button>
												<button onClick={() => setCategoriesState((prev) => prev.filter((c) => c.id !== cat.id))} className="p-1 text-xs text-rose-500 hover:text-rose-700">🗑️</button>
											</div>
										</div>
										<div>
											<h4 className="font-bold text-sm text-zinc-900">{cat.name}</h4>
											<p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{cat.description}</p>
										</div>
										<div className="pt-2 border-t border-zinc-100 flex justify-between items-center text-[11px] font-bold text-[#6678c1]">
											<span>{catalogProductsState.filter((p) => p.category === cat.name).length} Products Listed</span>
											<span className="text-zinc-400">/{cat.slug}</span>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* GLOBAL PRODUCTS CATALOG TABLE */}
						<div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm space-y-4 p-6">
							<div className="flex justify-between items-center">
								<h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">🛒 Live Products Catalog ({catalogProductsState.length})</h3>
								<button onClick={() => setShowAddProdModal(true)} className="text-xs font-bold text-[#6678c1] hover:underline">+ Upload New Product</button>
							</div>

							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
										<tr>
											<th className="p-3 font-bold">Product</th>
											<th className="p-3 font-bold">Category</th>
											<th className="p-3 font-bold">Vendor Store</th>
											<th className="p-3 font-bold">Price ($)</th>
											<th className="p-3 font-bold">Stock Qty</th>
											<th className="p-3 font-bold">SKU</th>
											<th className="p-3 font-bold text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-200">
										{catalogProductsState.map((prod) => (
											<tr key={prod.id} className="hover:bg-zinc-50">
												<td className="p-3">
													<div className="flex items-center gap-3">
														<img src={prod.image} alt={prod.title} className="w-10 h-10 rounded-xl object-cover border border-zinc-200" />
														<span className="font-bold text-zinc-900">{prod.title}</span>
													</div>
												</td>
												<td className="p-3"><span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800">{prod.category}</span></td>
												<td className="p-3 font-semibold text-[#6678c1]">{prod.vendorName}</td>
												<td className="p-3 font-black text-emerald-600">${prod.price.toFixed(2)}</td>
												<td className="p-3 font-bold text-zinc-700">{prod.stock} units</td>
												<td className="p-3 font-mono text-[11px] text-zinc-500">{prod.sku}</td>
												<td className="p-3 text-right">
													<button onClick={() => setCatalogProductsState((prev) => prev.filter((p) => p.id !== prod.id))} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100">Delete</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				) : activeTab === "ANALYTICS" ? (
					<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
						<div className="mb-4 flex items-center justify-between gap-3">
							<h2 className="text-lg font-semibold">Platform Analytics</h2>
							<button
								onClick={() => void fetchAnalytics()}
								className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
							>
								Refresh
							</button>
						</div>
						{loadingAnalytics ? (
							<p className="text-sm text-zinc-500">Loading analytics...</p>
						) : analytics ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<div className="rounded-xl border border-zinc-200 p-4">
									<p className="text-sm text-zinc-500">Total Organizations</p>
									<p className="text-2xl font-bold text-zinc-900">{analytics.totalOrganizations}</p>
								</div>
								<div className="rounded-xl border border-zinc-200 p-4">
									<p className="text-sm text-zinc-500">Total Users</p>
									<p className="text-2xl font-bold text-zinc-900">{analytics.totalUsers}</p>
								</div>
								<div className="rounded-xl border border-zinc-200 p-4">
									<p className="text-sm text-zinc-500">Active Subscriptions</p>
									<p className="text-2xl font-bold text-emerald-600">{analytics.activeSubscriptions}</p>
								</div>
								<div className="rounded-xl border border-zinc-200 p-4">
									<p className="text-sm text-zinc-500">Total CRM Deals</p>
									<p className="text-2xl font-bold text-zinc-900">{analytics.totalDeals}</p>
								</div>
								<div className="rounded-xl border border-zinc-200 p-4">
									<p className="text-sm text-zinc-500">Total Employees Managed</p>
									<p className="text-2xl font-bold text-zinc-900">{analytics.totalEmployees}</p>
								</div>
								<div className="rounded-xl border border-zinc-200 p-4">
									<p className="text-sm text-zinc-500">Total Products Inventoried</p>
									<p className="text-2xl font-bold text-zinc-900">{analytics.totalProducts}</p>
								</div>
								<div className="rounded-xl border border-zinc-200 p-4 md:col-span-2 lg:col-span-1">
									<p className="text-sm text-zinc-500">Total Files Shared</p>
									<p className="text-2xl font-bold text-zinc-900">{analytics.totalFiles}</p>
								</div>
							</div>
						) : (
							<p className="text-sm text-zinc-500">Unable to load analytics.</p>
						)}
					</div>
				) : activeTab === "PLANS" ? (
					<>
						<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
							<div className="flex items-center justify-between gap-3">
								<h2 className="text-lg font-semibold">{editingPlanId ? "Edit Plan" : "Create Plan"}</h2>
								{editingPlanId && (
									<button
										onClick={resetForm}
										className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
									>
										Cancel Edit
									</button>
								)}
							</div>

							<form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
								<input
									required
									value={form.name}
									onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
									placeholder="Plan Name"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
								/>
								<input
									required
									type="number"
									step="0.01"
									min="0.01"
									value={form.price}
									onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
									placeholder="Price"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
								/>
								<input
									value={form.description}
									onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
									placeholder="Description"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 md:col-span-2"
								/>
								<textarea
									value={form.featuresText}
									onChange={(event) => setForm((prev) => ({ ...prev, featuresText: event.target.value }))}
									placeholder={"Feature pointers (one per line)\nExample:\nGST filing automation\nUnlimited invoices\nPriority support"}
									rows={5}
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 md:col-span-2"
								/>
								<input
									required
									maxLength={3}
									value={form.currency}
									onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
									placeholder="Currency (USD)"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase outline-none focus:border-zinc-900"
								/>
								<select
									required
									value={form.interval}
									onChange={(event) => setForm((prev) => ({ ...prev, interval: event.target.value }))}
									className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
								>
									<option value="monthly">Monthly</option>
									<option value="yearly">Yearly</option>
								</select>
								<input
									required
									type="number"
									min="1"
									value={form.userLimit}
									onChange={(event) => setForm((prev) => ({ ...prev, userLimit: event.target.value }))}
									placeholder="Team User Limit"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
								/>
								<input
									required
									type="number"
									min="1"
									value={form.storageLimit}
									onChange={(event) => setForm((prev) => ({ ...prev, storageLimit: event.target.value }))}
									placeholder="Cloud Storage Limit (GB)"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
								/>

								<p className="text-xs text-zinc-500 md:col-span-2">
									Example: if values are 5 and 5, it means max 5 users and 5 GB storage for that plan.
								</p>

								<div className="md:col-span-2">
									<button
										type="submit"
										disabled={submitting}
										className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-500"
									>
										{submitting ? "Saving..." : editingPlanId ? "Update Plan" : "Create Plan"}
									</button>
								</div>
							</form>

							{message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
							{error && <p className="mt-3 text-sm text-red-600">{error}</p>}
						</div>

						<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
							<div className="mb-4 flex items-center justify-between gap-3">
								<h2 className="text-lg font-semibold">Subscription Plans</h2>
								<button
									onClick={() => void fetchPlans()}
									className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
								>
									Refresh
								</button>
							</div>

							{loading ? (
								<p className="text-sm text-zinc-500">Loading plans...</p>
							) : plans.length === 0 ? (
								<p className="text-sm text-zinc-500">No plans found. Create your first plan above.</p>
							) : (
								<div className="space-y-3">
									{plans.map((plan) => (
										<div key={plan.id} className="rounded-xl border border-zinc-200 p-4">
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div>
													<p className="text-base font-semibold text-zinc-900">{plan.name}</p>
													<p className="text-sm text-zinc-600">{plan.description || "No description"}</p>
												</div>
												<div className="text-right">
													<p className="text-sm font-semibold text-zinc-900">{plan.currency} {plan.price}/{plan.interval}</p>
													<p className="text-xs text-zinc-500">Users: {plan.userLimit} · Storage: {plan.storageLimit}GB · {plan.features?.length ?? 0} pointers</p>
												</div>
											</div>
											{plan.features?.length > 0 && (
												<ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-zinc-600">
													{plan.features.slice(0, 6).map((feature) => (
														<li key={`${plan.id}-${feature}`}>{feature}</li>
													))}
													{plan.features.length > 6 && <li>+{plan.features.length - 6} more</li>}
												</ul>
											)}
											<div className="mt-3 flex gap-2">
												<button
													onClick={() => startEdit(plan)}
													className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
												>
													Edit
												</button>
												<button
													onClick={() => void handleDelete(plan.id)}
													className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
												>
													Delete
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</>
				) : activeTab === "CLIENTS" ? (
					<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
						<div className="mb-4 flex items-center justify-between gap-3">
							<h2 className="text-lg font-semibold">Client Organizations</h2>
							<button
								onClick={() => void fetchOrganizations()}
								className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
							>
								Refresh
							</button>
						</div>

						{loadingOrgs ? (
							<p className="text-sm text-zinc-500">Loading clients...</p>
						) : organizations.length === 0 ? (
							<p className="text-sm text-zinc-500">No organizations registered yet.</p>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm text-zinc-600">
									<thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
										<tr>
											<th className="px-4 py-3 font-medium">Organization</th>
											<th className="px-4 py-3 font-medium">Users</th>
											<th className="px-4 py-3 font-medium">Active Plan</th>
											<th className="px-4 py-3 font-medium">Status</th>
											<th className="px-4 py-3 font-medium text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-200">
										{organizations.map((org) => {
											const activeSub = org.subscriptions?.find((sub) => sub.status !== "CANCELED");
											const isSuspended = activeSub?.status === "SUSPENDED";
											return (
												<tr key={org.id} className="hover:bg-zinc-50">
													<td className="px-4 py-3">
														<p className="font-semibold text-zinc-900">{org.name}</p>
														<p className="text-xs text-zinc-500">Joined {new Date(org.createdAt).toLocaleDateString()}</p>
													</td>
													<td className="px-4 py-3">
														{org._count?.users || 0}
													</td>
													<td className="px-4 py-3">
														{activeSub ? activeSub.plan.name : "None"}
													</td>
													<td className="px-4 py-3">
														{isSuspended ? (
															<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Suspended</span>
														) : (
															<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
														)}
													</td>
													<td className="px-4 py-3 text-right">
														<div className="flex justify-end gap-2">
															<button
																onClick={() => toggleOrganizationStatus(org.id, isSuspended)}
																className={`rounded-lg border px-3 py-1 text-xs font-medium ${isSuspended ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "border-red-300 text-red-700 hover:bg-red-50"}`}
															>
																{isSuspended ? "Activate" : "Suspend"}
															</button>
															<button
																onClick={() => alert("Impersonation feature coming soon. Support access will be logged securely.")}
																className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
															>
																Impersonate
															</button>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				) : activeTab === "ORDER_HISTORY" ? (
					<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
						<div className="mb-4 flex items-center justify-between gap-3">
							<h2 className="text-lg font-semibold">Global Order History</h2>
							<button
								onClick={() => void fetchOrderHistory()}
								className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
							>
								Refresh
							</button>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full min-w-[600px] text-left text-sm">
								<thead className="border-b border-zinc-200 text-xs font-semibold text-zinc-500">
									<tr>
										<th className="pb-3 pr-4 uppercase">Date</th>
										<th className="pb-3 pr-4 uppercase">Client</th>
										<th className="pb-3 pr-4 uppercase">Plan</th>
										<th className="pb-3 pr-4 uppercase">Amount</th>
										<th className="pb-3 pr-4 uppercase">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-100">
									{loadingOrders ? (
										<tr>
											<td colSpan={5} className="py-4 text-center text-zinc-500">Loading order history...</td>
										</tr>
									) : orderHistory.length > 0 ? (
										orderHistory.map((order) => (
											<tr key={order.id} className="group transition-colors hover:bg-zinc-50/50">
												<td className="py-3 pr-4 text-zinc-600">{new Date(order.paidAt).toLocaleDateString()}</td>
												<td className="py-3 pr-4 font-medium text-zinc-900">{order.subscription.organization.name}</td>
												<td className="py-3 pr-4 text-zinc-600">{order.subscription.plan.name}</td>
												<td className="py-3 pr-4 font-medium text-zinc-900">{order.amount} {order.currency}</td>
												<td className="py-3 pr-4">
													<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${order.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
														{order.status}
													</span>
												</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan={5} className="py-4 text-center text-zinc-500">No order history available.</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				) : null}
			</div>
		</WorkspaceShell>
	);
}
