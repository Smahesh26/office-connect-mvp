"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type MedusaVendor = {
	id: string;
	name: string;
	logo: string;
	ownerEmail: string;
	category: string;
	rating: number;
	reviewsCount: number;
	totalProducts: number;
	location: string;
	description: string;
	isOnline?: boolean;
};

type MedusaProduct = {
	id: string;
	sku: string;
	title: string;
	subtitle?: string;
	image: string;
	vendorId: string;
	vendorName: string;
	vendorLogo: string;
	category: string;
	subcategory?: string;
	price: number;
	originalPrice?: number;
	sellerOfferBadge?: string;
	stockQty: number;
	soldQty: number;
	rating: number;
	reviewsCount: number;
	description: string;
	isHot?: boolean;
};

type MedusaCartItem = {
	product: MedusaProduct;
	quantity: number;
};

export default function StorefrontPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f8fafc] font-sans text-[#1f2430]">Loading Vibrant Marketplace...</div>}>
			<StorefrontContent />
		</Suspense>
	);
}

function StorefrontContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialVendorFilter = searchParams.get("vendor") || "All";

	const [searchTab, setSearchTab] = useState<"products" | "services">("products");
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("All");
	const [selectedBrand, setSelectedBrand] = useState("All Brands");
	const [selectedLocation, setSelectedLocation] = useState("Global Marketplace");
	const [selectedVendorFilter, setSelectedVendorFilter] = useState(initialVendorFilter);

	const [cart, setCart] = useState<MedusaCartItem[]>([]);
	const [showCartDrawer, setShowCartDrawer] = useState(false);
	const [showProductUploadModal, setShowProductUploadModal] = useState(false);
	const [selectedProductQuickView, setSelectedProductQuickView] = useState<MedusaProduct | null>(null);

	// Animated Flash Sale Timer Countdown State
	const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });
	const [addedToast, setAddedToast] = useState<string | null>(null);

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
				if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
				if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
				return { hours: 4, minutes: 28, seconds: 45 };
			});
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const [products, setProducts] = useState<MedusaProduct[]>([
		{
			id: "p-lively-1",
			sku: "SKU-BEAUTY-ROSE-01",
			title: "Damask Rose Botanical Hydrating Serum",
			subtitle: "Organic French Grasse Rose Extract",
			image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
			vendorId: "v-glow-beauty",
			vendorName: "Glow Beauty Organics 🌸",
			vendorLogo: "🌸",
			category: "Beauty & Personal Care",
			subcategory: "Skincare",
			price: 68.00,
			originalPrice: 85.00,
			sellerOfferBadge: "🔥 FLASH DEAL 20% OFF",
			stockQty: 12,
			soldQty: 188,
			rating: 5.0,
			reviewsCount: 310,
			description: "Formulated with 100% organic Damask rose petals, cold-pressed hyaluronic acid, and botanical anti-oxidants.",
			isHot: true
		},
		{
			id: "p-lively-2",
			sku: "SKU-AUDIO-ANC-02",
			title: "Wireless ANC Noise-Cancelling Headphones",
			subtitle: "Hi-Res Audio with 40-Hour Battery",
			image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
			vendorId: "v-office-direct",
			vendorName: "Office Connect Direct 👑",
			vendorLogo: "👑",
			category: "Electronics & Gadgets",
			subcategory: "Audio",
			price: 249.00,
			originalPrice: 299.00,
			sellerOfferBadge: "⚡ BEST SELLER 15% OFF",
			stockQty: 8,
			soldQty: 342,
			rating: 4.9,
			reviewsCount: 420,
			description: "Active noise-cancellation with spatial audio drivers, memory foam ear cushions, and USB-C fast charging.",
			isHot: true
		},
		{
			id: "p-lively-3",
			sku: "SKU-CLOUD-CLUSTER-03",
			title: "Kubernetes Enterprise Cloud Cluster Node",
			subtitle: "Dedicated Multi-Region NVMe VPS",
			image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
			vendorId: "v-acme-cloud",
			vendorName: "Acme Cloud Corp ☁️",
			vendorLogo: "☁️",
			category: "Enterprise Software & Cloud",
			subcategory: "Hosting",
			price: 499.00,
			originalPrice: 599.00,
			sellerOfferBadge: "💎 ENTERPRISE DEAL",
			stockQty: 5,
			soldQty: 45,
			rating: 4.8,
			reviewsCount: 94,
			description: "Dedicated 64-Core AMD EPYC server nodes pre-configured with Kubernetes automated load balancing."
		},
		{
			id: "p-lively-4",
			sku: "SKU-SMARTWATCH-04",
			title: "Titanium Fitness & Health Smartwatch",
			subtitle: "GPS Navigation & Cardiac Monitor",
			image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
			vendorId: "v-office-direct",
			vendorName: "Office Connect Direct 👑",
			vendorLogo: "👑",
			category: "Electronics & Gadgets",
			subcategory: "Wearables",
			price: 349.00,
			originalPrice: 399.00,
			sellerOfferBadge: "🌟 NEW ARRIVAL",
			stockQty: 15,
			soldQty: 110,
			rating: 4.9,
			reviewsCount: 156,
			description: "Aerospace-grade titanium casing with Sapphire display, multi-sport tracking, and 100m water resistance rating."
		}
	]);

	const vendors: MedusaVendor[] = [
		{
			id: "v-office-direct",
			name: "Office Connect Direct 👑",
			logo: "👑",
			ownerEmail: "admin@camblissstudio.com",
			category: "1P Flagship Store",
			rating: 5.0,
			reviewsCount: 500,
			totalProducts: 2,
			location: "Global Platform HQ 🌐",
			description: "Official first-party storefront for verified hardware & enterprise cloud software.",
			isOnline: true
		},
		{
			id: "v-glow-beauty",
			name: "Glow Beauty Organics 🌸",
			logo: "🌸",
			ownerEmail: "care@glowbeautyorganics.com",
			category: "Beauty & Skincare",
			rating: 5.0,
			reviewsCount: 310,
			totalProducts: 1,
			location: "Paris, France 🇫🇷",
			description: "Luxury organic French skincare and botanical cosmetic formulations.",
			isOnline: true
		},
		{
			id: "v-acme-cloud",
			name: "Acme Cloud Corp ☁️",
			logo: "☁️",
			ownerEmail: "vendors@acmecloud.io",
			category: "Enterprise Cloud & SaaS",
			rating: 4.8,
			reviewsCount: 94,
			totalProducts: 1,
			location: "Munich, Germany 🇩🇪",
			description: "High-performance enterprise cloud servers and Kubernetes infrastructure.",
			isOnline: true
		}
	];

	const categories = [
		{ name: "All Categories", icon: "✨" },
		{ name: "Electronics & Gadgets", icon: "🎧" },
		{ name: "Beauty & Personal Care", icon: "🌸" },
		{ name: "Enterprise Software & Cloud", icon: "☁️" }
	];

	const addToCart = (product: MedusaProduct) => {
		setCart((prev) => {
			const existing = prev.find((item) => item.product.id === product.id);
			if (existing) {
				return prev.map((item) =>
					item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
				);
			}
			return [...prev, { product, quantity: 1 }];
		});
		setAddedToast(product.title);
		setTimeout(() => setAddedToast(null), 3000);
	};

	const filteredProducts = products.filter((p) => {
		const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory = categoryFilter === "All Categories" || categoryFilter === "All" || p.category === categoryFilter;
		const matchesVendor = selectedVendorFilter === "All" || p.vendorId === selectedVendorFilter;
		return matchesSearch && matchesCategory && matchesVendor;
	});

	return (
		<div className="min-h-screen bg-[#f8fafc] font-sans text-[#1f2430] flex flex-col antialiased selection:bg-[#404d85] selection:text-white">
			
			{/* ANIMATED LIVELY INFINITE TICKER BAR */}
			<div className="bg-gradient-to-r from-[#1f2430] via-[#252f5a] to-[#404d85] text-white py-2 px-4 text-xs font-bold shadow-md overflow-hidden border-b border-[#323d6a]">
				<div className="max-w-7xl mx-auto flex justify-between items-center">
					<div className="flex items-center gap-2">
						<span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
						<span className="text-emerald-300 font-extrabold uppercase tracking-wider text-[11px]">LIVE MARKETPLACE</span>
						<span className="hidden md:inline text-blue-200">• 1,280+ Live Buyers Browsing Now</span>
					</div>

					{/* Flash Deal Timer Pill */}
					<div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 rounded-full text-[11px]">
						<span className="text-amber-300">⚡ Flash Sale Ends:</span>
						<span className="font-mono text-white font-extrabold">
							{String(timeLeft.hours).padStart(2, "0")}h : {String(timeLeft.minutes).padStart(2, "0")}m : {String(timeLeft.seconds).padStart(2, "0")}s
						</span>
					</div>

					<div className="hidden sm:flex items-center gap-4 text-xs font-medium">
						<button onClick={() => setShowProductUploadModal(true)} className="hover:text-blue-200 transition font-bold text-amber-300">
							+ Register Seller Store
						</button>
						<span>|</span>
						<a href="/login" className="hover:text-blue-200 transition">Customer Sign In</a>
					</div>
				</div>
			</div>

			{/* LIVELY MAIN HEADER WITH GLOWING BADGES */}
			<header className="bg-white/90 backdrop-blur-xl border-b border-zinc-200/80 py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-sm">
				<div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
					
					{/* Office Connect Brand Logo */}
					<Link href="/storefront" className="flex items-center gap-3 shrink-0 group">
						<Image
							src="/officeconnectlogo.png"
							alt="Office Connect"
							width={220}
							height={56}
							priority
							className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
						/>
						<span className="hidden lg:inline-flex items-center gap-1 rounded-full bg-[#404d85]/10 px-2.5 py-0.5 text-[10px] font-extrabold text-[#404d85] border border-[#404d85]/20">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE HUB
						</span>
					</Link>

					{/* Interactive Wide Search Input */}
					<div className="flex-1 max-w-2xl hidden md:flex items-center rounded-2xl bg-zinc-100/90 border border-zinc-300/80 px-4 py-2 text-xs focus-within:border-[#404d85] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#404d85]/10 transition shadow-inner">
						<span className="text-zinc-400 mr-2 text-sm">🔍</span>
						<input
							type="text"
							placeholder="Search products, cosmetics, electronics, or verified seller stores..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-transparent focus:outline-none text-[#1f2430] placeholder-zinc-400 font-medium text-xs"
						/>
						<button className="rounded-xl bg-[#404d85] text-white px-4 py-1.5 text-xs font-bold hover:bg-[#323d6a] transition shadow-md shrink-0">
							Search
						</button>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-2.5 shrink-0">
						<button
							onClick={() => setShowCartDrawer(true)}
							className="relative flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-[#404d85] hover:bg-zinc-50 transition shadow-sm group"
						>
							<span className="text-base group-hover:scale-110 transition-transform">🛒</span>
							<span className="hidden sm:inline">Bag</span>
							{cart.length > 0 && (
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#404d85] text-[10px] font-bold text-white shadow-md animate-bounce">
									{cart.reduce((sum, item) => sum + item.quantity, 0)}
								</span>
							)}
						</button>

						<button
							onClick={() => setShowProductUploadModal(true)}
							className="rounded-2xl bg-gradient-to-r from-[#404d85] to-[#252f5a] px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-xl hover:scale-105 transition-all transform active:scale-95"
						>
							+ Upload Product
						</button>
					</div>

				</div>
			</header>

			{/* LIVELY INTERACTIVE CATEGORIES BAR */}
			<div className="bg-white border-b border-zinc-200 px-4 sm:px-8 py-3 overflow-x-auto shadow-sm">
				<div className="max-w-7xl mx-auto flex items-center gap-3 text-xs font-bold">
					<span className="text-zinc-400 text-[10px] uppercase tracking-widest mr-1 shrink-0">Categories:</span>
					{categories.map((cat) => (
						<button
							key={cat.name}
							onClick={() => setCategoryFilter(cat.name)}
							className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
								categoryFilter === cat.name
									? "bg-[#404d85] text-white shadow-md scale-105"
									: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:scale-102"
							}`}
						>
							<span>{cat.icon}</span>
							<span>{cat.name}</span>
						</button>
					))}
				</div>
			</div>

			{/* HERO SECTION 1: VIBRANT SEARCH FOR PRODUCTS & SERVICES CARD */}
			<section className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-8">
				<div className="rounded-3xl bg-gradient-to-r from-[#1f2430] via-[#252f5a] to-[#404d85] text-white p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-6">
					
					{/* Background Glowing Halos */}
					<div className="absolute top-0 right-0 w-96 h-96 bg-[#6678c1]/30 rounded-full blur-3xl pointer-events-none animate-pulse" />

					<div className="relative z-10 space-y-3">
						<span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 text-xs font-extrabold text-blue-200 shadow-md">
							<span>🔥</span> High-Velocity Multi-Vendor E-Commerce
						</span>
						<h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
							Find Premier Products & Verified Seller Stores
						</h1>
						<p className="text-xs sm:text-sm text-blue-100 max-w-2xl font-normal leading-relaxed">
							Connect directly with official brands, certified skincare formulators, and enterprise cloud providers.
						</p>
					</div>

					{/* Tab Toggles: Search for Products | Search for Services */}
					<div className="relative z-10 flex items-center gap-3">
						<button
							onClick={() => setSearchTab("products")}
							className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-md ${
								searchTab === "products" ? "bg-white text-[#404d85] scale-105" : "bg-white/10 text-white hover:bg-white/20"
							}`}
						>
							<span>🛍️ Search Products</span>
						</button>
						<button
							onClick={() => setSearchTab("services")}
							className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-md ${
								searchTab === "services" ? "bg-white text-[#404d85] scale-105" : "bg-white/10 text-white hover:bg-white/20"
							}`}
						>
							<span>🛠️ Search Services</span>
						</button>
					</div>

					{/* Multi-Field Search Filter Bar (Reference Row) */}
					<div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-2xl p-3.5 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs font-semibold text-[#1f2430]">
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="rounded-xl border border-zinc-200 p-3 bg-zinc-50 font-bold text-[#404d85] focus:outline-none cursor-pointer"
						>
							<option value="All Categories">Product Category</option>
							<option value="Electronics & Gadgets">Electronics & Gadgets</option>
							<option value="Beauty & Personal Care">Beauty & Personal Care</option>
							<option value="Enterprise Software & Cloud">Enterprise Software & Cloud</option>
						</select>

						<select
							value={selectedBrand}
							onChange={(e) => setSelectedBrand(e.target.value)}
							className="rounded-xl border border-zinc-200 p-3 bg-zinc-50 font-semibold focus:outline-none cursor-pointer"
						>
							<option value="All Brands">Select Brand</option>
							<option value="Office Connect Direct">Office Connect Direct 👑</option>
							<option value="Glow Beauty Organics">Glow Beauty Organics 🌸</option>
							<option value="Acme Cloud Corp">Acme Cloud Corp ☁️</option>
						</select>

						<select className="rounded-xl border border-zinc-200 p-3 bg-zinc-50 font-semibold focus:outline-none cursor-pointer">
							<option value="">Select Model</option>
							<option value="2026 Pro">2026 Flagship Pro</option>
							<option value="Enterprise">Enterprise Cloud</option>
						</select>

						<select className="rounded-xl border border-zinc-200 p-3 bg-zinc-50 font-semibold focus:outline-none cursor-pointer">
							<option value="">Model Year</option>
							<option value="2026">2026 Edition</option>
							<option value="2025">2025 Edition</option>
						</select>

						<input
							type="text"
							placeholder="Keyword..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="rounded-xl border border-zinc-200 p-3 bg-zinc-50 font-medium focus:outline-none"
						/>

						<button className="rounded-xl bg-[#404d85] text-white font-bold py-3 px-4 hover:bg-[#323d6a] transition flex items-center justify-center gap-1.5 shadow-lg active:scale-95">
							<span>🔍 Search</span>
						</button>
					</div>

				</div>
			</section>

			{/* HERO SECTION 2: SPLIT PROMOTIONAL CARDS GRID (65% / 35% LAYOUT) */}
			<section className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					
					{/* Left Promo Card (65% Width) */}
					<div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-[#eef2fa] via-white to-zinc-100 border border-zinc-200/80 p-8 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[320px] group">
						
						{/* Special Offer Animated Circle Badge */}
						<div className="absolute top-6 right-8 w-24 h-24 rounded-full bg-[#404d85] text-white flex flex-col items-center justify-center text-center shadow-xl border-4 border-white transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
							<span className="text-[10px] font-black uppercase tracking-wider text-amber-300">SPECIAL OFFER</span>
							<span className="text-xl font-black leading-none">50%</span>
							<span className="text-[9px] font-bold">OFF</span>
						</div>

						<div className="space-y-3 max-w-md">
							<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
								<span>✓</span> 100% Genuine Certified Goods
							</span>
							<h2 className="text-3xl sm:text-4xl font-black text-[#1f2430] leading-tight">
								PREMIER BRAND PRODUCTS
							</h2>
							<p className="text-xs text-zinc-600 font-medium leading-relaxed">
								Directly fulfilled by verified seller stores with nationwide express warranty protection.
							</p>
						</div>

						<div className="flex items-center justify-between pt-6">
							<button
								onClick={() => setShowProductUploadModal(true)}
								className="rounded-xl bg-[#404d85] px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-[#323d6a] transition transform hover:-translate-y-0.5"
							>
								Explore Featured Catalog ↗
							</button>

							{/* Carousel Pagination Dots */}
							<div className="flex items-center gap-2">
								<span className="w-3.5 h-3.5 rounded-full bg-[#404d85] shadow-sm" />
								<span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
								<span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
							</div>
						</div>
					</div>

					{/* Right Promo Card (35% Width) */}
					<div className="rounded-3xl bg-gradient-to-br from-[#252f5a] to-[#404d85] text-white p-8 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[320px]">
						<div className="space-y-3">
							<span className="rounded-full bg-white/20 border border-white/30 px-3 py-1 text-[10px] font-bold text-blue-200">
								Vendor Services Hub
							</span>
							<h3 className="text-2xl font-black text-white leading-snug">
								Register Store & Book Services Online
							</h3>
							<p className="text-xs text-blue-100 font-normal leading-relaxed">
								Connect with nearest verified garages, cloud experts, and beauty consultants.
							</p>
						</div>

						<div className="pt-6 space-y-3">
							<button
								onClick={() => setShowProductUploadModal(true)}
								className="w-full rounded-xl bg-white py-3 text-xs font-bold text-[#404d85] shadow-lg hover:bg-blue-50 transition transform hover:-translate-y-0.5"
							>
								+ Register As Seller Store
							</button>
							<div className="text-[11px] text-center text-emerald-300 font-bold">
								📍 Find nearest seller location
							</div>
						</div>
					</div>

				</div>
			</section>

			{/* TRUST & GUARANTEE BADGES STRIP */}
			<section className="bg-white border-y border-zinc-200 py-6 px-4 sm:px-8 shadow-sm">
				<div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-[#1f2430]">
					<div className="flex items-center gap-3">
						<span className="text-2xl p-2.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-200 shadow-sm">🛡️</span>
						<div>
							<h4 className="font-extrabold text-sm">Original Brand Products</h4>
							<p className="text-[11px] text-zinc-500 font-normal">100% Certified Direct Goods</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-2xl p-2.5 bg-blue-50 rounded-2xl text-[#404d85] border border-blue-200 shadow-sm">🚚</span>
						<div>
							<h4 className="font-extrabold text-sm">Nationwide Delivery</h4>
							<p className="text-[11px] text-zinc-500 font-normal">Express Shipping Available</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-2xl p-2.5 bg-purple-50 rounded-2xl text-purple-600 border border-purple-200 shadow-sm">🔒</span>
						<div>
							<h4 className="font-extrabold text-sm">Verified Seller Guarantee</h4>
							<p className="text-[11px] text-zinc-500 font-normal">Stripe Escrow Protection</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-2xl p-2.5 bg-amber-50 rounded-2xl text-amber-600 border border-amber-200 shadow-sm">💎</span>
						<div>
							<h4 className="font-extrabold text-sm">Best Price Guarantee</h4>
							<p className="text-[11px] text-zinc-500 font-normal">Wholesale B2B Pricing</p>
						</div>
					</div>
				</div>
			</section>

			{/* MAIN LIVE PRODUCTS CATALOG GRID WITH STOCK PROGRESS & HOT BADGES */}
			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10 space-y-6">
				<div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
					<div>
						<h2 className="text-lg font-extrabold text-[#404d85]">Live Multi-Vendor Product Catalog</h2>
						<p className="text-xs text-zinc-500">Showing {filteredProducts.length} verified listings</p>
					</div>
					<button
						onClick={() => setShowProductUploadModal(true)}
						className="rounded-xl bg-[#404d85] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]"
					>
						+ Upload Product
					</button>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{filteredProducts.map((product) => (
						<div
							key={product.id}
							className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#6678c1]/50 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1.5"
						>
							<div className="relative aspect-[4/3] bg-zinc-50 overflow-hidden border-b border-zinc-100">
								<img
									src={product.image}
									alt={product.title}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
								/>
								{product.sellerOfferBadge && (
									<span className="absolute top-2.5 left-2.5 rounded-full bg-[#1f2430]/90 backdrop-blur-sm px-3 py-1 text-[10px] font-black text-white shadow-md">
										{product.sellerOfferBadge}
									</span>
								)}
							</div>

							<div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
								<div className="space-y-1.5">
									<div className="flex justify-between items-center text-[11px] text-[#6678c1] font-bold">
										<span className="flex items-center gap-1">
											<span>{product.vendorLogo}</span>
											<span className="truncate">{product.vendorName}</span>
										</span>
										<span>⭐ {product.rating}</span>
									</div>
									<h3 className="font-extrabold text-sm text-[#1f2430] group-hover:text-[#404d85] transition line-clamp-1">{product.title}</h3>
									<p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{product.description}</p>

									{/* Stock Scarcity Bar */}
									<div className="space-y-1 pt-1">
										<div className="flex justify-between text-[10px] font-bold text-amber-600">
											<span>🔥 Only {product.stockQty} left in stock!</span>
											<span>{product.soldQty} sold</span>
										</div>
										<div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
											<div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: "85%" }} />
										</div>
									</div>
								</div>

								<div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
									<div>
										<div className="font-black text-emerald-600 text-base">${product.price.toFixed(2)}</div>
										{product.originalPrice && (
											<div className="text-[11px] text-zinc-400 line-through">${product.originalPrice.toFixed(2)}</div>
										)}
									</div>
									<div className="flex gap-1.5">
										<button
											onClick={() => setSelectedProductQuickView(product)}
											className="rounded-xl border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
										>
											Details
										</button>
										<button
											onClick={() => addToCart(product)}
											className="rounded-xl bg-[#404d85] px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-[#323d6a] transition"
										>
											+ Add
										</button>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</main>

			{/* ADDED TO CART TOAST NOTIFICATION */}
			{addedToast && (
				<div className="fixed bottom-6 right-6 z-[9999] bg-[#404d85] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-bounce">
					<span className="text-xl">🎉</span>
					<div>
						<div className="text-xs font-bold">Added to Shopping Bag!</div>
						<div className="text-[11px] text-blue-200 truncate max-w-xs">{addedToast}</div>
					</div>
				</div>
			)}

			{/* UPLOAD PRODUCT MODAL */}
			{showProductUploadModal && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
					<div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative border border-zinc-200 space-y-3">
						<button onClick={() => setShowProductUploadModal(false)} className="absolute right-5 top-5 text-zinc-400 font-bold text-lg">✕</button>
						<h2 className="text-lg font-bold text-[#404d85]">+ Upload New Product</h2>
						<form onSubmit={(e) => {
							e.preventDefault();
							alert("🎉 Product published to live Storefront!");
							setShowProductUploadModal(false);
						}} className="space-y-3 text-xs">
							<div>
								<label className="block font-bold text-zinc-700">Product Title *</label>
								<input type="text" required placeholder="e.g. Wireless ANC Headphones" className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs" />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-bold text-zinc-700">Category *</label>
									<input type="text" required placeholder="Electronics & Gadgets" className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs" />
								</div>
								<div>
									<label className="block font-bold text-zinc-700">Price ($) *</label>
									<input type="number" step="0.01" required placeholder="249.00" className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-emerald-600" />
								</div>
							</div>
							<div>
								<label className="block font-bold text-zinc-700">Image URL</label>
								<input type="url" placeholder="https://images.unsplash.com/..." className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-mono" />
							</div>
							<div>
								<label className="block font-bold text-zinc-700">Description</label>
								<textarea rows={2} placeholder="Product description..." className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs" />
							</div>
							<button type="submit" className="w-full rounded-xl bg-[#404d85] py-3 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]">Publish Product</button>
						</form>
					</div>
				</div>
			)}

		</div>
	);
}
