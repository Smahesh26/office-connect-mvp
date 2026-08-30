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

	// Multi-Vendor Curated Catalog
	const [products, setProducts] = useState<MedusaProduct[]>([
		{
			id: "p-flagship-1",
			sku: "SKU-BEAUTY-ROSE-01",
			title: "Damask Rose Hydrating Botanical Serum",
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
			description: "Formulated with 100% organic Damask rose petals, cold-pressed hyaluronic acid, and botanical anti-oxidants to restore natural skin vitality.",
			features: [
				"100% Certified Organic & Vegan",
				"Deep 24-Hour Hydration Barrier",
				"Dermatologically Tested in France"
			]
		},
		{
			id: "p-flagship-2",
			sku: "SKU-AUDIO-ANC-02",
			title: "Wireless ANC Studio Noise-Cancelling Headphones",
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
			description: "Active noise-cancellation with spatial audio drivers, memory foam ear cushions, and instant USB-C fast charging.",
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
			description: "Dedicated 64-Core AMD EPYC server nodes pre-configured with Kubernetes automated load balancing and 99.999% SLA uptime.",
			features: [
				"256 GB ECC DDR5 High-Speed RAM",
				"Automated DDoS Protection & Daily Backups",
				"ISO-27001 & SOC2 Compliant Data Centers"
			]
		},
		{
			id: "p-flagship-4",
			sku: "SKU-SMARTWATCH-04",
			title: "Ultra Titanium Fitness & Health Smartwatch",
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
			description: "Aerospace-grade titanium casing with Sapphire crystal display, multi-sport tracking, and 100m water resistance rating.",
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
		<div className="min-h-screen bg-[#f8fafc] font-sans text-[#1f2430] flex flex-col">
			
			{/* TOP ANNOUNCEMENT BAR */}
			<div className="bg-[#1f2430] text-white px-4 py-2 text-center text-xs font-semibold tracking-wide flex justify-between items-center border-b border-[#252f5a]">
				<div className="hidden sm:block text-[11px] text-zinc-300">
					📦 Free Express Delivery on Orders Over $100
				</div>
				<div className="mx-auto sm:mx-0 font-medium">
					🎉 Welcome to <span className="font-extrabold text-[#6678c1]">Office Connect</span> Multi-Vendor Marketplace
				</div>
				<div className="hidden md:flex gap-4 text-[11px]">
					<button onClick={() => setShowProductUploadModal(true)} className="hover:underline text-blue-200">
						🔑 Seller Sign In / Upload Product
					</button>
					<span className="opacity-40">|</span>
					<a href="/login" className="hover:underline text-blue-200">
						👤 Customer Login
					</a>
				</div>
			</div>

			{/* MAIN FLAGSHIP E-COMMERCE HEADER */}
			<header className="sticky top-0 z-40 bg-white border-b border-zinc-200/80 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-6">
					
					{/* Brand Logo */}
					<Link href="/storefront" className="flex items-center gap-3">
						<Image
							src="/officeconnectlogo.png"
							alt="Office Connect"
							width={180}
							height={48}
							priority
							className="h-11 w-auto object-contain"
						/>
						<div className="border-l border-zinc-200 pl-3 hidden sm:block">
							<span className="text-[10px] font-black text-[#404d85] uppercase tracking-widest block">MARKETPLACE</span>
							<span className="text-[9px] font-semibold text-[#6678c1] block -mt-0.5">VERIFIED STORES</span>
						</div>
					</Link>

					{/* Search Input */}
					<div className="flex-1 max-w-2xl hidden md:flex items-center rounded-xl border border-zinc-300 bg-[#f8fafc] focus-within:border-[#404d85] focus-within:ring-2 focus-within:ring-[#404d85]/10 transition overflow-hidden shadow-inner">
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="bg-zinc-100 text-xs font-bold text-[#404d85] px-3.5 py-3 border-r border-zinc-300 focus:outline-none cursor-pointer"
						>
							{categories.map((c) => (
								<option key={c} value={c}>{c}</option>
							))}
						</select>
						<input
							type="text"
							placeholder="Search cosmetics, cloud servers, audio, electronics, or seller stores..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full px-4 py-2.5 text-xs bg-transparent focus:outline-none text-[#1f2430] placeholder-zinc-400 font-medium"
						/>
						<button className="bg-[#404d85] text-white px-5 py-3 text-xs font-bold hover:bg-[#323d6a] transition flex items-center gap-1">
							🔍 Search
						</button>
					</div>

					{/* Action Controls */}
					<div className="flex items-center gap-3">
						<button
							onClick={() => setShowProductUploadModal(true)}
							className="rounded-xl bg-[#404d85] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#323d6a] transition"
						>
							+ Upload Product
						</button>

						<button
							onClick={() => setShowCartDrawer(true)}
							className="relative rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-[#404d85] shadow-sm hover:bg-zinc-50 transition flex items-center gap-1.5"
						>
							<span className="text-base">🛒</span>
							<span className="hidden sm:inline">Bag</span>
							{cart.length > 0 && (
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#404d85] text-[10px] font-bold text-white shadow-sm">
									{cart.reduce((sum, item) => sum + item.quantity, 0)}
								</span>
							)}
						</button>
					</div>
				</div>
			</header>

			{/* CATEGORY SELECTION PILLS */}
			<div className="bg-white border-b border-zinc-200 px-4 sm:px-8 py-2.5 overflow-x-auto shadow-sm">
				<div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold">
					<span className="text-zinc-400 uppercase text-[10px] tracking-wider mr-2">Categories:</span>
					{categories.map((cat) => (
						<button
							key={cat}
							onClick={() => setCategoryFilter(cat)}
							className={`px-4 py-1.5 rounded-xl transition ${
								categoryFilter === cat ? "bg-[#404d85] text-white shadow-md" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
							}`}
						>
							{cat}
						</button>
					))}
				</div>
			</div>

			{/* HIGH-IMPACT HERO FEATURED BANNER */}
			{selectedVendorFilter === "All" && (
				<div className="bg-gradient-to-r from-[#1f2430] via-[#252f5a] to-[#404d85] text-white py-12 px-4 sm:px-8 shadow-inner">
					<div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
						
						<div className="space-y-4 text-center lg:text-left max-w-2xl">
							<span className="inline-flex items-center gap-2 rounded-full bg-[#6678c1]/20 border border-[#6678c1]/40 px-3.5 py-1 text-xs font-extrabold text-blue-200">
								🏬 Verified Brand Collections
							</span>
							<h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
								Discover Premier Brands & Direct Seller Stores
							</h1>
							<p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
								Explore certified organic cosmetics, high-performance audio hardware, enterprise cloud servers, and multi-vendor products.
							</p>
							<div className="flex justify-center lg:justify-start gap-3 pt-2">
								<button
									onClick={() => setShowProductUploadModal(true)}
									className="rounded-xl bg-white px-6 py-3 text-xs font-bold text-[#404d85] shadow-lg hover:bg-blue-50 transition"
								>
									+ Upload Product
								</button>
							</div>
						</div>

						{/* Hero Product Spotlight Card */}
						<div className="w-full max-w-sm rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-2xl text-white space-y-4">
							<div className="flex justify-between items-center">
								<span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-3 py-0.5 text-[10px] font-bold text-emerald-200">
									Featured Product
								</span>
								<span className="text-xs font-bold text-blue-200">⭐ 5.0</span>
							</div>
							<img
								src={products[0].image}
								alt={products[0].title}
								className="w-full h-44 object-cover rounded-2xl border border-white/20 shadow-md"
							/>
							<div>
								<h3 className="font-extrabold text-base text-white">{products[0].title}</h3>
								<p className="text-xs text-blue-200 line-clamp-1">{products[0].subtitle}</p>
							</div>
							<div className="flex justify-between items-center pt-2 border-t border-white/10">
								<span className="text-lg font-black text-emerald-300">${products[0].price.toFixed(2)}</span>
								<button
									onClick={() => setSelectedProductQuickView(products[0])}
									className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#404d85] hover:bg-blue-50 shadow-md"
								>
									View Details ↗
								</button>
							</div>
						</div>

					</div>
				</div>
			)}

			{/* VENDOR STOREFRONT HEADER (IF FILTERED BY VENDOR) */}
			{activeVendorObj && (
				<div className="bg-gradient-to-r from-[#252f5a] to-[#404d85] text-white py-8 px-4 sm:px-8 border-b border-[#323d6a]">
					<div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
						<div className="flex items-center gap-5">
							<div className="h-16 w-16 rounded-2xl bg-white border-2 border-white/30 shadow-lg flex items-center justify-center text-3xl">
								{activeVendorObj.logo}
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h1 className="text-2xl font-black">{activeVendorObj.name}</h1>
									<span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-2.5 py-0.5 text-xs font-bold text-emerald-200">
										✓ Verified Seller
									</span>
								</div>
								<p className="mt-0.5 text-xs text-blue-100">{activeVendorObj.description}</p>
								<div className="mt-2 flex items-center gap-4 text-xs font-semibold text-blue-200">
									<span>⭐ {activeVendorObj.rating} / 5.0</span>
									<span>•</span>
									<span>📍 {activeVendorObj.location}</span>
								</div>
							</div>
						</div>
						<button
							onClick={() => setSelectedVendorFilter("All")}
							className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
						>
							← Back to All Marketplace Stores
						</button>
					</div>
				</div>
			)}

			{/* MAIN BODY CATALOG */}
			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					
					{/* LEFT VENDOR STORES SIDEBAR */}
					<aside className="space-y-6">
						<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
							<h3 className="text-xs font-extrabold text-[#404d85] uppercase tracking-wider border-b border-zinc-200 pb-2">
								🏬 Verified Seller Stores ({vendors.length})
							</h3>
							<div className="space-y-2 max-h-72 overflow-y-auto">
								<button
									onClick={() => setSelectedVendorFilter("All")}
									className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
										selectedVendorFilter === "All" ? "bg-[#404d85] text-white shadow-md" : "hover:bg-zinc-100 text-zinc-800"
									}`}
								>
									<span>All Marketplace Stores</span>
									<span>({products.length})</span>
								</button>
								{vendors.map((v) => (
									<button
										key={v.id}
										onClick={() => setSelectedVendorFilter(v.id)}
										className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
											selectedVendorFilter === v.id ? "bg-[#404d85] text-white shadow-md" : "hover:bg-zinc-100 text-zinc-800"
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

						{/* CTA Card */}
						<div className="rounded-2xl bg-gradient-to-br from-[#404d85] to-[#1f2430] p-6 text-white space-y-3 shadow-md">
							<h3 className="font-extrabold text-sm">Are you a Vendor?</h3>
							<p className="text-xs text-blue-100 leading-relaxed">
								List your products directly into the live e-commerce marketplace catalog.
							</p>
							<button
								onClick={() => setShowProductUploadModal(true)}
								className="w-full rounded-xl bg-white py-2.5 text-xs font-bold text-[#404d85] shadow-md hover:bg-blue-50 transition"
							>
								+ Upload Product Now
							</button>
						</div>
					</aside>

					{/* RIGHT PRODUCTS GRID */}
					<section className="lg:col-span-3 space-y-6">
						<div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
							<div>
								<h2 className="text-base font-extrabold text-[#404d85]">
									{selectedVendorFilter === "All"
										? "Live Products Catalog"
										: `Storefront: ${activeVendorObj?.name || "Vendor Products"}`}
								</h2>
								<p className="text-xs text-zinc-500">Showing {filteredProducts.length} certified listings</p>
							</div>
							<button
								onClick={() => setShowProductUploadModal(true)}
								className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]"
							>
								+ Upload Product
							</button>
						</div>

						{/* Product Cards Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredProducts.map((product) => (
								<div
									key={product.id}
									className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-[#6678c1]/40 transition-all duration-300 flex flex-col justify-between"
								>
									<div className="relative aspect-[4/3] bg-zinc-50 overflow-hidden">
										<img
											src={product.image}
											alt={product.title}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
										/>
										{product.sellerOfferBadge && (
											<span className="absolute top-3 left-3 rounded-full bg-[#1f2430]/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold text-white shadow-md">
												{product.sellerOfferBadge}
											</span>
										)}
									</div>

									<div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
										<div className="space-y-1.5">
											<div className="flex justify-between items-center text-[11px] text-[#6678c1] font-bold">
												<span>{product.vendorLogo} {product.vendorName}</span>
												<span>⭐ {product.rating}</span>
											</div>
											<h3 className="font-extrabold text-sm text-[#1f2430] group-hover:text-[#404d85] transition">{product.title}</h3>
											<p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{product.description}</p>
										</div>

										<div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
											<div>
												<div className="text-base font-black text-emerald-600">${product.price.toFixed(2)}</div>
												{product.originalPrice && (
													<div className="text-xs text-zinc-400 line-through">${product.originalPrice.toFixed(2)}</div>
												)}
											</div>
											<div className="flex gap-1.5">
												<button
													onClick={() => setSelectedProductQuickView(product)}
													className="rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
												>
													Details
												</button>
												<button
													onClick={() => addToCart(product)}
													className="rounded-xl bg-[#404d85] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]"
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
					<div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl relative border border-zinc-200 max-h-[90vh] overflow-y-auto space-y-6">
						<button
							onClick={() => setSelectedProductQuickView(null)}
							className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 text-xl font-bold"
						>
							✕
						</button>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
							<img
								src={selectedProductQuickView.image}
								alt={selectedProductQuickView.title}
								className="w-full aspect-square object-cover rounded-2xl border border-zinc-200 shadow-md"
							/>

							<div className="space-y-3">
								<span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
									{selectedProductQuickView.category}
								</span>
								<h2 className="text-xl font-extrabold text-[#404d85]">{selectedProductQuickView.title}</h2>
								<p className="text-xs text-zinc-600 leading-relaxed">{selectedProductQuickView.description}</p>

								{selectedProductQuickView.features && (
									<ul className="space-y-1 text-xs text-zinc-700 list-disc pl-4 font-medium">
										{selectedProductQuickView.features.map((feat, i) => (
											<li key={i}>{feat}</li>
										))}
									</ul>
								)}

								<div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
									<span className="text-2xl font-black text-emerald-600">${selectedProductQuickView.price.toFixed(2)}</span>
									<button
										onClick={() => {
											addToCart(selectedProductQuickView);
											setSelectedProductQuickView(null);
										}}
										className="rounded-xl bg-[#404d85] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]"
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
					<div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto border border-zinc-200 space-y-4">
						<button onClick={() => setShowProductUploadModal(false)} className="absolute right-6 top-6 text-zinc-400 font-bold text-xl">✕</button>
						<h2 className="text-xl font-extrabold text-[#404d85]">+ Upload New Product</h2>
						<p className="text-xs text-zinc-500">Publish product directly into the live marketplace catalog.</p>
						<form onSubmit={(e) => {
							e.preventDefault();
							alert("🎉 Product published to live Storefront!");
							setShowProductUploadModal(false);
						}} className="space-y-3 text-xs">
							<div>
								<label className="block font-bold text-zinc-700">Product Title *</label>
								<input type="text" required placeholder="e.g. Wireless ANC Studio Headphones" className="w-full rounded-xl border border-zinc-300 p-3 text-xs" />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-bold text-zinc-700">Category *</label>
									<input type="text" required placeholder="Electronics & Gadgets" className="w-full rounded-xl border border-zinc-300 p-3 text-xs" />
								</div>
								<div>
									<label className="block font-bold text-zinc-700">Price ($) *</label>
									<input type="number" step="0.01" required placeholder="249.00" className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-bold text-emerald-600" />
								</div>
							</div>
							<div>
								<label className="block font-bold text-zinc-700">Image URL</label>
								<input type="url" placeholder="https://images.unsplash.com/..." className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-mono" />
							</div>
							<div>
								<label className="block font-bold text-zinc-700">Description</label>
								<textarea rows={3} placeholder="Product description..." className="w-full rounded-xl border border-zinc-300 p-3 text-xs" />
							</div>
							<button type="submit" className="w-full rounded-xl bg-[#404d85] py-3.5 text-xs font-bold text-white shadow-lg hover:bg-[#323d6a]">Publish Product</button>
						</form>
					</div>
				</div>
			)}

		</div>
	);
}
