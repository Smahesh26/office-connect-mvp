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
	payoutStatus: "Connected (Active)" | "Pending Onboarding";
	kycVerified: boolean;
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
	wholesaleB2bPrice?: number;
	sellerOfferBadge?: string;
	stockQty: number;
	rating: number;
	reviewsCount: number;
	description: string;
	features?: string[];
};

type MedusaCartItem = {
	product: MedusaProduct;
	quantity: number;
};

export default function StorefrontPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f8fafc] font-sans text-[#1f2430]">Loading Storefront...</div>}>
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
	const [selectedProductQuickView, setSelectedProductQuickView] = useState<MedusaProduct | null>(null);

	const [cart, setCart] = useState<MedusaCartItem[]>([]);
	const [showCartDrawer, setShowCartDrawer] = useState(false);
	const [showProductUploadModal, setShowProductUploadModal] = useState(false);

	const [products, setProducts] = useState<MedusaProduct[]>([
		{
			id: "p-flagship-1",
			sku: "SKU-BEAUTY-ROSE-01",
			title: "Damask Rose Botanical Hydrating Serum",
			subtitle: "Organic French Grasse Rose Extract",
			image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
			vendorId: "v-glow-beauty",
			vendorName: "Glow Beauty Organics 🌸",
			vendorLogo: "🌸",
			category: "Beauty & Personal Care",
			subcategory: "Skincare & Serums",
			price: 68.00,
			originalPrice: 85.00,
			wholesaleB2bPrice: 48.00,
			sellerOfferBadge: "Featured Choice ✨",
			stockQty: 240,
			rating: 5.0,
			reviewsCount: 310,
			description: "Formulated with 100% organic Damask rose petals, cold-pressed hyaluronic acid, and botanical anti-oxidants for skin hydration.",
			features: [
				"100% Certified Organic & Vegan",
				"Deep 24-Hour Hydration Barrier",
				"Dermatologically Tested in France"
			]
		},
		{
			id: "p-flagship-2",
			sku: "SKU-AUDIO-ANC-02",
			title: "Wireless ANC Noise-Cancelling Headphones",
			subtitle: "Hi-Res Audio with 40-Hour Battery",
			image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
			vendorId: "v-office-direct",
			vendorName: "Office Connect Direct 👑",
			vendorLogo: "👑",
			category: "Electronics & Gadgets",
			subcategory: "Audio & Headphones",
			price: 249.00,
			originalPrice: 299.00,
			wholesaleB2bPrice: 190.00,
			sellerOfferBadge: "Best Seller 🔥",
			stockQty: 120,
			rating: 4.9,
			reviewsCount: 420,
			description: "Active noise-cancellation with spatial audio drivers, memory foam ear cushions, and USB-C fast charging.",
			features: [
				"Hybrid Active Noise Cancellation (-38dB)",
				"40 Hours Continuous Battery Life",
				"Dual Device Bluetooth 5.3 Multipoint"
			]
		},
		{
			id: "p-flagship-3",
			sku: "SKU-CLOUD-CLUSTER-03",
			title: "Kubernetes Enterprise Cloud Cluster Node",
			subtitle: "Dedicated Multi-Region NVMe VPS",
			image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
			vendorId: "v-acme-cloud",
			vendorName: "Acme Cloud Corp ☁️",
			vendorLogo: "☁️",
			category: "Enterprise Software & Cloud",
			subcategory: "Server Hosting",
			price: 499.00,
			originalPrice: 599.00,
			wholesaleB2bPrice: 399.00,
			sellerOfferBadge: "Enterprise Deal ⚡",
			stockQty: 50,
			rating: 4.8,
			reviewsCount: 94,
			description: "Dedicated 64-Core AMD EPYC server nodes pre-configured with Kubernetes automated load balancing.",
			features: [
				"256 GB ECC DDR5 High-Speed RAM",
				"Automated DDoS Protection & Daily Backups",
				"ISO-27001 & SOC2 Compliant Data Centers"
			]
		},
		{
			id: "p-flagship-4",
			sku: "SKU-SMARTWATCH-04",
			title: "Titanium Fitness & Health Smartwatch",
			subtitle: "GPS Navigation & Cardiac Monitor",
			image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
			vendorId: "v-office-direct",
			vendorName: "Office Connect Direct 👑",
			vendorLogo: "👑",
			category: "Electronics & Gadgets",
			subcategory: "Smartwatches",
			price: 349.00,
			originalPrice: 399.00,
			wholesaleB2bPrice: 280.00,
			sellerOfferBadge: "New Arrival 🌟",
			stockQty: 90,
			rating: 4.9,
			reviewsCount: 156,
			description: "Aerospace-grade titanium casing with Sapphire display, multi-sport tracking, and 100m water resistance rating.",
			features: [
				"Dual-Frequency Precision GPS",
				"ECG & SpO2 Continuous Health Sensors",
				"14-Day Extended Battery Life"
			]
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
			payoutStatus: "Connected (Active)",
			kycVerified: true,
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
			payoutStatus: "Connected (Active)",
			kycVerified: true,
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
			payoutStatus: "Connected (Active)",
			kycVerified: true,
			location: "Munich, Germany 🇩🇪",
			description: "High-performance enterprise cloud servers and Kubernetes infrastructure."
		}
	];

	const categories = ["All", "Electronics & Gadgets", "Beauty & Personal Care", "Enterprise Software & Cloud"];

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
		const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
		const matchesVendor = selectedVendorFilter === "All" || p.vendorId === selectedVendorFilter;
		return matchesSearch && matchesCategory && matchesVendor;
	});

	const activeVendorObj = vendors.find((v) => v.id === selectedVendorFilter);

	return (
		<div className="min-h-screen bg-[#f8fafc] font-sans text-[#1f2430] flex flex-col antialiased">
			
			{/* TOP UTILITY ANNOUNCEMENT BAR */}
			<div className="bg-[#1f2430] text-white px-4 sm:px-6 py-2 text-center text-xs font-medium tracking-wide flex justify-between items-center border-b border-[#252f5a]">
				<div className="hidden md:block text-[11px] text-zinc-300">
					🚚 Free Express Delivery & Verified Merchant Protection
				</div>
				<div className="mx-auto md:mx-0 text-xs">
					Welcome to <span className="font-bold text-[#6678c1]">Office Connect</span> Multi-Vendor Marketplace
				</div>
				<div className="hidden md:flex gap-4 text-[11px]">
					<button onClick={() => setShowProductUploadModal(true)} className="hover:underline text-blue-200 font-semibold">
						+ Seller Upload
					</button>
					<span className="opacity-40">|</span>
					<a href="/login" className="hover:underline text-blue-200 font-semibold">
						Sign In
					</a>
				</div>
			</div>

			{/* PROPORTIONAL MAIN HEADER & EXACT SAAS LOGO SIZING */}
			<header className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 sm:gap-6">
					
					{/* Office Connect Brand Logo - Matches SaaS Workspace Shell Proportions */}
					<Link href="/storefront" className="flex items-center gap-3 shrink-0">
						<Image
							src="/officeconnectlogo.png"
							alt="Office Connect"
							width={220}
							height={56}
							priority
							className="h-10 sm:h-12 w-auto object-contain"
						/>
						<div className="border-l border-zinc-200 pl-3 hidden lg:block">
							<span className="text-[10px] font-bold text-[#404d85] uppercase tracking-wider block">MARKETPLACE</span>
							<span className="text-[9px] text-zinc-400 font-medium block -mt-0.5">OFFICIAL HUB</span>
						</div>
					</Link>

					{/* Search Engine Input */}
					<div className="flex-1 max-w-xl hidden md:flex items-center rounded-xl border border-zinc-300 bg-[#f8fafc] focus-within:border-[#404d85] focus-within:ring-2 focus-within:ring-[#404d85]/10 transition overflow-hidden shadow-inner">
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="bg-zinc-100 text-xs font-semibold text-[#404d85] px-3 py-2.5 border-r border-zinc-300 focus:outline-none cursor-pointer"
						>
							{categories.map((c) => (
								<option key={c} value={c}>{c}</option>
							))}
						</select>
						<input
							type="text"
							placeholder="Search products, cosmetics, electronics, or sellers..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full px-3.5 py-2 text-xs bg-transparent focus:outline-none text-[#1f2430] placeholder-zinc-400 font-medium"
						/>
						<button className="bg-[#404d85] text-white px-4 py-2 text-xs font-bold hover:bg-[#323d6a] transition flex items-center gap-1">
							Search
						</button>
					</div>

					{/* Right Action Controls */}
					<div className="flex items-center gap-2.5 shrink-0">
						<button
							onClick={() => setShowProductUploadModal(true)}
							className="rounded-xl bg-[#404d85] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6a] transition"
						>
							+ Upload Product
						</button>

						<button
							onClick={() => setShowCartDrawer(true)}
							className="relative rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#404d85] shadow-sm hover:bg-zinc-50 transition flex items-center gap-1.5"
						>
							<span className="text-sm">🛒</span>
							<span className="hidden sm:inline font-bold">Cart</span>
							{cart.length > 0 && (
								<span className="ml-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#404d85] text-[10px] font-bold text-white shadow-sm">
									{cart.reduce((sum, item) => sum + item.quantity, 0)}
								</span>
							)}
						</button>
					</div>
				</div>
			</header>

			{/* CATEGORY BAR */}
			<div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-2 overflow-x-auto shadow-sm">
				<div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-semibold">
					<span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mr-2 shrink-0">Browse Categories:</span>
					{categories.map((cat) => (
						<button
							key={cat}
							onClick={() => setCategoryFilter(cat)}
							className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
								categoryFilter === cat ? "bg-[#404d85] text-white shadow-sm" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
							}`}
						>
							{cat}
						</button>
					))}
				</div>
			</div>

			{/* ELEGANT HERO BANNER WITH PROPORTIONAL TYPOGRAPHY */}
			{selectedVendorFilter === "All" && (
				<div className="bg-gradient-to-r from-[#1f2430] via-[#252f5a] to-[#404d85] text-white py-8 sm:py-10 px-4 sm:px-8 border-b border-[#252f5a]">
					<div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
						
						<div className="space-y-3 text-center md:text-left max-w-xl">
							<span className="inline-block rounded-full bg-[#6678c1]/20 border border-[#6678c1]/40 px-3 py-0.5 text-xs font-bold text-blue-200">
								🏬 Office Connect Verified Marketplace
							</span>
							<h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
								Explore Verified Sellers & Direct Storefronts
							</h1>
							<p className="text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed">
								Browse organic skincare, cloud servers, audio devices, and multi-vendor products directly from certified merchants.
							</p>
							<div className="pt-1 flex justify-center md:justify-start gap-3">
								<button
									onClick={() => setShowProductUploadModal(true)}
									className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#404d85] shadow-md hover:bg-blue-50 transition"
								>
									+ Upload Product Listing
								</button>
							</div>
						</div>

						{/* Featured Highlight Card */}
						<div className="w-full max-w-sm rounded-2xl bg-white/10 border border-white/20 p-4 shadow-xl text-white space-y-3">
							<div className="flex justify-between items-center text-xs">
								<span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
									Featured Product
								</span>
								<span className="font-bold text-blue-200">⭐ 5.0</span>
							</div>
							<img
								src={products[0].image}
								alt={products[0].title}
								className="w-full h-36 object-cover rounded-xl border border-white/20 shadow-sm"
							/>
							<div>
								<h3 className="font-bold text-sm text-white">{products[0].title}</h3>
								<p className="text-xs text-blue-200 line-clamp-1">{products[0].subtitle}</p>
							</div>
							<div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
								<span className="font-extrabold text-emerald-300 text-base">${products[0].price.toFixed(2)}</span>
								<button
									onClick={() => setSelectedProductQuickView(products[0])}
									className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#404d85] hover:bg-blue-50"
								>
									Details ↗
								</button>
							</div>
						</div>

					</div>
				</div>
			)}

			{/* MAIN BODY CATALOG */}
			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					
					{/* LEFT VENDOR STORES SIDEBAR */}
					<aside className="space-y-6">
						<div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3">
							<h3 className="text-xs font-bold text-[#404d85] uppercase tracking-wider border-b border-zinc-200 pb-2">
								🏬 Registered Seller Stores ({vendors.length})
							</h3>
							<div className="space-y-1.5 max-h-64 overflow-y-auto">
								<button
									onClick={() => setSelectedVendorFilter("All")}
									className={`w-full text-left p-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
										selectedVendorFilter === "All" ? "bg-[#404d85] text-white shadow-sm" : "hover:bg-zinc-100 text-zinc-800"
									}`}
								>
									<span>All Marketplace Stores</span>
									<span>({products.length})</span>
								</button>
								{vendors.map((v) => (
									<button
										key={v.id}
										onClick={() => setSelectedVendorFilter(v.id)}
										className={`w-full text-left p-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
											selectedVendorFilter === v.id ? "bg-[#404d85] text-white shadow-sm" : "hover:bg-zinc-100 text-zinc-800"
										}`}
									>
										<span className="flex items-center gap-2 truncate">
											<span>{v.logo}</span>
											<span className="truncate">{v.name}</span>
										</span>
										<span className="text-[10px] opacity-75">
											({products.filter((p) => p.vendorId === v.id).length})
										</span>
									</button>
								))}
							</div>
						</div>
					</aside>

					{/* RIGHT PRODUCTS GRID */}
					<section className="lg:col-span-3 space-y-6">
						<div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
							<div>
								<h2 className="text-base font-extrabold text-[#404d85]">
									{selectedVendorFilter === "All"
										? "Live Product Catalog"
										: `Storefront: ${activeVendorObj?.name || "Vendor Products"}`}
								</h2>
								<p className="text-xs text-zinc-500">Showing {filteredProducts.length} verified items</p>
							</div>
							<button
								onClick={() => setShowProductUploadModal(true)}
								className="rounded-xl bg-[#404d85] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6a]"
							>
								+ Upload Product
							</button>
						</div>

						{/* Product Cards Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredProducts.map((product) => (
								<div
									key={product.id}
									className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-[#6678c1]/40 transition flex flex-col justify-between"
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
					</section>
				</div>
			</main>

			{/* PRODUCT DETAILS MODAL */}
			{selectedProductQuickView && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
					<div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl relative border border-zinc-200 max-h-[90vh] overflow-y-auto space-y-4">
						<button
							onClick={() => setSelectedProductQuickView(null)}
							className="absolute right-5 top-5 text-zinc-400 hover:text-zinc-600 text-lg font-bold"
						>
							✕
						</button>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
							<img
								src={selectedProductQuickView.image}
								alt={selectedProductQuickView.title}
								className="w-full aspect-square object-cover rounded-xl border border-zinc-200 shadow-sm"
							/>

							<div className="space-y-2.5">
								<span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
									{selectedProductQuickView.category}
								</span>
								<h2 className="text-lg font-bold text-[#404d85]">{selectedProductQuickView.title}</h2>
								<p className="text-xs text-zinc-600 leading-relaxed">{selectedProductQuickView.description}</p>

								{selectedProductQuickView.features && (
									<ul className="space-y-1 text-xs text-zinc-700 list-disc pl-4 font-medium">
										{selectedProductQuickView.features.map((feat, i) => (
											<li key={i}>{feat}</li>
										))}
									</ul>
								)}

								<div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
									<span className="text-xl font-extrabold text-emerald-600">${selectedProductQuickView.price.toFixed(2)}</span>
									<button
										onClick={() => {
											addToCart(selectedProductQuickView);
											setSelectedProductQuickView(null);
										}}
										className="rounded-xl bg-[#404d85] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6a]"
									>
										+ Add to Cart
									</button>
								</div>
							</div>
						</div>
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
