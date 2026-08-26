"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

type MercurVendor = {
	id: string;
	name: string;
	ownerEmail: string;
	category: string;
	rating: number;
	reviewsCount: number;
	totalProducts: number;
	totalSalesVolume: number;
	commissionRate: number;
	stripeConnectId: string;
	payoutStatus: "Connected (Active)" | "Pending Onboarding" | "Restricted";
	kycVerified: boolean;
	joinedDate: string;
};

type MercurProduct = {
	id: string;
	sku: string;
	title: string;
	vendorId: string;
	vendorName: string;
	category: string;
	price: number;
	wholesaleB2bPrice?: number;
	sellerDiscountOffer?: string;
	stockQty: number;
	commissionRate: number;
	description: string;
	rating: number;
};

type MercurCartItem = {
	product: MercurProduct;
	quantity: number;
};

export default function StorefrontPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading Mercur Storefront...</div>}>
			<StorefrontContent />
		</Suspense>
	);
}

function StorefrontContent() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"storefront" | "vendors" | "vendor-login" | "cart" | "orders">("storefront");
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("All");
	const [cart, setCart] = useState<MercurCartItem[]>([]);
	const [showCartDrawer, setShowCartDrawer] = useState(false);

	// Vendor Login & Onboarding Modal/Form State
	const [showVendorAuthModal, setShowVendorAuthModal] = useState(false);
	const [authMode, setAuthMode] = useState<"login" | "register">("login");
	const [vendorEmail, setVendorEmail] = useState("");
	const [vendorPassword, setVendorPassword] = useState("");
	const [vendorName, setVendorName] = useState("");
	const [vendorCategory, setVendorCategory] = useState("Cloud Infrastructure & Hosting");
	const [loggedInVendor, setLoggedInVendor] = useState<MercurVendor | null>(null);
	const [authMessage, setAuthMessage] = useState<string | null>(null);

	// Multi-Vendor Dataset
	const [vendors, setVendors] = useState<MercurVendor[]>([
		{
			id: "v-mercur-101",
			name: "Acme Cloud Infrastructure Solutions",
			ownerEmail: "vendors@acmecloud.io",
			category: "Cloud Infrastructure & Hosting",
			rating: 4.9,
			reviewsCount: 38,
			totalProducts: 14,
			totalSalesVolume: 48500.00,
			commissionRate: 8.5,
			stripeConnectId: "acct_1M29X04J0189X",
			payoutStatus: "Connected (Active)",
			kycVerified: true,
			joinedDate: "2026-01-10",
		},
		{
			id: "v-mercur-102",
			name: "CyberShield Security Systems",
			ownerEmail: "partners@cybershield.tech",
			category: "Software & Enterprise Licenses",
			rating: 4.8,
			reviewsCount: 24,
			totalProducts: 8,
			totalSalesVolume: 29400.00,
			commissionRate: 8.5,
			stripeConnectId: "acct_1N49Y09K0912Z",
			payoutStatus: "Connected (Active)",
			kycVerified: true,
			joinedDate: "2026-02-01",
		},
		{
			id: "v-mercur-103",
			name: "NextGen IoT Hardware Corp",
			ownerEmail: "sales@nextgeniot.com",
			category: "Hardware & IoT Devices",
			rating: 4.7,
			reviewsCount: 52,
			totalProducts: 22,
			totalSalesVolume: 61200.00,
			commissionRate: 5.0,
			stripeConnectId: "acct_1P89Z01L9901M",
			payoutStatus: "Connected (Active)",
			kycVerified: true,
			joinedDate: "2026-03-15",
		},
	]);

	const [products, setProducts] = useState<MercurProduct[]>([
		{
			id: "prod-m-1",
			sku: "SKU-MER-CLOUD-01",
			title: "Dedicated Kubernetes High-Availability Cluster",
			vendorId: "v-mercur-101",
			vendorName: "Acme Cloud Infrastructure Solutions",
			category: "Cloud Infrastructure & Hosting",
			price: 1499.00,
			wholesaleB2bPrice: 1299.00,
			sellerDiscountOffer: "Save $200 on B2B Annual Contract",
			stockQty: 50,
			commissionRate: 8.5,
			description: "Fully managed, multi-region Kubernetes control plane with 99.99% uptime SLA.",
			rating: 4.9,
		},
		{
			id: "prod-m-2",
			sku: "SKU-MER-SEC-02",
			title: "Zero-Trust Enterprise IAM & SSO Platform License",
			vendorId: "v-mercur-102",
			vendorName: "CyberShield Security Systems",
			category: "Software & Enterprise Licenses",
			price: 899.00,
			wholesaleB2bPrice: 750.00,
			sellerDiscountOffer: "15% Off for 50+ Seat Licenses",
			stockQty: 200,
			commissionRate: 8.5,
			description: "Unlimited OAuth2, SAML2, and FIDO2 multi-factor authentication security suite.",
			rating: 4.8,
		},
		{
			id: "prod-m-3",
			sku: "SKU-MER-HW-03",
			title: "Industrial IoT Edge Controller Gateway Device",
			vendorId: "v-mercur-103",
			vendorName: "NextGen IoT Hardware Corp",
			category: "Hardware & IoT Devices",
			price: 450.00,
			wholesaleB2bPrice: 380.00,
			sellerDiscountOffer: "Wholesale Tier: $380 for 10+ Units",
			stockQty: 120,
			commissionRate: 5.0,
			description: "Ruggedized ARM Cortex industrial IoT gateway with Modbus & MQTT protocols.",
			rating: 4.7,
		},
	]);

	// Cart operations
	const addToCart = (product: MercurProduct) => {
		setCart((prev) => {
			const existing = prev.find((i) => i.product.id === product.id);
			if (existing) {
				return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
			}
			return [...prev, { product, quantity: 1 }];
		});
		setShowCartDrawer(true);
	};

	const removeFromCart = (id: string) => {
		setCart((prev) => prev.filter((i) => i.product.id !== id));
	};

	// Vendor Login / Register Submission
	const handleVendorAuthSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setAuthMessage(null);

		if (authMode === "login") {
			const existing = vendors.find((v) => v.ownerEmail.toLowerCase() === vendorEmail.toLowerCase());
			if (existing) {
				setLoggedInVendor(existing);
				setAuthMessage(`✅ Vendor Sign In Successful! Welcome back, ${existing.name}.`);
				setTimeout(() => setShowVendorAuthModal(false), 1200);
			} else {
				// Auto-create session if new email
				const newVendor: MercurVendor = {
					id: `v-mercur-${Date.now()}`,
					name: vendorName || vendorEmail.split("@")[0] + " Store",
					ownerEmail: vendorEmail,
					category: vendorCategory,
					rating: 5.0,
					reviewsCount: 0,
					totalProducts: 0,
					totalSalesVolume: 0,
					commissionRate: 8.5,
					stripeConnectId: `acct_${Date.now().toString().slice(-8)}`,
					payoutStatus: "Connected (Active)",
					kycVerified: true,
					joinedDate: new Date().toISOString().split("T")[0],
				};
				setVendors((prev) => [newVendor, ...prev]);
				setLoggedInVendor(newVendor);
				setAuthMessage(`✅ Logged in as Vendor: ${newVendor.name}`);
				setTimeout(() => setShowVendorAuthModal(false), 1200);
			}
		} else {
			if (!vendorName || !vendorEmail) return;
			const newVendor: MercurVendor = {
				id: `v-mercur-${Date.now()}`,
				name: vendorName,
				ownerEmail: vendorEmail,
				category: vendorCategory,
				rating: 5.0,
				reviewsCount: 0,
				totalProducts: 0,
				totalSalesVolume: 0,
				commissionRate: 8.5,
				stripeConnectId: `acct_${Date.now().toString().slice(-8)}`,
				payoutStatus: "Connected (Active)",
				kycVerified: true,
				joinedDate: new Date().toISOString().split("T")[0],
			};
			setVendors((prev) => [newVendor, ...prev]);
			setLoggedInVendor(newVendor);
			setAuthMessage(`✅ Vendor Account Created & Logged In! Welcome ${vendorName}.`);
			setTimeout(() => setShowVendorAuthModal(false), 1200);
		}
	};

	const filteredProducts = products.filter((p) => {
		const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
		const matchesSearch =
			!searchQuery ||
			p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.sku.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesCat && matchesSearch;
	});

	const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

	return (
		<WorkspaceShell>
			<div className="mt-5 mx-auto max-w-7xl space-y-6">
				{/* Top Storefront Navigation & Header Bar */}
				<header className="rounded-3xl border border-[#d9e2ef] bg-[#1f2430] p-6 text-white shadow-xl">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6678c1] text-2xl font-black shadow-inner">
								🛍️
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h1 className="text-xl font-black tracking-tight">MercurJS Open Storefront</h1>
									<span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/40 uppercase">
										HEADLESS COMMERCE ENGINE
									</span>
								</div>
								<p className="text-xs text-zinc-400">Multi-Vendor Marketplace • Medusa Core • B2B & B2C Catalog</p>
							</div>
						</div>

						{/* Search Bar */}
						<div className="w-full max-w-md">
							<div className="relative">
								<input
									type="text"
									placeholder="Search multi-vendor catalog, SKUs, or sellers..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 pl-10 text-xs font-semibold text-white placeholder-zinc-400 focus:border-[#6678c1] focus:outline-none"
								/>
								<span className="absolute left-3 top-2.5 text-sm text-zinc-400">🔍</span>
							</div>
						</div>

						{/* Vendor Login & Cart Action Buttons */}
						<div className="flex items-center gap-3">
							{loggedInVendor ? (
								<div className="flex items-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-300">
									<span>🏬 Seller: {loggedInVendor.name}</span>
									<button onClick={() => setLoggedInVendor(null)} className="ml-2 text-rose-400 hover:underline">Logout</button>
								</div>
							) : (
								<button
									onClick={() => {
										setAuthMode("login");
										setShowVendorAuthModal(true);
									}}
									className="rounded-2xl bg-[#6678c1] px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-[#404d85] transition"
								>
									🔑 Vendor Login / Sign Up
								</button>
							)}

							<button
								onClick={() => setShowCartDrawer(true)}
								className="relative rounded-2xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-700 transition"
							>
								🛒 Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
								{cart.length > 0 && (
									<span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
										{cart.length}
									</span>
								)}
							</button>

							<button
								onClick={() => router.push("/store?view=mercur")}
								className="rounded-2xl border border-[#6678c1] px-4 py-2.5 text-xs font-bold text-[#6678c1] bg-white hover:bg-[#6678c1] hover:text-white transition"
							>
								⚡ Full Mercur Suite →
							</button>
						</div>
					</div>

					{/* Category Tabs */}
					<div className="mt-6 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-4 text-xs font-bold">
						<span className="text-zinc-400 mr-2">Categories:</span>
						{["All", "Cloud Infrastructure & Hosting", "Software & Enterprise Licenses", "Hardware & IoT Devices"].map((cat) => (
							<button
								key={cat}
								onClick={() => setCategoryFilter(cat)}
								className={`rounded-xl px-3.5 py-1.5 transition ${
									categoryFilter === cat
										? "bg-[#6678c1] text-white shadow-sm"
										: "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700 hover:text-white"
								}`}
							>
								{cat}
							</button>
						))}
					</div>
				</header>

				{/* STOREFRONT PRODUCT GRID */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-extrabold text-[#1f2430]">
							📦 Multi-Vendor Product Catalog ({filteredProducts.length} Items)
						</h2>
						<span className="text-xs font-semibold text-[#5b6472]">
							Direct Seller Pricing & Wholesale Offers
						</span>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{filteredProducts.map((prod) => (
							<div
								key={prod.id}
								className="rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#6678c1] hover:shadow-md transition"
							>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="rounded-full bg-[#f8faff] px-3 py-1 text-[10px] font-extrabold text-[#6678c1] border border-[#d9e2ef]">
											{prod.category}
										</span>
										<span className="text-xs font-bold text-amber-500">⭐ {prod.rating}</span>
									</div>

									<h3 className="text-base font-bold text-[#1f2430]">{prod.title}</h3>
									<p className="text-xs text-[#5b6472] leading-relaxed">{prod.description}</p>

									{prod.sellerDiscountOffer && (
										<div className="rounded-xl bg-amber-50 p-2.5 text-xs font-bold text-amber-900 border border-amber-200 flex items-center gap-1.5">
											<span>🏷️ Seller Offer:</span> {prod.sellerDiscountOffer}
										</div>
									)}

									<div className="rounded-2xl bg-[#f8faff] p-3 text-xs border border-[#d9e2ef] space-y-1">
										<div className="text-[#5b6472]">Vendor Seller: <strong className="text-[#1f2430]">{prod.vendorName}</strong></div>
										<div className="text-[#5b6472]">SKU Code: <span className="font-mono text-[#6678c1] font-bold">{prod.sku}</span></div>
										<div className="text-[#5b6472]">Available Stock: <strong className="text-emerald-600">{prod.stockQty} Units</strong></div>
									</div>
								</div>

								<div className="pt-3 border-t border-[#d9e2ef] flex items-center justify-between">
									<div>
										<div className="text-xl font-black text-[#1f2430]">${prod.price.toFixed(2)}</div>
										{prod.wholesaleB2bPrice && (
											<div className="text-[11px] font-bold text-emerald-600">
												B2B Wholesale: ${prod.wholesaleB2bPrice.toFixed(2)}
											</div>
										)}
									</div>

									<button
										onClick={() => addToCart(prod)}
										className="rounded-xl bg-[#6678c1] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#404d85] transition"
									>
										+ Add to Cart
									</button>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* VENDORS DIRECTORY PREVIEW */}
				<div className="rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-base font-bold text-[#1f2430]">🏪 Verified Marketplace Vendors & Sellers</h3>
							<p className="text-xs text-[#5b6472]">Top active sellers operating on the MercurJS platform</p>
						</div>
						<button
							onClick={() => {
								setAuthMode("register");
								setShowVendorAuthModal(true);
							}}
							className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
						>
							+ Register as Vendor Seller
						</button>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						{vendors.map((v) => (
							<div key={v.id} className="rounded-2xl border border-[#d9e2ef] p-4 bg-[#f8faff] space-y-2">
								<div className="flex justify-between items-start">
									<h4 className="text-xs font-bold text-[#1f2430]">{v.name}</h4>
									<span className="text-xs font-bold text-amber-500">⭐ {v.rating}</span>
								</div>
								<div className="text-[11px] text-[#5b6472]">{v.category}</div>
								<div className="text-[11px] text-[#6678c1] font-mono">Stripe Connect: {v.stripeConnectId}</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* VENDOR LOGIN / SIGN UP MODAL */}
			{showVendorAuthModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-md rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
						<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
							<h3 className="text-base font-bold text-[#1f2430]">
								{authMode === "login" ? "🔑 Vendor / Seller Sign In" : "📝 Register Vendor Account"}
							</h3>
							<button onClick={() => setShowVendorAuthModal(false)} className="text-sm font-bold text-[#5b6472]">✕</button>
						</div>

						<div className="flex rounded-xl bg-[#f8faff] p-1 border border-[#d9e2ef] text-xs font-bold">
							<button
								onClick={() => setAuthMode("login")}
								className={`flex-1 rounded-lg py-1.5 transition ${authMode === "login" ? "bg-[#6678c1] text-white" : "text-[#5b6472]"}`}
							>
								Vendor Login
							</button>
							<button
								onClick={() => setAuthMode("register")}
								className={`flex-1 rounded-lg py-1.5 transition ${authMode === "register" ? "bg-[#6678c1] text-white" : "text-[#5b6472]"}`}
							>
								New Vendor Sign Up
							</button>
						</div>

						<form onSubmit={handleVendorAuthSubmit} className="space-y-3 text-xs">
							{authMode === "register" && (
								<div>
									<label className="block font-semibold text-[#5b6472]">Company / Store Name *</label>
									<input
										type="text"
										placeholder="e.g. Apex Cloud Solutions"
										value={vendorName}
										onChange={(e) => setVendorName(e.target.value)}
										className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-semibold"
										required
									/>
								</div>
							)}

							<div>
								<label className="block font-semibold text-[#5b6472]">Vendor Email Address *</label>
								<input
									type="email"
									placeholder="vendors@company.com"
									value={vendorEmail}
									onChange={(e) => setVendorEmail(e.target.value)}
									className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-semibold"
									required
								/>
							</div>

							<div>
								<label className="block font-semibold text-[#5b6472]">Password *</label>
								<input
									type="password"
									placeholder="••••••••••••"
									value={vendorPassword}
									onChange={(e) => setVendorPassword(e.target.value)}
									className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-semibold"
									required
								/>
							</div>

							{authMode === "register" && (
								<div>
									<label className="block font-semibold text-[#5b6472]">Primary Category</label>
									<select
										value={vendorCategory}
										onChange={(e) => setVendorCategory(e.target.value)}
										className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-semibold bg-white"
									>
										<option value="Cloud Infrastructure & Hosting">Cloud Infrastructure & Hosting</option>
										<option value="Software & Enterprise Licenses">Software & Enterprise Licenses</option>
										<option value="Hardware & IoT Devices">Hardware & IoT Devices</option>
									</select>
								</div>
							)}

							{authMessage && (
								<div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-emerald-800 text-xs">
									{authMessage}
								</div>
							)}

							<div className="pt-2 flex justify-end gap-2 border-t border-[#d9e2ef]">
								<button type="button" onClick={() => setShowVendorAuthModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2">
									Cancel
								</button>
								<button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 font-bold text-white shadow-md">
									{authMode === "login" ? "Sign In to Seller Portal" : "Complete Registration"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</WorkspaceShell>
	);
}
