"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, Suspense, FormEvent, MouseEvent } from "react";
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
	totalSalesVolume: number;
	commissionRate: number;
	stripeConnectId: string;
	payoutStatus: "Connected (Active)" | "Pending Onboarding";
	kycVerified: boolean;
	location: string;
	joinedDate: string;
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
	specs?: { label: string; value: string }[];
	colors?: string[];
};

type MedusaCartItem = {
	product: MedusaProduct;
	quantity: number;
	selectedColor?: string;
};

export default function Apple3DStorefrontPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#eef2fa] font-sans text-[#1f2430]">Loading Office Connect 3D Experience...</div>}>
			<Apple3DStorefrontContent />
		</Suspense>
	);
}

function Apple3DStorefrontContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialVendorFilter = searchParams.get("vendor") || "All";

	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("All");
	const [selectedVendorFilter, setSelectedVendorFilter] = useState(initialVendorFilter);
	const [selectedProductQuickView, setSelectedProductQuickView] = useState<MedusaProduct | null>(null);

	const [cart, setCart] = useState<MedusaCartItem[]>([]);
	const [showCartDrawer, setShowCartDrawer] = useState(false);

	// Vendor Auth & Upload State
	const [showVendorAuthModal, setShowVendorAuthModal] = useState(false);
	const [showProductUploadModal, setShowProductUploadModal] = useState(false);
	const [authMode, setAuthMode] = useState<"login" | "register">("login");
	const [vendorEmail, setVendorEmail] = useState("");
	const [vendorPassword, setVendorPassword] = useState("");
	const [vendorName, setVendorName] = useState("");
	const [loggedInVendor, setLoggedInVendor] = useState<MedusaVendor | null>(null);

	// 3D Card Mouse Tilt Tracking
	const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

	const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width - 0.5;
		const y = (e.clientY - rect.top) / rect.height - 0.5;
		setTilt({ x: x * 20, y: -y * 20 });
	};

	const handleMouseLeave = () => {
		setTilt({ x: 0, y: 0 });
	};

	// Default 3D Showcased Products in Office Connect Palette
	const [products, setProducts] = useState<MedusaProduct[]>([
		{
			id: "apple-3d-1",
			sku: "SKU-PRO-M3",
			title: "Office Connect Vision Pro M3",
			subtitle: "Spatial Computing & Holographic Workstation",
			image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80",
			vendorId: "v-office-direct",
			vendorName: "Office Connect Direct 👑",
			vendorLogo: "👑",
			category: "Electronics & Gadgets",
			subcategory: "Spatial Workstations",
			price: 1299.00,
			originalPrice: 1499.00,
			wholesaleB2bPrice: 1100.00,
			sellerOfferBadge: "Apple 3D Grade 🏆",
			stockQty: 85,
			rating: 4.9,
			reviewsCount: 128,
			description: "Immersive dual 4K micro-OLED workstation with M3 Neural Engine and gesture tracking for high-performance SaaS workflows.",
			specs: [
				{ label: "Display", value: "23 Million Pixels Micro-OLED" },
				{ label: "Chip", value: "Apple M3 Dual Engine" },
				{ label: "Battery", value: "4.5 Hours Continuous Space Time" }
			],
			colors: ["#1f2430", "#404d85", "#6678c1", "#e2e8f0"]
		},
		{
			id: "apple-3d-2",
			sku: "SKU-BEAUTY-ROSE",
			title: "Damask Rose Hydrating Botanical Serum",
			subtitle: "Pure Organic Cold-Pressed Elixir",
			image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80",
			vendorId: "v-glow-beauty",
			vendorName: "Glow Beauty Organics 🌸",
			vendorLogo: "🌸",
			category: "Beauty & Personal Care",
			subcategory: "Skincare & Serums",
			price: 68.00,
			originalPrice: 85.00,
			wholesaleB2bPrice: 48.00,
			sellerOfferBadge: "Best Seller 🔥",
			stockQty: 240,
			rating: 5.0,
			reviewsCount: 310,
			description: "Infused with 100% French Damask Rose extract, hyaluronic acid, and botanical vitamins for luminous skin radiance.",
			specs: [
				{ label: "Volume", value: "50ml / 1.7 fl. oz." },
				{ label: "Origin", value: "Grasse, France 🇫🇷" },
				{ label: "Certification", value: "100% Organic EcoCert" }
			],
			colors: ["#fbcfe8", "#f472b6", "#be185d"]
		},
		{
			id: "apple-3d-3",
			sku: "SKU-CLOUD-K8S",
			title: "Kubernetes Enterprise Cloud Cluster",
			subtitle: "High-Availability Multi-Region Node",
			image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80",
			vendorId: "v-acme-cloud",
			vendorName: "Acme Cloud Corp ☁️",
			vendorLogo: "☁️",
			category: "Enterprise Software & Cloud",
			subcategory: "Server Hosting",
			price: 499.00,
			originalPrice: 599.00,
			wholesaleB2bPrice: 399.00,
			sellerOfferBadge: "Enterprise Choice ⚡",
			stockQty: 50,
			rating: 4.8,
			reviewsCount: 94,
			description: "64-Core AMD EPYC Dedicated Nodes with 99.999% SLA uptime, automated DDoS shielding, and NVMe SSD storage.",
			specs: [
				{ label: "RAM", value: "256 GB ECC DDR5" },
				{ label: "Bandwidth", value: "10 Gbps Unmetered Pipe" },
				{ label: "Security", value: "ISO27001 & SOC2 Certified" }
			],
			colors: ["#252f5a", "#404d85", "#38bdf8"]
		}
	]);

	const vendors: MedusaVendor[] = [
		{
			id: "v-office-direct",
			name: "Office Connect Direct 👑",
			logo: "👑",
			ownerEmail: "admin@camblissstudio.com",
			category: "Flagship Products",
			rating: 5.0,
			reviewsCount: 500,
			totalProducts: 1,
			totalSalesVolume: 98000,
			commissionRate: 0.0,
			stripeConnectId: "acct_direct",
			payoutStatus: "Connected (Active)",
			kycVerified: true,
			location: "Office Connect HQ 🌐",
			joinedDate: "2026-08-30",
			description: "Official 1P First-Party Store for Office Connect Hardware & SaaS Software."
		},
		{
			id: "v-glow-beauty",
			name: "Glow Beauty Organics 🌸",
			logo: "🌸",
			ownerEmail: "care@glowbeautyorganics.com",
			category: "Beauty & Personal Care",
			rating: 5.0,
			reviewsCount: 310,
			totalProducts: 1,
			totalSalesVolume: 24000,
			commissionRate: 7.5,
			stripeConnectId: "acct_glow",
			payoutStatus: "Connected (Active)",
			kycVerified: true,
			location: "Paris, France 🇫🇷",
			joinedDate: "2026-08-15",
			description: "Luxury French organic skincare and botanical elixirs."
		},
		{
			id: "v-acme-cloud",
			name: "Acme Cloud Corp ☁️",
			logo: "☁️",
			ownerEmail: "vendors@acmecloud.io",
			category: "Enterprise Software & Cloud",
			rating: 4.8,
			reviewsCount: 94,
			totalProducts: 1,
			totalSalesVolume: 42000,
			commissionRate: 8.5,
			stripeConnectId: "acct_acme",
			payoutStatus: "Connected (Active)",
			kycVerified: true,
			location: "Munich, Germany 🇩🇪",
			joinedDate: "2026-08-10",
			description: "Dedicated cloud hosting infrastructure & Kubernetes nodes."
		}
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
		setShowCartDrawer(true);
	};

	const filteredProducts = products.filter((p) => {
		const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
		const matchesVendor = selectedVendorFilter === "All" || p.vendorId === selectedVendorFilter;
		return matchesSearch && matchesCategory && matchesVendor;
	});

	return (
		<div className="min-h-screen bg-[#eef2fa] font-sans text-[#1f2430] flex flex-col selection:bg-[#404d85] selection:text-white">

			{/* APPLE-STYLE TRANSLUCENT GLASS NAVIGATION BAR */}
			<header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/75 border-b border-[#d9e2ef]/80 transition-all">
				<div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-6">
					
					{/* Logo & Brand */}
					<Link href="/storefront" className="flex items-center gap-3 group">
						<Image
							src="/officeconnectlogo.png"
							alt="Office Connect"
							width={170}
							height={44}
							priority
							className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
						/>
						<div className="border-l border-[#d9e2ef] pl-3 hidden sm:block">
							<span className="text-[10px] font-black text-[#404d85] uppercase tracking-widest block">3D EXPERIENCE</span>
							<span className="text-[9px] font-semibold text-[#6678c1] block -mt-0.5">APPLE GRADE STOREFRONT</span>
						</div>
					</Link>

					{/* Category Quick Pills */}
					<div className="hidden lg:flex items-center gap-1 bg-[#f8faff] p-1.5 rounded-2xl border border-[#d9e2ef]/80 text-xs font-bold text-[#404d85]">
						{["All", "Electronics & Gadgets", "Beauty & Personal Care", "Enterprise Software & Cloud"].map((cat) => (
							<button
								key={cat}
								onClick={() => setCategoryFilter(cat)}
								className={`px-4 py-1.5 rounded-xl transition ${
									categoryFilter === cat ? "bg-[#404d85] text-white shadow-md" : "hover:bg-white text-zinc-600"
								}`}
							>
								{cat}
							</button>
						))}
					</div>

					{/* Search & Actions */}
					<div className="flex items-center gap-3">
						<div className="relative hidden md:block">
							<input
								type="text"
								placeholder="Search products in 3D..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-48 lg:w-64 rounded-xl border border-[#d9e2ef] bg-white/90 px-3.5 py-2 text-xs text-[#1f2430] placeholder-zinc-400 focus:w-72 focus:border-[#404d85] focus:outline-none transition-all shadow-sm"
							/>
						</div>

						<button
							onClick={() => setShowProductUploadModal(true)}
							className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#323d6a] transition"
						>
							+ Add Product
						</button>

						<button
							onClick={() => setShowCartDrawer(true)}
							className="relative rounded-xl border border-[#d9e2ef] bg-white px-4 py-2 text-xs font-bold text-[#404d85] shadow-sm hover:bg-[#f8faff] transition flex items-center gap-1.5"
						>
							<span>🛒</span>
							<span>Bag</span>
							{cart.length > 0 && (
								<span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#404d85] text-[10px] font-bold text-white">
									{cart.reduce((sum, item) => sum + item.quantity, 0)}
								</span>
							)}
						</button>
					</div>
				</div>
			</header>

			{/* APPLE-STYLE 3D HERO SHOWCASE BANNER */}
			<section className="relative overflow-hidden bg-gradient-to-b from-[#252f5a] via-[#323d6a] to-[#404d85] text-white py-16 px-4 sm:px-8 border-b border-[#323d6a]">
				{/* Ambient Glow Background Effect */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6678c1]/20 rounded-full blur-3xl pointer-events-none" />

				<div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
					
					{/* Left Typography */}
					<div className="space-y-6 text-center lg:text-left">
						<span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 text-xs font-extrabold text-blue-200 shadow-xl">
							<span>✨</span> Next-Gen 3D E-Commerce Marketplace
						</span>
						<h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
							Pro. Ultra. <br />
							<span className="bg-gradient-to-r from-blue-200 via-indigo-200 to-white bg-clip-text text-transparent">
								Extraordinary.
							</span>
						</h1>
						<p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
							Immerse yourself in precision-crafted products from verified global brands. Designed in Office Connect Palette.
						</p>
						<div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2">
							<button
								onClick={() => setSelectedProductQuickView(products[0])}
								className="rounded-2xl bg-white px-7 py-3.5 text-xs font-black text-[#404d85] shadow-2xl hover:bg-blue-50 transition transform hover:-translate-y-0.5"
							>
								Explore Vision Pro 3D ↗
							</button>
							<button
								onClick={() => setShowProductUploadModal(true)}
								className="rounded-2xl border border-white/30 bg-white/10 px-7 py-3.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition"
							>
								+ Upload Product
							</button>
						</div>
					</div>

					{/* Right 3D Interactive Floating Canvas */}
					<div
						onMouseMove={handleMouseMove}
						onMouseLeave={handleMouseLeave}
						className="relative flex justify-center items-center cursor-pointer perspective-1000"
					>
						<div
							style={{
								transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
								transition: "transform 0.1s ease-out"
							}}
							className="relative w-full max-w-md aspect-square rounded-3xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 p-6 backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col justify-between group overflow-hidden"
						>
							<div className="flex justify-between items-start">
								<span className="rounded-full bg-[#6678c1] px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider">
									3D Live Interactive
								</span>
								<span className="text-xl">✨</span>
							</div>

							<div className="my-auto text-center space-y-3">
								<img
									src={products[0].image}
									alt="Featured 3D Product"
									className="w-56 h-56 object-cover mx-auto rounded-2xl border border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-500"
								/>
								<h3 className="text-xl font-black text-white">{products[0].title}</h3>
								<p className="text-xs text-blue-200">{products[0].subtitle}</p>
							</div>

							<div className="flex justify-between items-center pt-3 border-t border-white/10">
								<span className="text-lg font-black text-emerald-300">${products[0].price.toFixed(2)}</span>
								<span className="text-xs font-bold text-blue-100 group-hover:underline">Rotate & Inspect 3D ↗</span>
							</div>
						</div>
					</div>

				</div>
			</section>

			{/* MAIN 3D PRODUCT CATALOG SECTION */}
			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 space-y-10">

				{/* Header Controls */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#d9e2ef] shadow-sm">
					<div>
						<h2 className="text-2xl font-black text-[#404d85]">Explore Live 3D Catalog</h2>
						<p className="text-xs text-zinc-500 mt-0.5">Showing {filteredProducts.length} premium products in Office Connect theme</p>
					</div>
					<div className="flex gap-3">
						<button onClick={() => setShowProductUploadModal(true)} className="rounded-xl bg-[#404d85] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]">
							+ Upload Product
						</button>
					</div>
				</div>

				{/* 3D Product Cards Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{filteredProducts.map((product) => (
						<div
							key={product.id}
							className="group rounded-3xl border border-[#d9e2ef] bg-white overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#6678c1]/50 transition-all duration-500 flex flex-col justify-between transform hover:-translate-y-2"
						>
							{/* Card Image Stage */}
							<div className="relative aspect-[4/3] bg-[#f8faff] overflow-hidden p-6 flex items-center justify-center border-b border-[#d9e2ef]/60">
								<img
									src={product.image}
									alt={product.title}
									className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500 shadow-md"
								/>
								{product.sellerOfferBadge && (
									<span className="absolute top-4 left-4 rounded-full bg-[#252f5a]/90 backdrop-blur-md px-3.5 py-1 text-[10px] font-black text-white shadow-lg">
										{product.sellerOfferBadge}
									</span>
								)}
							</div>

							{/* Card Content */}
							<div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
								<div className="space-y-2">
									<div className="flex justify-between items-center text-[11px] font-bold text-[#6678c1]">
										<span>{product.vendorLogo} {product.vendorName}</span>
										<span>⭐ {product.rating}</span>
									</div>
									<h3 className="text-base font-black text-[#1f2430] group-hover:text-[#404d85] transition">{product.title}</h3>
									<p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{product.description}</p>

									{/* Color Variants Dots */}
									{product.colors && product.colors.length > 0 && (
										<div className="flex items-center gap-1.5 pt-2">
											<span className="text-[10px] font-bold text-zinc-400 mr-1">Colors:</span>
											{product.colors.map((color, idx) => (
												<span key={idx} style={{ backgroundColor: color }} className="w-3.5 h-3.5 rounded-full border border-zinc-300 shadow-sm" />
											))}
										</div>
									)}
								</div>

								{/* Price & Action */}
								<div className="pt-4 border-t border-[#d9e2ef] flex items-center justify-between">
									<div>
										<div className="text-lg font-black text-emerald-600">${product.price.toFixed(2)}</div>
										{product.originalPrice && (
											<div className="text-xs text-zinc-400 line-through">${product.originalPrice.toFixed(2)}</div>
										)}
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => setSelectedProductQuickView(product)}
											className="rounded-xl border border-[#d9e2ef] bg-[#f8faff] px-3.5 py-2 text-xs font-bold text-[#404d85] hover:bg-[#eef2fa] transition"
										>
											3D Specs
										</button>
										<button
											onClick={() => addToCart(product)}
											className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#323d6a] transition"
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

			{/* APPLE-STYLE 3D QUICK VIEW SPEC SHEET MODAL */}
			{selectedProductQuickView && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
					<div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl relative border border-[#d9e2ef] max-h-[90vh] overflow-y-auto space-y-6">
						<button
							onClick={() => setSelectedProductQuickView(null)}
							className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 text-xl font-bold"
						>
							✕
						</button>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
							<div className="bg-[#f8faff] p-6 rounded-2xl border border-[#d9e2ef]">
								<img
									src={selectedProductQuickView.image}
									alt={selectedProductQuickView.title}
									className="w-full aspect-square object-cover rounded-xl shadow-lg"
								/>
							</div>

							<div className="space-y-4">
								<span className="rounded-full bg-[#404d85]/10 px-3 py-1 text-xs font-extrabold text-[#404d85]">
									{selectedProductQuickView.category}
								</span>
								<h2 className="text-2xl font-black text-[#404d85]">{selectedProductQuickView.title}</h2>
								<p className="text-xs text-zinc-600 leading-relaxed">{selectedProductQuickView.description}</p>

								{/* Tech Spec Sheet */}
								{selectedProductQuickView.specs && (
									<div className="bg-[#f8faff] p-4 rounded-xl border border-[#d9e2ef] space-y-2">
										<h4 className="font-extrabold text-xs text-[#404d85] uppercase">Technical Specs</h4>
										{selectedProductQuickView.specs.map((spec, i) => (
											<div key={i} className="flex justify-between text-xs border-b border-zinc-200 pb-1">
												<span className="text-zinc-500 font-medium">{spec.label}</span>
												<span className="font-bold text-zinc-900">{spec.value}</span>
											</div>
										))}
									</div>
								)}

								<div className="pt-3 border-t border-[#d9e2ef] flex items-center justify-between">
									<span className="text-2xl font-black text-emerald-600">${selectedProductQuickView.price.toFixed(2)}</span>
									<button
										onClick={() => {
											addToCart(selectedProductQuickView);
											setSelectedProductQuickView(null);
										}}
										className="rounded-xl bg-[#404d85] px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-[#323d6a]"
									>
										+ Add to Bag
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* UPLOAD PRODUCT MODAL */}
			{showProductUploadModal && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
					<div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto border border-[#d9e2ef] space-y-4">
						<button onClick={() => setShowProductUploadModal(false)} className="absolute right-6 top-6 text-zinc-400 font-bold text-xl">✕</button>
						<h2 className="text-2xl font-black text-[#404d85]">+ Add Product to 3D Storefront</h2>
						<form onSubmit={(e) => {
							e.preventDefault();
							alert("🎉 Product uploaded to live 3D Storefront!");
							setShowProductUploadModal(false);
						}} className="space-y-3 text-xs">
							<div>
								<label className="block font-bold text-zinc-700">Product Title *</label>
								<input type="text" required placeholder="e.g. Office Connect Vision Pro M3" className="w-full rounded-xl border border-[#d9e2ef] p-3 text-xs" />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-bold text-zinc-700">Category *</label>
									<input type="text" required placeholder="Electronics & Gadgets" className="w-full rounded-xl border border-[#d9e2ef] p-3 text-xs" />
								</div>
								<div>
									<label className="block font-bold text-zinc-700">Price ($) *</label>
									<input type="number" step="0.01" required placeholder="1299.00" className="w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-bold text-emerald-600" />
								</div>
							</div>
							<div>
								<label className="block font-bold text-zinc-700">Image URL</label>
								<input type="url" placeholder="https://images.unsplash.com/..." className="w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-mono" />
							</div>
							<div>
								<label className="block font-bold text-zinc-700">Description</label>
								<textarea rows={3} placeholder="Product description..." className="w-full rounded-xl border border-[#d9e2ef] p-3 text-xs" />
							</div>
							<button type="submit" className="w-full rounded-xl bg-[#404d85] py-3.5 text-xs font-bold text-white shadow-lg hover:bg-[#323d6a]">Publish to 3D Storefront</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
