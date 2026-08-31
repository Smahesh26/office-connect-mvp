"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, Suspense, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type MedusaVendor = {
	id: string;
	slug: string;
	name: string;
	logo: string;
	banner: string;
	ownerEmail: string;
	category: string;
	rating: number;
	reviewsCount: number;
	totalProducts: number;
	grossSales: number;
	totalEarnings: number;
	payoutStatus: string;
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
	sellerOfferBadge?: string;
	stockQty: number;
	soldQty: number;
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
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f8fafc] font-sans text-[#1f2430]">Loading Marketplace...</div>}>
			<StorefrontContent />
		</Suspense>
	);
}

function StorefrontContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const activeVendorId = searchParams.get("vendor") || "All";

	const [searchTab, setSearchTab] = useState<"products" | "services">("products");
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("All");

	const [vendors, setVendors] = useState<MedusaVendor[]>([
		{
			id: "v-office-direct",
			slug: "office-direct",
			name: "Office Connect Direct 👑",
			logo: "👑",
			banner: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
			ownerEmail: "admin@camblissstudio.com",
			category: "Electronics & Gadgets",
			rating: 5.0,
			reviewsCount: 520,
			totalProducts: 2,
			grossSales: 98400.00,
			totalEarnings: 90036.00,
			payoutStatus: "Connected (Stripe Active)",
			kycVerified: true,
			location: "Global Platform HQ 🌐",
			description: "Official 1P Flagship Store for Office Connect Hardware, Smartwear & Cloud Software."
		},
		{
			id: "v-glow-beauty",
			slug: "glow-beauty",
			name: "Glow Beauty Organics 🌸",
			logo: "🌸",
			banner: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
			ownerEmail: "care@glowbeautyorganics.com",
			category: "Beauty & Personal Care",
			rating: 5.0,
			reviewsCount: 310,
			totalProducts: 2,
			grossSales: 48250.00,
			totalEarnings: 44148.75,
			payoutStatus: "Connected (Stripe Active)",
			kycVerified: true,
			location: "Paris, France 🇫🇷",
			description: "Luxury French organic skincare, cold-pressed rose extracts, and botanical lip elixirs."
		},
		{
			id: "v-acme-cloud",
			slug: "acme-cloud",
			name: "Acme Cloud Corp ☁️",
			logo: "☁️",
			banner: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
			ownerEmail: "vendors@acmecloud.io",
			category: "Enterprise Software & Cloud",
			rating: 4.8,
			reviewsCount: 94,
			totalProducts: 1,
			grossSales: 62000.00,
			totalEarnings: 56730.00,
			payoutStatus: "Connected (Stripe Active)",
			kycVerified: true,
			location: "Munich, Germany 🇩🇪",
			description: "Dedicated enterprise cloud server infrastructure, NVMe VPS nodes, and Kubernetes clusters."
		},
		{
			id: "v-autocare",
			slug: "autocare-motors",
			name: "AutoCare Garage & Motors 🚘",
			logo: "🚘",
			banner: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80",
			ownerEmail: "service@autocaregarage.com",
			category: "Automotive Parts & Services",
			rating: 4.9,
			reviewsCount: 215,
			totalProducts: 1,
			grossSales: 35400.00,
			totalEarnings: 32391.00,
			payoutStatus: "Connected (Stripe Active)",
			kycVerified: true,
			location: "Detroit, USA 🇺🇸",
			description: "100% Genuine motor oils, high-performance brake pads, and garage service bookings."
		}
	]);

	const [products, setProducts] = useState<MedusaProduct[]>([
		{
			id: "p-1",
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
			stockQty: 240,
			soldQty: 188,
			rating: 5.0,
			reviewsCount: 310,
			description: "Formulated with 100% organic Damask rose petals, cold-pressed hyaluronic acid, and botanical anti-oxidants."
		},
		{
			id: "p-2",
			sku: "SKU-BEAUTY-LIP-02",
			title: "Organic Damask Rose Lip Elixir",
			subtitle: "Cold-Pressed Botanical Shine Balm",
			image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
			vendorId: "v-glow-beauty",
			vendorName: "Glow Beauty Organics 🌸",
			vendorLogo: "🌸",
			category: "Beauty & Personal Care",
			subcategory: "Cosmetics",
			price: 32.00,
			originalPrice: 40.00,
			sellerOfferBadge: "BEST SELLER ✨",
			stockQty: 85,
			soldQty: 94,
			rating: 4.9,
			reviewsCount: 140,
			description: "Nourishing organic botanical balm for high-shine hydration and natural rose tint."
		},
		{
			id: "p-3",
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
			stockQty: 120,
			soldQty: 342,
			rating: 4.9,
			reviewsCount: 420,
			description: "Active noise-cancellation with spatial audio drivers, memory foam ear cushions, and USB-C fast charging."
		},
		{
			id: "p-4",
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
			stockQty: 90,
			soldQty: 110,
			rating: 4.9,
			reviewsCount: 156,
			description: "Aerospace-grade titanium casing with Sapphire display, multi-sport tracking, and 100m water resistance rating."
		},
		{
			id: "p-5",
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
			stockQty: 50,
			soldQty: 45,
			rating: 4.8,
			reviewsCount: 94,
			description: "Dedicated 64-Core AMD EPYC server nodes pre-configured with Kubernetes automated load balancing."
		},
		{
			id: "p-6",
			sku: "SKU-AUTO-OIL-01",
			title: "5W-40 Fully Synthetic Motor Oil (5 Liters)",
			subtitle: "100% Genuine Engine Protection",
			image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
			vendorId: "v-autocare",
			vendorName: "AutoCare Garage & Motors 🚘",
			vendorLogo: "🚘",
			category: "Automotive Parts & Services",
			subcategory: "Engine Oil",
			price: 54.00,
			originalPrice: 65.00,
			sellerOfferBadge: "SPECIAL OFFER 50% OFF",
			stockQty: 310,
			soldQty: 420,
			rating: 4.9,
			reviewsCount: 215,
			description: "Premium synthetic motor oil formulated for gasoline and diesel engines with maximum thermal stability."
		}
	]);

	const [cart, setCart] = useState<MedusaCartItem[]>([]);
	const [showCartDrawer, setShowCartDrawer] = useState(false);
	const [showCheckoutModal, setShowCheckoutModal] = useState(false);
	const [showRegisterVendorModal, setShowRegisterVendorModal] = useState(false);
	const [selectedProductQuickView, setSelectedProductQuickView] = useState<MedusaProduct | null>(null);
	const [addedToast, setAddedToast] = useState<string | null>(null);

	// New Vendor Registration Form
	const [regForm, setRegForm] = useState({
		storeName: "",
		ownerEmail: "",
		category: "Electronics & Gadgets",
		location: "",
		description: "",
		logo: "🏬"
	});

	const handleVendorRegister = (e: FormEvent) => {
		e.preventDefault();
		if (!regForm.storeName || !regForm.ownerEmail) return;
		const newId = `v-${Date.now()}`;
		const newSlug = regForm.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
		const newVendor: MedusaVendor = {
			id: newId,
			slug: newSlug,
			name: regForm.storeName,
			logo: regForm.logo || "🏬",
			banner: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
			ownerEmail: regForm.ownerEmail,
			category: regForm.category,
			rating: 5.0,
			reviewsCount: 1,
			totalProducts: 0,
			grossSales: 0,
			totalEarnings: 0,
			payoutStatus: "Connected (Stripe Auto Payout)",
			kycVerified: true,
			location: regForm.location || "Online Merchant 🌐",
			description: regForm.description || "Official seller store on Office Connect Marketplace."
		};
		setVendors([...vendors, newVendor]);
		setShowRegisterVendorModal(false);
		alert(`🎉 Congratulations! Store "${regForm.storeName}" is live! Navigating to your dedicated storefront...`);
		router.push(`/storefront?vendor=${newId}`);
	};

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
		const matchesVendor = activeVendorId === "All" || p.vendorId === activeVendorId;
		return matchesSearch && matchesCategory && matchesVendor;
	});

	const activeVendorObj = vendors.find((v) => v.id === activeVendorId);

	const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
	const platformFeeCut = cartTotal * 0.085; // 8.5%
	const vendorPayoutTotal = cartTotal - platformFeeCut;

	return (
		<div className="min-h-screen bg-[#f8fafc] font-sans text-[#1f2430] flex flex-col antialiased selection:bg-[#404d85] selection:text-white">
			
			{/* TOP UTILITY HEADER BAR */}
			<div className="bg-[#1f2430] text-white px-4 sm:px-8 py-2 text-xs font-semibold border-b border-[#252f5a]">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-6 text-blue-200">
						<span>🚚 Express Delivery Across All Vendor Stores</span>
						<span className="hidden md:inline font-normal text-zinc-300">• 1,280+ Live Buyers Online</span>
					</div>

					<div className="flex items-center gap-4 text-xs">
						<button
							onClick={() => setShowRegisterVendorModal(true)}
							className="text-amber-300 font-extrabold hover:underline"
						>
							+ Become a Seller / Register Store
						</button>
						<span>|</span>
						<Link href="/vendor-dashboard" className="text-blue-200 font-bold hover:underline">
							🔑 Seller Portal
						</Link>
					</div>
				</div>
			</div>

			{/* MAIN HEADER */}
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

					{/* Center Search Input */}
					<div className="flex-1 max-w-2xl hidden md:flex items-center rounded-xl bg-zinc-100 border border-zinc-200 px-4 py-2 text-xs focus-within:border-[#404d85] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#404d85]/10 transition">
						<span className="text-zinc-400 mr-2 text-sm">🔍</span>
						<input
							type="text"
							placeholder="Search products across all registered seller stores..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-transparent focus:outline-none text-[#1f2430] placeholder-zinc-400 font-medium"
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-3 shrink-0">
						<button
							onClick={() => setShowRegisterVendorModal(true)}
							className="rounded-xl border border-[#404d85] px-4 py-2 text-xs font-bold text-[#404d85] hover:bg-blue-50 transition"
						>
							+ Register Store
						</button>

						<button
							onClick={() => setShowCartDrawer(true)}
							className="relative flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-[#404d85] hover:bg-zinc-100 transition shadow-sm"
						>
							<span className="text-base">🛒</span>
							<span className="hidden sm:inline font-bold">Bag</span>
							{cart.length > 0 && (
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#404d85] text-[10px] font-bold text-white">
									{cart.reduce((sum, item) => sum + item.quantity, 0)}
								</span>
							)}
						</button>
					</div>

				</div>
			</header>

			{/* DEDICATED VENDOR STOREFRONT BANNER HEADER (IF FILTERED BY SPECIFIC VENDOR) */}
			{activeVendorObj && (
				<div className="relative bg-gradient-to-r from-[#1f2430] via-[#252f5a] to-[#404d85] text-white py-10 px-4 sm:px-8 border-b border-[#323d6a] overflow-hidden">
					<div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
						<div className="flex items-center gap-5">
							<div className="h-20 w-20 rounded-3xl bg-white border-4 border-white/30 shadow-2xl flex items-center justify-center text-4xl shrink-0">
								{activeVendorObj.logo}
							</div>
							<div className="space-y-1">
								<div className="flex items-center gap-2 flex-wrap">
									<h1 className="text-3xl font-black text-white">{activeVendorObj.name}</h1>
									<span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-3 py-0.5 text-xs font-bold text-emerald-200">
										✓ Verified Merchant Store
									</span>
								</div>
								<p className="text-xs text-blue-100 max-w-xl leading-relaxed">{activeVendorObj.description}</p>
								<div className="flex items-center gap-4 text-xs font-semibold text-blue-200 pt-1">
									<span>⭐ {activeVendorObj.rating} / 5.0 ({activeVendorObj.reviewsCount} reviews)</span>
									<span>•</span>
									<span>📍 {activeVendorObj.location}</span>
								</div>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row gap-3">
							<Link
								href="/storefront"
								className="rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-xs font-bold text-white hover:bg-white/20 transition text-center"
							>
								← Back to Global Marketplace
							</Link>
							<Link
								href="/vendor-dashboard"
								className="rounded-2xl bg-white px-5 py-3 text-xs font-bold text-[#404d85] hover:bg-blue-50 transition text-center shadow-lg"
							>
								Manage Seller Portal ⚙️
							</Link>
						</div>
					</div>
				</div>
			)}

			{/* ALL VENDORS QUICK FILTER BAR */}
			<div className="bg-white border-b border-zinc-200 px-4 sm:px-8 py-3 overflow-x-auto shadow-sm">
				<div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold">
					<span className="text-zinc-400 uppercase text-[10px] tracking-wider mr-2 shrink-0">Shop by Store:</span>
					<button
						onClick={() => router.push("/storefront")}
						className={`px-4 py-2 rounded-xl transition shrink-0 ${
							activeVendorId === "All" ? "bg-[#404d85] text-white shadow-md" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
						}`}
					>
						🌐 All Stores ({products.length})
					</button>
					{vendors.map((v) => (
						<button
							key={v.id}
							onClick={() => router.push(`/storefront?vendor=${v.id}`)}
							className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition shrink-0 ${
								activeVendorId === v.id ? "bg-[#404d85] text-white shadow-md" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
							}`}
						>
							<span>{v.logo}</span>
							<span>{v.name}</span>
						</button>
					))}
				</div>
			</div>

			{/* MAIN BODY CATALOG */}
			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10 space-y-6">
				<div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
					<div>
						<h2 className="text-lg font-extrabold text-[#404d85]">
							{activeVendorObj ? `Dedicated Storefront: ${activeVendorObj.name}` : "Global Multi-Vendor Catalog"}
						</h2>
						<p className="text-xs text-zinc-500">Showing {filteredProducts.length} certified items</p>
					</div>

					<button
						onClick={() => setShowRegisterVendorModal(true)}
						className="rounded-xl bg-[#404d85] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]"
					>
						+ Register As Seller Store
					</button>
				</div>

				{/* Products Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{filteredProducts.map((product) => (
						<div
							key={product.id}
							className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#6678c1]/50 transition-all duration-300 flex flex-col justify-between"
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
									<Link href={`/storefront?vendor=${product.vendorId}`} className="flex justify-between items-center text-[11px] text-[#6678c1] font-bold hover:underline">
										<span>{product.vendorLogo} {product.vendorName}</span>
										<span>⭐ {product.rating}</span>
									</Link>
									<h3 className="font-extrabold text-sm text-[#1f2430] group-hover:text-[#404d85] transition line-clamp-1">{product.title}</h3>
									<p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{product.description}</p>
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
											onClick={() => addToCart(product)}
											className="rounded-xl bg-[#404d85] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#323d6a] transition"
										>
											+ Add to Bag
										</button>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</main>

			{/* SHOPPING BAG DRAWER */}
			{showCartDrawer && (
				<div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm">
					<div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between relative space-y-4">
						<div>
							<div className="flex justify-between items-center border-b border-zinc-200 pb-4">
								<h2 className="text-lg font-bold text-[#404d85]">🛒 Shopping Bag ({cart.length})</h2>
								<button onClick={() => setShowCartDrawer(false)} className="text-zinc-400 font-bold text-xl">✕</button>
							</div>

							<div className="divide-y divide-zinc-100 max-h-[60vh] overflow-y-auto mt-4 space-y-3">
								{cart.map((item) => (
									<div key={item.product.id} className="py-3 flex items-center gap-3">
										<img src={item.product.image} alt={item.product.title} className="w-12 h-12 rounded-xl object-cover border border-zinc-200" />
										<div className="flex-1 min-w-0">
											<h4 className="font-bold text-xs text-[#1f2430] truncate">{item.product.title}</h4>
											<div className="text-[11px] text-zinc-500 font-medium">Qty: {item.quantity} • ${item.product.price.toFixed(2)}</div>
										</div>
										<div className="font-bold text-emerald-600 text-xs">${(item.product.price * item.quantity).toFixed(2)}</div>
									</div>
								))}
							</div>
						</div>

						<div className="border-t border-zinc-200 pt-4 space-y-3">
							<div className="flex justify-between text-xs font-bold">
								<span>Subtotal:</span>
								<span className="text-emerald-600 text-base font-black">${cartTotal.toFixed(2)}</span>
							</div>
							<div className="text-[11px] text-zinc-400 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
								💳 Automatic Escrow Split: <span className="font-bold text-zinc-700">${vendorPayoutTotal.toFixed(2)}</span> to Seller Store • <span className="font-bold text-[#404d85]">${platformFeeCut.toFixed(2)}</span> to Office Connect Platform.
							</div>
							<button
								onClick={() => {
									setShowCartDrawer(false);
									setShowCheckoutModal(true);
								}}
								className="w-full rounded-2xl bg-[#404d85] py-3.5 text-xs font-bold text-white shadow-xl hover:bg-[#323d6a]"
							>
								Proceed to 1-Click Checkout 💳
							</button>
						</div>
					</div>
				</div>
			)}

			{/* VENDOR REGISTER MODAL */}
			{showRegisterVendorModal && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
					<div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative border border-zinc-200 space-y-4">
						<button onClick={() => setShowRegisterVendorModal(false)} className="absolute right-5 top-5 text-zinc-400 font-bold text-lg">✕</button>
						<h2 className="text-lg font-bold text-[#404d85]">🏬 Register Vendor Seller Store</h2>
						<p className="text-xs text-zinc-500">Create your official storefront and start selling in 1 minute.</p>

						<form onSubmit={handleVendorRegister} className="space-y-3 text-xs font-medium">
							<div>
								<label className="block font-bold text-zinc-700">Store Name *</label>
								<input
									type="text"
									required
									placeholder="e.g. Apex Electronics ⚡"
									value={regForm.storeName}
									onChange={(e) => setRegForm({ ...regForm, storeName: e.target.value })}
									className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-bold text-zinc-700">Business Email *</label>
									<input
										type="email"
										required
										placeholder="vendor@company.com"
										value={regForm.ownerEmail}
										onChange={(e) => setRegForm({ ...regForm, ownerEmail: e.target.value })}
										className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs"
									/>
								</div>
								<div>
									<label className="block font-bold text-zinc-700">Primary Category</label>
									<select
										value={regForm.category}
										onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
										className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-[#404d85]"
									>
										<option value="Electronics & Gadgets">Electronics & Gadgets</option>
										<option value="Beauty & Personal Care">Beauty & Personal Care</option>
										<option value="Enterprise Software & Cloud">Enterprise Software & Cloud</option>
										<option value="Automotive Parts & Services">Automotive Parts & Services</option>
									</select>
								</div>
							</div>

							<div>
								<label className="block font-bold text-zinc-700">Store Location</label>
								<input
									type="text"
									placeholder="e.g. London, UK 🇬🇧"
									value={regForm.location}
									onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
									className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs"
								/>
							</div>

							<div>
								<label className="block font-bold text-zinc-700">Store Description</label>
								<textarea
									rows={2}
									placeholder="Describe your products..."
									value={regForm.description}
									onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
									className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs"
								/>
							</div>

							<button type="submit" className="w-full rounded-xl bg-[#404d85] py-3 text-xs font-bold text-white shadow-lg hover:bg-[#323d6a]">
								Create Dedicated Vendor Storefront
							</button>
						</form>
					</div>
				</div>
			)}

		</div>
	);
}
