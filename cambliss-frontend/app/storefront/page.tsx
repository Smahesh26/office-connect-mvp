"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, Suspense, FormEvent } from "react";
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
	rating: number;
	reviewsCount: number;
	description: string;
};

type MedusaCartItem = {
	product: MedusaProduct;
	quantity: number;
};

export default function StorefrontPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f8fafc] font-sans text-[#1f2430]">Loading Office Connect Marketplace...</div>}>
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

	const [products, setProducts] = useState<MedusaProduct[]>([
		{
			id: "p-ref-1",
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
			sellerOfferBadge: "SPECIAL OFFER 20% OFF",
			stockQty: 240,
			rating: 5.0,
			reviewsCount: 310,
			description: "Formulated with 100% organic Damask rose petals, cold-pressed hyaluronic acid, and botanical anti-oxidants."
		},
		{
			id: "p-ref-2",
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
			sellerOfferBadge: "SPECIAL OFFER 15% OFF",
			stockQty: 120,
			rating: 4.9,
			reviewsCount: 420,
			description: "Active noise-cancellation with spatial audio drivers, memory foam ear cushions, and USB-C fast charging."
		},
		{
			id: "p-ref-3",
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
			sellerOfferBadge: "SPECIAL OFFER 20% OFF",
			stockQty: 50,
			rating: 4.8,
			reviewsCount: 94,
			description: "Dedicated 64-Core AMD EPYC server nodes pre-configured with Kubernetes automated load balancing."
		},
		{
			id: "p-ref-4",
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
			sellerOfferBadge: "SPECIAL OFFER 12% OFF",
			stockQty: 90,
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
			description: "Official first-party storefront for verified hardware & enterprise cloud software."
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
			description: "Luxury organic French skincare and botanical cosmetic formulations."
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
			description: "High-performance enterprise cloud servers and Kubernetes infrastructure."
		}
	];

	const categories = ["All Categories", "Electronics & Gadgets", "Beauty & Personal Care", "Enterprise Software & Cloud"];

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
		setShowCartDrawer(true);
	};

	const filteredProducts = products.filter((p) => {
		const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory = categoryFilter === "All Categories" || categoryFilter === "All" || p.category === categoryFilter;
		const matchesVendor = selectedVendorFilter === "All" || p.vendorId === selectedVendorFilter;
		return matchesSearch && matchesCategory && matchesVendor;
	});

	return (
		<div className="min-h-screen bg-[#f8fafc] font-sans text-[#1f2430] flex flex-col antialiased">
			
			{/* TOP UTILITY HEADER BAR (LIKE REFERENCE) */}
			<div className="bg-[#f1f5f9] text-[#1f2430] px-4 sm:px-8 py-2 text-xs font-semibold border-b border-zinc-200">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					{/* Left Links */}
					<div className="flex items-center gap-6 text-zinc-600">
						<Link href="/about" className="hover:text-[#404d85]">About Us</Link>
						<Link href="/blog" className="hover:text-[#404d85]">Blog & News</Link>
						<button onClick={() => setShowProductUploadModal(true)} className="text-[#404d85] font-extrabold hover:underline">
							Become A Seller
						</button>
					</div>

					{/* Right Currency & Apps */}
					<div className="hidden sm:flex items-center gap-4 text-xs">
						<div className="flex items-center gap-1 text-zinc-600 cursor-pointer">
							<span>🌐 English</span>
							<span className="text-[10px]">▼</span>
						</div>
						<div className="flex gap-2">
							<span className="cursor-pointer hover:opacity-80">📱 App Store</span>
							<span className="cursor-pointer hover:opacity-80">🤖 Google Play</span>
						</div>
					</div>
				</div>
			</div>

			{/* MAIN LOGO & SEARCH HEADER BAR (LIKE REFERENCE) */}
			<header className="bg-white border-b border-zinc-200 py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-sm">
				<div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
					
					{/* Brand Logo */}
					<Link href="/storefront" className="flex items-center gap-3 shrink-0">
						<Image
							src="/officeconnectlogo.png"
							alt="Office Connect"
							width={220}
							height={56}
							priority
							className="h-10 sm:h-12 w-auto object-contain"
						/>
					</Link>

					{/* Ultra Wide Center Search Bar (Like Reference) */}
					<div className="flex-1 max-w-2xl hidden md:flex items-center rounded-xl bg-zinc-100 border border-zinc-200 px-4 py-2 text-xs focus-within:border-[#404d85] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#404d85]/10 transition">
						<span className="text-zinc-400 mr-2 text-sm">🔍</span>
						<input
							type="text"
							placeholder="Search Anything across marketplace..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-transparent focus:outline-none text-[#1f2430] placeholder-zinc-400 font-medium"
						/>
					</div>

					{/* Location, Cart & Auth Buttons (Like Reference) */}
					<div className="flex items-center gap-3 shrink-0">
						<div className="hidden lg:flex items-center gap-1 text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-2 rounded-xl border border-zinc-200 cursor-pointer">
							<span>📍</span>
							<select
								value={selectedLocation}
								onChange={(e) => setSelectedLocation(e.target.value)}
								className="bg-transparent focus:outline-none cursor-pointer"
							>
								<option value="Global Marketplace">Global Marketplace</option>
								<option value="United States 🇺🇸">United States 🇺🇸</option>
								<option value="Europe 🇪🇺">Europe 🇪🇺</option>
								<option value="Asia 🌏">Asia 🌏</option>
							</select>
						</div>

						<button
							onClick={() => setShowCartDrawer(true)}
							className="relative flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-[#404d85] hover:bg-zinc-100 transition shadow-sm"
						>
							<span className="text-base">🛒</span>
							{cart.length > 0 && (
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#404d85] text-[10px] font-bold text-white">
									{cart.reduce((sum, item) => sum + item.quantity, 0)}
								</span>
							)}
						</button>

						<a
							href="/login"
							className="rounded-xl border border-[#404d85] px-4 py-2 text-xs font-bold text-[#404d85] hover:bg-blue-50 transition"
						>
							👤 Login
						</a>

						<button
							onClick={() => setShowProductUploadModal(true)}
							className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#323d6a] transition"
						>
							+ Upload Product
						</button>
					</div>

				</div>
			</header>

			{/* HERO SECTION 1: SEARCH FOR PRODUCTS & SERVICES CARD (EXACT REFERENCE LAYOUT) */}
			<section className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-8">
				<div className="rounded-3xl bg-gradient-to-r from-[#252f5a] via-[#323d6a] to-[#404d85] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
					
					<div className="space-y-2">
						<h1 className="text-2xl sm:text-3xl font-extrabold text-white">
							Find Your Marketplace Products and Services
						</h1>
						<p className="text-xs sm:text-sm text-blue-100 max-w-3xl leading-relaxed">
							Explore a vast selection of multi-vendor products and services tailored to your needs. Whether you are seeking specific items or enterprise cloud solutions.
						</p>
					</div>

					{/* Tab Toggles: Search for Products | Search for Services */}
					<div className="flex items-center gap-3">
						<button
							onClick={() => setSearchTab("products")}
							className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
								searchTab === "products" ? "bg-white text-[#404d85] shadow-lg" : "bg-white/10 text-white hover:bg-white/20"
							}`}
						>
							<span>🛍️ Search for Products...</span>
						</button>
						<button
							onClick={() => setSearchTab("services")}
							className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
								searchTab === "services" ? "bg-white text-[#404d85] shadow-lg" : "bg-white/10 text-white hover:bg-white/20"
							}`}
						>
							<span>🛠️ Search for Services...</span>
						</button>
					</div>

					{/* Multi-Field Search Filter Bar (Exact Reference Row) */}
					<div className="bg-white rounded-2xl p-3 shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 text-xs font-semibold text-[#1f2430]">
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="rounded-xl border border-zinc-200 p-2.5 bg-zinc-50 font-bold text-[#404d85] focus:outline-none cursor-pointer"
						>
							<option value="All Categories">Product Category</option>
							<option value="Electronics & Gadgets">Electronics & Gadgets</option>
							<option value="Beauty & Personal Care">Beauty & Personal Care</option>
							<option value="Enterprise Software & Cloud">Enterprise Software & Cloud</option>
						</select>

						<select
							value={selectedBrand}
							onChange={(e) => setSelectedBrand(e.target.value)}
							className="rounded-xl border border-zinc-200 p-2.5 bg-zinc-50 font-semibold focus:outline-none cursor-pointer"
						>
							<option value="All Brands">Select Brand</option>
							<option value="Office Connect Direct">Office Connect Direct 👑</option>
							<option value="Glow Beauty Organics">Glow Beauty Organics 🌸</option>
							<option value="Acme Cloud Corp">Acme Cloud Corp ☁️</option>
						</select>

						<select className="rounded-xl border border-zinc-200 p-2.5 bg-zinc-50 font-semibold focus:outline-none cursor-pointer">
							<option value="">Select Model</option>
							<option value="2026 Pro">2026 Pro Edition</option>
							<option value="Enterprise">Enterprise Cloud</option>
						</select>

						<select className="rounded-xl border border-zinc-200 p-2.5 bg-zinc-50 font-semibold focus:outline-none cursor-pointer">
							<option value="">Model Year</option>
							<option value="2026">2026 Edition</option>
							<option value="2025">2025 Edition</option>
						</select>

						<input
							type="text"
							placeholder="Keyword..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="rounded-xl border border-zinc-200 p-2.5 bg-zinc-50 font-medium focus:outline-none"
						/>

						<button className="rounded-xl bg-[#404d85] text-white font-bold py-2.5 px-4 hover:bg-[#323d6a] transition flex items-center justify-center gap-1.5 shadow-md">
							<span>🔍 Search</span>
						</button>
					</div>

				</div>
			</section>

			{/* HERO SECTION 2: SPLIT PROMOTIONAL CARDS GRID (EXACT REFERENCE 65% / 35% LAYOUT) */}
			<section className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					
					{/* Left Promo Card (65% Width / 2 Cols) */}
					<div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-[#eef2fa] via-white to-zinc-100 border border-zinc-200/80 p-8 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[320px]">
						{/* Special Offer Badge Circle (Like Reference) */}
						<div className="absolute top-6 right-8 w-24 h-24 rounded-full bg-[#404d85] text-white flex flex-col items-center justify-center text-center shadow-lg border-4 border-white transform rotate-12">
							<span className="text-[10px] font-black uppercase tracking-wider">SPECIAL OFFER</span>
							<span className="text-lg font-black leading-none">50%</span>
							<span className="text-[9px] font-bold">OFF</span>
						</div>

						<div className="space-y-3 max-w-md">
							<span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">
								100% Genuine Certified
							</span>
							<h2 className="text-3xl sm:text-4xl font-black text-[#1f2430] leading-tight">
								PREMIER BRAND PRODUCTS
							</h2>
							<p className="text-xs text-zinc-600 font-medium">
								Directly fulfilled by verified seller stores with nationwide express warranty protection.
							</p>
						</div>

						<div className="flex items-center justify-between pt-6">
							<button
								onClick={() => setShowProductUploadModal(true)}
								className="rounded-xl bg-[#404d85] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]"
							>
								Explore Featured Catalog ↗
							</button>

							{/* Carousel Pagination Dots */}
							<div className="flex items-center gap-1.5">
								<span className="w-3 h-3 rounded-full bg-[#404d85]" />
								<span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
								<span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
							</div>
						</div>
					</div>

					{/* Right Promo Card (35% Width / 1 Col) */}
					<div className="rounded-3xl bg-gradient-to-br from-[#252f5a] to-[#404d85] text-white p-8 shadow-md flex flex-col justify-between relative overflow-hidden min-h-[320px]">
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
								className="w-full rounded-xl bg-white py-3 text-xs font-bold text-[#404d85] shadow-lg hover:bg-blue-50 transition"
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

			{/* TRUST & GUARANTEE BADGES STRIP (EXACT REFERENCE BOTTOM BAR) */}
			<section className="bg-white border-y border-zinc-200 py-6 px-4 sm:px-8 shadow-sm">
				<div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-[#1f2430]">
					<div className="flex items-center gap-3">
						<span className="text-2xl p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-200">🛡️</span>
						<div>
							<h4 className="font-extrabold text-sm">Original Brand Products</h4>
							<p className="text-[11px] text-zinc-500 font-normal">100% Certified Direct Goods</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-2xl p-2 bg-blue-50 rounded-xl text-[#404d85] border border-blue-200">🚚</span>
						<div>
							<h4 className="font-extrabold text-sm">Nationwide Delivery</h4>
							<p className="text-[11px] text-zinc-500 font-normal">Express Shipping Available</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-2xl p-2 bg-purple-50 rounded-xl text-purple-600 border border-purple-200">🔒</span>
						<div>
							<h4 className="font-extrabold text-sm">Verified Seller Guarantee</h4>
							<p className="text-[11px] text-zinc-500 font-normal">Stripe Escrow Protection</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-2xl p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">💎</span>
						<div>
							<h4 className="font-extrabold text-sm">Best Price Guarantee</h4>
							<p className="text-[11px] text-zinc-500 font-normal">Wholesale B2B Pricing</p>
						</div>
					</div>
				</div>
			</section>

			{/* MAIN LIVE PRODUCTS CATALOG GRID */}
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
							className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-[#6678c1]/40 transition flex flex-col justify-between"
						>
							<div className="relative aspect-[4/3] bg-zinc-50 overflow-hidden border-b border-zinc-100">
								<img
									src={product.image}
									alt={product.title}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								{product.sellerOfferBadge && (
									<span className="absolute top-2.5 left-2.5 rounded-full bg-[#1f2430]/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
										{product.sellerOfferBadge}
									</span>
								)}
							</div>

							<div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
								<div className="space-y-1">
									<div className="flex justify-between items-center text-[11px] text-[#6678c1] font-bold">
										<span>{product.vendorLogo} {product.vendorName}</span>
										<span>⭐ {product.rating}</span>
									</div>
									<h3 className="font-bold text-sm text-[#1f2430] group-hover:text-[#404d85] transition line-clamp-1">{product.title}</h3>
									<p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{product.description}</p>
								</div>

								<div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
									<div>
										<div className="font-extrabold text-emerald-600 text-base">${product.price.toFixed(2)}</div>
										{product.originalPrice && (
											<div className="text-[11px] text-zinc-400 line-through">${product.originalPrice.toFixed(2)}</div>
										)}
									</div>
									<div className="flex gap-1.5">
										<button
											onClick={() => setSelectedProductQuickView(product)}
											className="rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
										>
											Details
										</button>
										<button
											onClick={() => addToCart(product)}
											className="rounded-lg bg-[#404d85] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#323d6a]"
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
