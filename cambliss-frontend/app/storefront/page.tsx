"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

type MercurVendor = {
	id: string;
	name: string;
	logo: string;
	ownerEmail: string;
	category: string;
	rating: number;
	reviewsCount: number;
	totalProducts: number;
	totalSalesVolume: number;
	commissionRate: number;
	stripeConnectId: string;
	payoutStatus: "Connected (Active)" | "Pending Onboarding";
	kycVerified: boolean;
	location: string;
	joinedDate: string;
	description: string;
};

type MercurProduct = {
	id: string;
	sku: string;
	title: string;
	image: string;
	vendorId: string;
	vendorName: string;
	vendorLogo: string;
	category: string;
	price: number;
	originalPrice?: number;
	wholesaleB2bPrice?: number;
	sellerOfferBadge?: string;
	stockQty: number;
	rating: number;
	reviewsCount: number;
	description: string;
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
	const searchParams = useSearchParams();
	const initialVendorFilter = searchParams.get("vendor") || "All";

	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("All");
	const [selectedVendorFilter, setSelectedVendorFilter] = useState(initialVendorFilter);
	const [selectedRegion, setSelectedRegion] = useState("🇩🇪 Germany / EUR (€)");
	const [priceRange, setPriceRange] = useState<number>(2000);
	const [onlyInStock, setOnlyInStock] = useState(false);

	const [cart, setCart] = useState<MercurCartItem[]>([]);
	const [showCartDrawer, setShowCartDrawer] = useState(false);
	const [activeVendorModal, setActiveVendorModal] = useState<MercurVendor | null>(null);

	// Vendor Auth & Portal State
	const [showVendorAuthModal, setShowVendorAuthModal] = useState(false);
	const [authMode, setAuthMode] = useState<"login" | "register">("login");
	const [vendorEmail, setVendorEmail] = useState("");
	const [vendorPassword, setVendorPassword] = useState("");
	const [vendorName, setVendorName] = useState("");
	const [vendorCategory, setVendorCategory] = useState("Cloud Infrastructure & Hosting");
	const [loggedInVendor, setLoggedInVendor] = useState<MercurVendor | null>(null);
	const [authMsg, setAuthMsg] = useState<string | null>(null);

	// Initial Official Mercur Multi-Vendor Dataset
	const [vendors, setVendors] = useState<MercurVendor[]>([
		{
			id: "v-glow-beauty",
			name: "Glow Beauty Organics 🌸",
			logo: "🌸",
			ownerEmail: "care@glowbeautyorganics.com",
			category: "Beauty, Cosmetics & Skincare",
			rating: 5.0,
			reviewsCount: 89,
			totalProducts: 18,
			totalSalesVolume: 34200.00,
			commissionRate: 7.5,
			stripeConnectId: "acct_1GLOW90X8812Y",
			payoutStatus: "Connected (Active)",
			kycVerified: true,
			location: "Paris, France 🇫🇷",
			joinedDate: "2026-02-14",
			description: "100% Organic botanical skincare, vegan hyaluronic serums, and dermatologist-tested cruelty-free beauty products."
		},
		{
			id: "v-acme",
			name: "Acme Cloud Infrastructure Solutions",
			logo: "☁️",
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
			location: "Munich, Germany 🇩🇪",
			joinedDate: "2026-01-10",
			description: "Enterprise Kubernetes hosting, high-availability dedicated servers, and global CDN infrastructure."
		},
		{
			id: "v-[#6678c1]",
			name: "CyberShield Security Systems",
			logo: "🛡️",
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
			location: "Frankfurt, Germany 🇩🇪",
			joinedDate: "2026-02-01",
			description: "Zero-trust identity management, SAML2/OAuth2 authentication engines, and SOC2 compliance tools."
		},
		{
			id: "v-nextgen",
			name: "NextGen IoT Hardware Corp",
			logo: "⚡",
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
			location: "Berlin, Germany 🇩🇪",
			joinedDate: "2026-03-15",
			description: "Industrial ARM Cortex edge gateway controllers, Modbus/RS485 sensor arrays, and IoT hardware."
		},
	]);

	const [products, setProducts] = useState<MercurProduct[]>([
		{
			id: "prod-beauty-1",
			sku: "SKU-BEAUTY-ROSE-01",
			title: "Hydrating Organic Rose & Hyaluronic Acid Serum",
			image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
			vendorId: "v-glow-beauty",
			vendorName: "Glow Beauty Organics 🌸",
			vendorLogo: "🌸",
			category: "Beauty, Cosmetics & Skincare",
			price: 48.00,
			originalPrice: 65.00,
			wholesaleB2bPrice: 28.00,
			sellerOfferBadge: "🌸 Best Seller",
			stockQty: 140,
			rating: 5.0,
			reviewsCount: 64,
			description: "Infused with pure Damask rose water and triple-molecular hyaluronic acid for 24-hour intense hydration and glowing skin."
		},
		{
			id: "prod-beauty-2",
			sku: "SKU-BEAUTY-CREAM-02",
			title: "Botanical Restorative Night Cream",
			image: "https://images.unsplash.com/photo-1608248597261-e4d09165811a?auto=format&fit=crop&w=600&q=80",
			vendorId: "v-glow-beauty",
			vendorName: "Glow Beauty Organics 🌸",
			vendorLogo: "🌸",
			category: "Beauty, Cosmetics & Skincare",
			price: 54.00,
			originalPrice: 72.00,
			wholesaleB2bPrice: 32.00,
			sellerOfferBadge: "🌿 100% Vegan",
			stockQty: 95,
			rating: 4.9,
			reviewsCount: 42,
			description: "Overnight peptide moisturizer enriched with cold-pressed rosehip oil, niacinamide, and organic shea butter."
		},
		{
			id: "prod-m-1",
			sku: "SKU-MER-CLOUD-01",
			title: "Dedicated Kubernetes High-Availability Cluster",
			image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
			vendorId: "v-acme",
			vendorName: "Acme Cloud Infrastructure Solutions",
			vendorLogo: "☁️",
			category: "Cloud Infrastructure & Hosting",
			price: 1499.00,
			originalPrice: 1699.00,
			wholesaleB2bPrice: 1299.00,
			sellerOfferBadge: "Save €200 on Annual Contract",
			stockQty: 50,
			rating: 4.9,
			reviewsCount: 38,
			description: "Fully managed, multi-region Kubernetes control plane with 99.99% uptime SLA and 24/7 DevOps support."
		},
		{
			id: "prod-m-2",
			sku: "SKU-MER-SEC-02",
			title: "Zero-Trust Enterprise IAM & SSO Platform License",
			image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
			vendorId: "v-[#6678c1]",
			vendorName: "CyberShield Security Systems",
			vendorLogo: "🛡️",
			category: "Software & Enterprise Licenses",
			price: 899.00,
			originalPrice: 999.00,
			wholesaleB2bPrice: 750.00,
			sellerOfferBadge: "15% Off for 50+ Seat Licenses",
			stockQty: 200,
			rating: 4.8,
			reviewsCount: 24,
			description: "Unlimited OAuth2, SAML2, and FIDO2 multi-factor authentication security suite for enterprise organizations."
		},
		{
			id: "prod-m-3",
			sku: "SKU-MER-HW-03",
			title: "Industrial IoT Edge Controller Gateway Device",
			image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
			vendorId: "v-nextgen",
			vendorName: "NextGen IoT Hardware Corp",
			vendorLogo: "⚡",
			category: "Hardware & IoT Devices",
			price: 450.00,
			originalPrice: 499.00,
			wholesaleB2bPrice: 380.00,
			sellerOfferBadge: "Wholesale Tier: €380 for 10+ Units",
			stockQty: 120,
			rating: 4.7,
			reviewsCount: 52,
			description: "Ruggedized ARM Cortex industrial IoT gateway with dual Ethernet, Modbus & MQTT protocol translation."
		},
		{
			id: "prod-m-4",
			sku: "SKU-MER-CLOUD-04",
			title: "Global Edge Content Delivery Network (CDN) Hub",
			image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
			vendorId: "v-acme",
			vendorName: "Acme Cloud Infrastructure Solutions",
			vendorLogo: "☁️",
			category: "Cloud Infrastructure & Hosting",
			price: 650.00,
			originalPrice: 750.00,
			wholesaleB2bPrice: 550.00,
			sellerOfferBadge: "10TB Monthly Bandwidth Included",
			stockQty: 85,
			rating: 4.9,
			reviewsCount: 19,
			description: "Sub-10ms global edge caching with automatic DDoS mitigation and Web Application Firewall (WAF)."
		},
	]);

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

	const handleVendorAuthSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setAuthMsg(null);

		if (authMode === "login") {
			const existing = vendors.find((v) => v.ownerEmail.toLowerCase() === vendorEmail.toLowerCase());
			if (existing) {
				setLoggedInVendor(existing);
				setAuthMsg(`✅ Signed in as Vendor: ${existing.name}`);
				setTimeout(() => setShowVendorAuthModal(false), 1000);
			} else {
				const newV: MercurVendor = {
					id: `v-mercur-${Date.now()}`,
					name: vendorName || vendorEmail.split("@")[0] + " Store",
					logo: "🏪",
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
					location: "Berlin, Germany 🇩🇪",
					joinedDate: new Date().toISOString().split("T")[0],
					description: "New verified seller store on MercurJS platform.",
				};
				setVendors((prev) => [newV, ...prev]);
				setLoggedInVendor(newV);
				setAuthMsg(`✅ Signed in as Vendor: ${newV.name}`);
				setTimeout(() => setShowVendorAuthModal(false), 1000);
			}
		} else {
			if (!vendorName || !vendorEmail) return;
			const newV: MercurVendor = {
				id: `v-mercur-${Date.now()}`,
				name: vendorName,
				logo: "🏪",
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
				location: "Munich, Germany 🇩🇪",
				joinedDate: new Date().toISOString().split("T")[0],
				description: "Registered multi-vendor seller store.",
			};
			setVendors((prev) => [newV, ...prev]);
			setLoggedInVendor(newV);
			setAuthMsg(`✅ Vendor Registered & Logged In: ${vendorName}`);
			setTimeout(() => setShowVendorAuthModal(false), 1000);
		}
	};

	const filteredProducts = products.filter((p) => {
		const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
		const matchesVendor = selectedVendorFilter === "All" || p.vendorName === selectedVendorFilter;
		const matchesSearch =
			!searchQuery ||
			p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.sku.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesPrice = p.price <= priceRange;
		const matchesStock = !onlyInStock || p.stockQty > 0;
		return matchesCat && matchesVendor && matchesSearch && matchesPrice && matchesStock;
	});

	const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

	return (
		<WorkspaceShell>
			<div className="mt-4 mx-auto max-w-7xl space-y-6">
				{/* 1. TOP NOTICE ANNOUNCEMENT BAR (Official Mercur Style) */}
				<div className="rounded-2xl bg-gradient-to-r from-zinc-900 via-[#1f2430] to-zinc-900 p-3 text-center text-xs font-bold text-white shadow-md flex items-center justify-between px-6">
					<div className="flex items-center gap-2">
						<span className="rounded-full bg-[#6678c1] px-2 py-0.5 text-[10px] text-white">MERCUR DEMO</span>
						<span>Official B2C & B2B Open-Source Multi-Vendor Storefront</span>
					</div>
					<div className="hidden md:flex items-center gap-4 text-zinc-300 text-[11px]">
						<span>⚡ Powered by MedusaJS Core</span>
						<span>📦 Free Shipping on B2B Orders &gt; €500</span>
						<span>🔒 Stripe Connect Payouts</span>
					</div>
				</div>

				{/* 2. MAIN STOREFRONT HEADER (Official Mercur Navigation) */}
				<header className="rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-4">
						{/* Logo & Brand */}
						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6678c1] text-white text-2xl font-black shadow-md">
								M
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h1 className="text-2xl font-black tracking-tight text-[#1f2430]">MERCUR</h1>
									<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase">
										MARKETPLACE
									</span>
								</div>
								<p className="text-xs text-[#5b6472]">Multi-Vendor Commerce Engine • B2B & B2C Catalog</p>
							</div>
						</div>

						{/* Search Bar */}
						<div className="flex-1 max-w-lg">
							<div className="relative">
								<input
									type="text"
									placeholder="Search multi-vendor catalog, products, SKUs or sellers..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full rounded-2xl border border-[#d9e2ef] bg-[#f8faff] px-4 py-2.5 pl-10 text-xs font-semibold text-[#1f2430] placeholder-[#5b6472] focus:border-[#6678c1] focus:bg-white focus:outline-none shadow-inner"
								/>
								<span className="absolute left-3.5 top-2.5 text-sm text-[#5b6472]">🔍</span>
							</div>
						</div>

						{/* Region / Currency Selector + Vendor Sign In + Cart Drawer */}
						<div className="flex items-center gap-3">
							<select
								value={selectedRegion}
								onChange={(e) => setSelectedRegion(e.target.value)}
								className="rounded-2xl border border-[#d9e2ef] bg-[#f8faff] px-3 py-2 text-xs font-bold text-[#1f2430]"
							>
								<option value="🇩🇪 Germany / EUR (€)">🇩🇪 Germany / EUR (€)</option>
								<option value="🇺🇸 USA / USD ($)">🇺🇸 USA / USD ($)</option>
								<option value="🇬🇧 UK / GBP (£)">🇬🇧 UK / GBP (£)</option>
							</select>

							{loggedInVendor ? (
								<div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800">
									<span>🏬 Seller: {loggedInVendor.name}</span>
									<button onClick={() => setLoggedInVendor(null)} className="ml-1 text-rose-600 hover:underline">Logout</button>
								</div>
							) : (
								<button
									onClick={() => {
										setAuthMode("login");
										setShowVendorAuthModal(true);
									}}
									className="rounded-2xl bg-[#6678c1] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#404d85] transition"
								>
									🔑 Vendor Login / Sign Up
								</button>
							)}

							<button
								onClick={() => setShowCartDrawer(true)}
								className="relative rounded-2xl bg-[#1f2430] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 transition"
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
								className="rounded-2xl border border-[#6678c1] bg-white px-4 py-2.5 text-xs font-bold text-[#6678c1] hover:bg-[#6678c1] hover:text-white transition"
							>
								⚡ Mercur Admin Suite →
							</button>
						</div>
					</div>
				</header>

				{/* 3. HERO SLIDER BANNER (Official Mercur Demo Style) */}
				<div className="relative overflow-hidden rounded-3xl border border-[#d9e2ef] bg-gradient-to-r from-[#1f2430] via-[#2a3142] to-[#1f2430] p-8 text-white shadow-lg">
					<div className="flex flex-wrap items-center justify-between gap-6">
						<div className="max-w-2xl space-y-3">
							<span className="rounded-full bg-[#6678c1] px-3 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider">
								EXTENSIBLE MEDUSA COMMERCE ENGINE
							</span>
							<h2 className="text-3xl font-black tracking-tight text-white leading-tight">
								Empowering Enterprise Multi-Vendor Marketplaces
							</h2>
							<p className="text-xs text-zinc-300 leading-relaxed">
								Discover verified seller products across cloud infrastructure, security licenses, and industrial hardware. Features automated multi-vendor order splitting, seller B2B pricing offers, and Stripe Connect payouts.
							</p>

							<div className="pt-2 flex flex-wrap items-center gap-3">
								<button
									onClick={() => setCategoryFilter("All")}
									className="rounded-xl bg-[#6678c1] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#404d85]"
								>
									Explore Storefront Catalog
								</button>
								<button
									onClick={() => {
										setAuthMode("register");
										setShowVendorAuthModal(true);
									}}
									className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white hover:text-[#1f2430] transition"
								>
									+ Become a Verified Seller
								</button>
							</div>
						</div>

						{/* Verified Sellers Badge Box */}
						<div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md space-y-3 w-72">
							<div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Featured Marketplace Sellers</div>
							<div className="space-y-2">
								{vendors.map((v) => (
									<button
										key={v.id}
										onClick={() => setActiveVendorModal(v)}
										className="w-full flex items-center justify-between rounded-xl bg-white/10 p-2.5 text-left text-xs font-semibold hover:bg-white/20 transition"
									>
										<div className="flex items-center gap-2 truncate">
											<span className="text-base">{v.logo}</span>
											<span className="truncate text-white font-bold">{v.name}</span>
										</div>
										<span className="text-amber-400 font-bold">⭐ {v.rating}</span>
									</button>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* 4. MAIN STOREFRONT BODY: LEFT SIDEBAR FILTERS + RIGHT PRODUCT GRID */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
					{/* LEFT SIDEBAR FILTERS (Official Mercur Filter Layout) */}
					<aside className="rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-6 h-fit">
						<div>
							<h3 className="text-sm font-extrabold text-[#1f2430] border-b border-[#d9e2ef] pb-3">
								📂 Categories
							</h3>
							<div className="mt-3 space-y-1.5 text-xs font-semibold text-[#5b6472]">
								{["All", "Cloud Infrastructure & Hosting", "Software & Enterprise Licenses", "Hardware & IoT Devices"].map((cat) => (
									<button
										key={cat}
										onClick={() => setCategoryFilter(cat)}
										className={`w-full text-left rounded-xl px-3 py-2 transition ${
											categoryFilter === cat
												? "bg-[#6678c1] text-white font-bold shadow-sm"
												: "hover:bg-[#f8faff] hover:text-[#1f2430]"
										}`}
									>
										{cat}
									</button>
								))}
							</div>
						</div>

						{/* Vendor Sellers Filter */}
						<div>
							<h3 className="text-sm font-extrabold text-[#1f2430] border-b border-[#d9e2ef] pb-3">
								🏪 Filter by Seller / Vendor
							</h3>
							<div className="mt-3 space-y-2 text-xs font-semibold text-[#5b6472]">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="vendorFilter"
										checked={selectedVendorFilter === "All"}
										onChange={() => setSelectedVendorFilter("All")}
										className="accent-[#6678c1]"
									/>
									<span>All Sellers ({vendors.length})</span>
								</label>
								{vendors.map((v) => (
									<label key={v.id} className="flex items-center gap-2 cursor-pointer">
										<input
											type="radio"
											name="vendorFilter"
											checked={selectedVendorFilter === v.name}
											onChange={() => setSelectedVendorFilter(v.name)}
											className="accent-[#6678c1]"
										/>
										<span className="truncate">{v.logo} {v.name}</span>
									</label>
								))}
							</div>
						</div>

						{/* Price Range Filter */}
						<div>
							<h3 className="text-sm font-extrabold text-[#1f2430] border-b border-[#d9e2ef] pb-3 flex justify-between">
								<span>💰 Max Price</span>
								<span className="text-[#6678c1] font-black">€{priceRange}</span>
							</h3>
							<input
								type="range"
								min="100"
								max="3000"
								step="50"
								value={priceRange}
								onChange={(e) => setPriceRange(Number(e.target.value))}
								className="mt-3 w-full accent-[#6678c1]"
							/>
						</div>

						{/* Stock Filter */}
						<div className="pt-2 border-t border-[#d9e2ef]">
							<label className="flex items-center gap-2 text-xs font-bold text-[#1f2430] cursor-pointer">
								<input
									type="checkbox"
									checked={onlyInStock}
									onChange={(e) => setOnlyInStock(e.target.checked)}
									className="rounded accent-[#6678c1]"
								/>
								<span>Show Only In-Stock Items</span>
							</label>
						</div>
					</aside>

					{/* RIGHT PRODUCT GRID (Official Mercur Cards) */}
					<main className="lg:col-span-3 space-y-4">
						<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm">
							<div className="text-xs font-bold text-[#1f2430]">
								Showing <span className="text-[#6678c1] font-black">{filteredProducts.length}</span> Products
								{categoryFilter !== "All" && ` in "${categoryFilter}"`}
								{selectedVendorFilter !== "All" && ` by "${selectedVendorFilter}"`}
							</div>

							<button
								onClick={() => {
									setCategoryFilter("All");
									setSelectedVendorFilter("All");
									setSearchQuery("");
									setPriceRange(3000);
								}}
								className="text-xs font-bold text-[#6678c1] hover:underline"
							>
								Reset Filters ↺
							</button>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filteredProducts.map((prod) => (
								<div
									key={prod.id}
									className="group rounded-3xl border border-[#d9e2ef] bg-white p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#6678c1] hover:shadow-xl transition-all duration-300"
								>
									<div className="space-y-3">
										{/* Product Thumbnail Aspect Box */}
										<div className="relative h-44 w-full overflow-hidden rounded-2xl bg-zinc-100 border border-[#d9e2ef]">
											<img
												src={prod.image}
												alt={prod.title}
												className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
											/>
											<span className="absolute top-2 left-2 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold text-[#6678c1] border border-[#d9e2ef] shadow-sm">
												{prod.category}
											</span>
										</div>

										{/* Vendor Badge / Avatar */}
										<button
											onClick={() => {
												const v = vendors.find((vendor) => vendor.id === prod.vendorId);
												if (v) setActiveVendorModal(v);
											}}
											className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#5b6472] hover:text-[#6678c1] transition"
										>
											<span className="text-sm">{prod.vendorLogo}</span>
											<span className="truncate">Sold by {prod.vendorName}</span>
											<span className="text-xs text-amber-500">⭐ {prod.rating}</span>
										</button>

										<h3 className="text-sm font-bold text-[#1f2430] group-hover:text-[#6678c1] transition">
											{prod.title}
										</h3>

										<p className="text-xs text-[#5b6472] line-clamp-2 leading-relaxed">
											{prod.description}
										</p>

										{/* Seller Discount Offer Badge */}
										{prod.sellerOfferBadge && (
											<div className="rounded-xl bg-amber-50 p-2 text-[11px] font-bold text-amber-900 border border-amber-200">
												🏷️ {prod.sellerOfferBadge}
											</div>
										)}
									</div>

									{/* Price & Add to Cart */}
									<div className="pt-3 border-t border-[#d9e2ef] flex items-center justify-between">
										<div>
											<div className="flex items-baseline gap-1.5">
												<span className="text-lg font-black text-[#1f2430]">€{prod.price.toFixed(2)}</span>
												{prod.originalPrice && (
													<span className="text-xs text-[#5b6472] line-through font-semibold">€{prod.originalPrice.toFixed(2)}</span>
												)}
											</div>
											{prod.wholesaleB2bPrice && (
												<div className="text-[10px] font-bold text-emerald-600">
													B2B Tier: €{prod.wholesaleB2bPrice.toFixed(2)}
												</div>
											)}
										</div>

										<button
											onClick={() => addToCart(prod)}
											className="rounded-xl bg-[#6678c1] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#404d85] transition"
										>
											+ Cart
										</button>
									</div>
								</div>
							))}
						</div>
					</main>
				</div>
			</div>

			{/* CART DRAWER MODAL */}
			{showCartDrawer && (
				<div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
					<div className="w-full max-w-md bg-white p-6 shadow-2xl space-y-4 flex flex-col justify-between h-full">
						<div className="space-y-4 overflow-y-auto">
							<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
								<h3 className="text-base font-black text-[#1f2430]">🛒 Mercur Multi-Vendor Cart</h3>
								<button onClick={() => setShowCartDrawer(false)} className="text-sm font-bold text-[#5b6472]">✕</button>
							</div>

							{cart.length === 0 ? (
								<div className="p-8 text-center text-xs text-[#5b6472]">Your cart is empty. Add products from the storefront!</div>
							) : (
								<div className="space-y-3">
									{cart.map((item) => (
										<div key={item.product.id} className="rounded-2xl border border-[#d9e2ef] p-3 space-y-2 bg-[#f8faff]">
											<div className="flex justify-between items-start">
												<div>
													<div className="text-xs font-bold text-[#1f2430]">{item.product.title}</div>
													<div className="text-[11px] text-[#6678c1] font-bold">{item.product.vendorLogo} {item.product.vendorName}</div>
												</div>
												<button onClick={() => removeFromCart(item.product.id)} className="text-rose-500 font-bold text-xs">✕</button>
											</div>

											<div className="flex justify-between items-center text-xs pt-1 border-t border-[#d9e2ef]">
												<span>Qty: <strong>{item.quantity}</strong> x €{item.product.price.toFixed(2)}</span>
												<span className="font-black text-[#1f2430]">€{(item.quantity * item.product.price).toFixed(2)}</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{cart.length > 0 && (
							<div className="space-y-3 pt-4 border-t border-[#d9e2ef]">
								<div className="flex justify-between text-base font-black text-[#1f2430]">
									<span>Subtotal:</span>
									<span className="text-emerald-600">€{cartTotal.toFixed(2)}</span>
								</div>

								<button
									onClick={() => {
										alert("Executing Multi-Vendor Split Checkout via Stripe Connect!");
										setCart([]);
										setShowCartDrawer(false);
									}}
									className="w-full rounded-2xl bg-[#6678c1] py-3 text-xs font-bold text-white shadow-lg hover:bg-[#404d85]"
								>
									Proceed to Multi-Vendor Checkout
								</button>
							</div>
						)}
					</div>
				</div>
			)}

			{/* VENDOR PROFILE MODAL */}
			{activeVendorModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-lg rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
						<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
							<div className="flex items-center gap-3">
								<span className="text-3xl">{activeVendorModal.logo}</span>
								<div>
									<h3 className="text-base font-black text-[#1f2430]">{activeVendorModal.name}</h3>
									<div className="text-xs text-[#6678c1] font-semibold">{activeVendorModal.location}</div>
								</div>
							</div>
							<button onClick={() => setActiveVendorModal(null)} className="text-sm font-bold text-[#5b6472]">✕</button>
						</div>

						<p className="text-xs text-[#5b6472] leading-relaxed">{activeVendorModal.description}</p>

						<div className="grid grid-cols-3 gap-3 text-xs">
							<div className="rounded-xl border border-[#d9e2ef] p-3 bg-[#f8faff]">
								<div className="text-[#5b6472]">Seller Rating</div>
								<div className="text-sm font-black text-amber-500">⭐ {activeVendorModal.rating}</div>
							</div>
							<div className="rounded-xl border border-[#d9e2ef] p-3 bg-[#f8faff]">
								<div className="text-[#5b6472]">Products</div>
								<div className="text-sm font-black text-[#1f2430]">{activeVendorModal.totalProducts} Items</div>
							</div>
							<div className="rounded-xl border border-[#d9e2ef] p-3 bg-[#f8faff]">
								<div className="text-[#5b6472]">Payout Status</div>
								<div className="text-[11px] font-black text-emerald-600">Active</div>
							</div>
						</div>

						<div className="pt-2 flex justify-end">
							<button
								onClick={() => {
									setSelectedVendorFilter(activeVendorModal.name);
									setActiveVendorModal(null);
								}}
								className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-bold text-white shadow-sm"
							>
								Filter Products by {activeVendorModal.name}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* VENDOR LOGIN MODAL */}
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

							{authMsg && (
								<div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-emerald-800 text-xs">
									{authMsg}
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
