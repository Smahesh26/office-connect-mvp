"use client";

import Link from "next/link";
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

type MedusaCartItem = {
	product: MedusaProduct;
	quantity: number;
};

export default function StorefrontPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">Loading E-Commerce Marketplace...</div>}>
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
	const [priceRange, setPriceRange] = useState<number>(5000);
	const [onlyInStock, setOnlyInStock] = useState(false);

	const [cart, setCart] = useState<MedusaCartItem[]>([]);
	const [showCartDrawer, setShowCartDrawer] = useState(false);

	// Vendor Auth & Upload State
	const [showVendorAuthModal, setShowVendorAuthModal] = useState(false);
	const [showProductUploadModal, setShowProductUploadModal] = useState(false);
	const [authMode, setAuthMode] = useState<"login" | "register">("login");
	const [vendorEmail, setVendorEmail] = useState("");
	const [vendorPassword, setVendorPassword] = useState("");
	const [vendorName, setVendorName] = useState("");
	const [vendorCategory, setVendorCategory] = useState("General Products");
	const [loggedInVendor, setLoggedInVendor] = useState<MedusaVendor | null>(null);
	const [authMsg, setAuthMsg] = useState<string | null>(null);

	// Upload Product Form State
	const [newProductForm, setNewProductForm] = useState({
		title: "",
		sku: "",
		category: "General",
		price: "",
		originalPrice: "",
		image: "",
		stockQty: "100",
		description: "",
		sellerOfferBadge: "Featured Product",
	});
	const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

	// Zero Dummy Data - Clean Initial Vendors & Products
	const [vendors, setVendors] = useState<MedusaVendor[]>([]);
	const [products, setProducts] = useState<MedusaProduct[]>([]);

	// Categories dynamically computed from active products
	const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

	const handleVendorAuthSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!vendorEmail || !vendorPassword) return;

		if (authMode === "register") {
			if (!vendorName) return;
			const newV: MedusaVendor = {
				id: `v-${Date.now()}`,
				name: vendorName,
				logo: "🏬",
				ownerEmail: vendorEmail,
				category: vendorCategory,
				rating: 5.0,
				reviewsCount: 1,
				totalProducts: 0,
				totalSalesVolume: 0,
				commissionRate: 8.0,
				stripeConnectId: `acct_${Date.now()}`,
				payoutStatus: "Connected (Active)",
				kycVerified: true,
				location: "Verified Seller 🌐",
				joinedDate: new Date().toISOString().split("T")[0],
				description: `Official storefront for ${vendorName}.`,
			};
			setVendors((prev) => [newV, ...prev]);
			setLoggedInVendor(newV);
			setAuthMsg(`✅ Welcome ${vendorName}! Your seller account is active.`);
			setTimeout(() => {
				setShowVendorAuthModal(false);
				setAuthMsg(null);
			}, 1000);
		} else {
			// Login mode
			const found = vendors.find((v) => v.ownerEmail.toLowerCase() === vendorEmail.toLowerCase());
			if (found) {
				setLoggedInVendor(found);
				setAuthMsg(`✅ Logged in as ${found.name}`);
				setTimeout(() => {
					setShowVendorAuthModal(false);
					setAuthMsg(null);
				}, 1000);
			} else {
				// Default seller session
				const defaultV: MedusaVendor = {
					id: "v-default-seller",
					name: vendorEmail.split("@")[0].toUpperCase() + " Store",
					logo: "🏬",
					ownerEmail: vendorEmail,
					category: "General Products",
					rating: 5.0,
					reviewsCount: 1,
					totalProducts: 0,
					totalSalesVolume: 0,
					commissionRate: 8.0,
					stripeConnectId: "acct_demo",
					payoutStatus: "Connected (Active)",
					kycVerified: true,
					location: "Verified Seller",
					joinedDate: new Date().toISOString().split("T")[0],
					description: "Official seller account.",
				};
				setVendors((prev) => [defaultV, ...prev]);
				setLoggedInVendor(defaultV);
				setAuthMsg(`✅ Logged in successfully!`);
				setTimeout(() => {
					setShowVendorAuthModal(false);
					setAuthMsg(null);
				}, 1000);
			}
		}
	};

	const handleUploadProductSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!newProductForm.title || !newProductForm.price) return;
		setIsSubmittingProduct(true);

		setTimeout(() => {
			const currentVendor = loggedInVendor || {
				id: "v-[#6678c1]",
				name: "Cambliss Platform Store",
				logo: "🏬",
				ownerEmail: "admin@camblissstudio.com",
				category: "General",
				rating: 5.0,
				reviewsCount: 1,
				totalProducts: 1,
				totalSalesVolume: 0,
				commissionRate: 8.0,
				stripeConnectId: "acct_admin",
				payoutStatus: "Connected (Active)",
				kycVerified: true,
				location: "Global Platform",
				joinedDate: "2026-08-27",
				description: "Official Platform Storefront.",
			};

			const newProd: MedusaProduct = {
				id: `prod-${Date.now()}`,
				sku: newProductForm.sku || `SKU-${Date.now()}`,
				title: newProductForm.title,
				image: newProductForm.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
				vendorId: currentVendor.id,
				vendorName: currentVendor.name,
				vendorLogo: currentVendor.logo,
				category: newProductForm.category || "General",
				price: parseFloat(newProductForm.price) || 0,
				originalPrice: newProductForm.originalPrice ? parseFloat(newProductForm.originalPrice) : undefined,
				sellerOfferBadge: newProductForm.sellerOfferBadge || "New Arrival",
				stockQty: parseInt(newProductForm.stockQty) || 100,
				rating: 5.0,
				reviewsCount: 0,
				description: newProductForm.description || "High quality product.",
			};

			setProducts((prev) => [newProd, ...prev]);
			setIsSubmittingProduct(false);
			setShowProductUploadModal(false);
			setNewProductForm({
				title: "",
				sku: "",
				category: "General",
				price: "",
				originalPrice: "",
				image: "",
				stockQty: "100",
				description: "",
				sellerOfferBadge: "Featured Product",
			});
			alert("🎉 Product uploaded successfully to live Storefront!");
		}, 800);
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
		setShowCartDrawer(true);
	};

	const filteredProducts = products.filter((p) => {
		const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
		const matchesVendor = selectedVendorFilter === "All" || p.vendorId === selectedVendorFilter;
		const matchesPrice = p.price <= priceRange;
		const matchesStock = !onlyInStock || p.stockQty > 0;

		return matchesSearch && matchesCategory && matchesVendor && matchesPrice && matchesStock;
	});

	const activeVendorObj = vendors.find((v) => v.id === selectedVendorFilter);

	return (
		<div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col">
			{/* STANDALONE E-COMMERCE TOP NOTICE BAR */}
			<div className="bg-[#404d85] text-white px-4 py-2 text-center text-xs font-semibold tracking-wide flex justify-between items-center max-w-full">
				<div className="hidden sm:block text-[11px] opacity-80">🚚 Fast Worldwide Express Delivery & Multi-Vendor Fulfillment</div>
				<div className="mx-auto sm:mx-0">
					🎉 Welcome to Cambliss E-Commerce Marketplace — Direct Vendor Storefronts
				</div>
				<div className="hidden md:flex gap-4 text-[11px]">
					<button onClick={() => setShowVendorAuthModal(true)} className="hover:underline text-blue-200">
						🔑 {loggedInVendor ? `Vendor Portal (${loggedInVendor.name})` : "Seller Sign In / Register"}
					</button>
					<span>|</span>
					<a href="/login" className="hover:underline text-blue-200">
						👤 Customer Account
					</a>
				</div>
			</div>

			{/* MAIN STANDALONE E-COMMERCE HEADER */}
			<header className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
					{/* Logo */}
					<div className="flex items-center gap-3">
						<Link href="/storefront" className="flex items-center gap-2">
							<div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#404d85] to-[#252f5a] flex items-center justify-center text-white font-black text-xl shadow-md">
								🛍️
							</div>
							<div>
								<span className="text-xl font-extrabold tracking-tight text-zinc-900">CAMBLISS</span>
								<span className="text-xs font-bold text-[#6678c1] block -mt-1 tracking-widest uppercase">MARKETPLACE</span>
							</div>
						</Link>
					</div>

					{/* Search Bar */}
					<div className="flex-1 max-w-2xl hidden md:flex items-center rounded-2xl border border-zinc-300 bg-zinc-50 focus-within:border-[#404d85] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#404d85]/20 transition overflow-hidden">
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="bg-zinc-100 text-xs font-bold text-zinc-700 px-3 py-3 border-r border-zinc-300 focus:outline-none cursor-pointer"
						>
							{categories.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
						<input
							type="text"
							placeholder="Search products, brands, cosmetics, electronics, or sellers..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full px-4 py-2.5 text-xs bg-transparent focus:outline-none text-zinc-900"
						/>
						<button className="bg-[#404d85] text-white px-5 py-3 text-xs font-bold hover:bg-[#323d6a] transition flex items-center gap-1">
							🔍 Search
						</button>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-3">
						<button
							onClick={() => {
								if (!loggedInVendor) {
									setShowVendorAuthModal(true);
								} else {
									setShowProductUploadModal(true);
								}
							}}
							className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition"
						>
							<span>+</span> Upload Product
						</button>

						<button
							onClick={() => setShowCartDrawer(true)}
							className="relative flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-800 shadow-sm hover:bg-zinc-50 transition"
						>
							<span className="text-lg">🛒</span>
							<span className="hidden sm:inline">Cart</span>
							{cart.length > 0 && (
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#404d85] text-[10px] font-bold text-white shadow-sm">
									{cart.reduce((sum, item) => sum + item.quantity, 0)}
								</span>
							)}
						</button>
					</div>
				</div>
			</header>

			{/* DEDICATED VENDOR STOREFRONT HEADER BANNER (IF VENDOR FILTERED) */}
			{activeVendorObj && (
				<div className="bg-gradient-to-r from-[#404d85] via-[#323d6a] to-[#252f5a] text-white py-8 px-4 sm:px-8 border-b border-zinc-200">
					<div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
						<div className="flex items-center gap-5">
							<div className="h-20 w-20 rounded-3xl bg-white border-4 border-white/20 shadow-xl flex items-center justify-center text-4xl">
								{activeVendorObj.logo}
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h1 className="text-2xl font-black">{activeVendorObj.name}</h1>
									<span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-3 py-0.5 text-xs font-bold text-emerald-200">
										✓ Verified Seller
									</span>
								</div>
								<p className="mt-1 text-xs text-blue-100 max-w-xl">{activeVendorObj.description}</p>
								<div className="mt-2 flex items-center gap-4 text-xs font-semibold text-blue-200">
									<span>⭐ {activeVendorObj.rating} / 5.0 Rating</span>
									<span>•</span>
									<span>📍 {activeVendorObj.location}</span>
									<span>•</span>
									<span>📦 {products.filter((p) => p.vendorId === activeVendorObj.id).length} Products Listed</span>
								</div>
							</div>
						</div>
						<button
							onClick={() => setSelectedVendorFilter("All")}
							className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/20 transition"
						>
							← Back to Main Marketplace
						</button>
					</div>
				</div>
			)}

			{/* MAIN BODY CONTAINER */}
			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					{/* LEFT SIDEBAR: CATEGORIES & VENDOR FILTER */}
					<aside className="space-y-6">
						{/* Vendor List */}
						<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
							<h3 className="text-sm font-extrabold text-zinc-900 border-b border-zinc-200 pb-2">
								🏬 Verified Vendor Stores ({vendors.length})
							</h3>
							<div className="space-y-2 max-h-60 overflow-y-auto">
								<button
									onClick={() => setSelectedVendorFilter("All")}
									className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
										selectedVendorFilter === "All" ? "bg-[#404d85] text-white shadow-md" : "hover:bg-zinc-100 text-zinc-700"
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
											selectedVendorFilter === v.id ? "bg-[#404d85] text-white shadow-md" : "hover:bg-zinc-100 text-zinc-700"
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

						{/* Quick Upload Banner */}
						<div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white space-y-3 shadow-lg">
							<h3 className="font-extrabold text-base">Sell Your Products Here!</h3>
							<p className="text-xs text-emerald-100 leading-relaxed">
								Register your brand store and upload products directly into the live marketplace.
							</p>
							<button
								onClick={() => {
									if (!loggedInVendor) setShowVendorAuthModal(true);
									else setShowProductUploadModal(true);
								}}
								className="w-full rounded-xl bg-white py-2.5 text-xs font-bold text-emerald-900 shadow-md hover:bg-emerald-50 transition"
							>
								+ Add Products Now
							</button>
						</div>
					</aside>

					{/* RIGHT CONTENT: PRODUCT CATALOG */}
					<section className="lg:col-span-3 space-y-6">
						{/* Product Header */}
						<div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
							<div>
								<h2 className="text-lg font-extrabold text-zinc-900">
									{selectedVendorFilter === "All"
										? "All Marketplace Products"
										: `Storefront: ${activeVendorObj?.name || "Vendor Products"}`}
								</h2>
								<p className="text-xs text-zinc-500">Showing {filteredProducts.length} items</p>
							</div>
							<button
								onClick={() => {
									if (!loggedInVendor) setShowVendorAuthModal(true);
									else setShowProductUploadModal(true);
								}}
								className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]"
							>
								+ Upload Product
							</button>
						</div>

						{/* Products Grid / Zero State */}
						{filteredProducts.length === 0 ? (
							<div className="rounded-3xl border-2 border-dashed border-zinc-300 bg-white p-12 text-center space-y-4">
								<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-100 text-4xl">
									📦
								</div>
								<h3 className="text-xl font-bold text-zinc-900">No Products Listed Yet</h3>
								<p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
									Your marketplace is clean and ready! Log in to your seller account or admin portal to upload your real products.
								</p>
								<div className="pt-2 flex justify-center gap-3">
									<button
										onClick={() => {
											if (!loggedInVendor) setShowVendorAuthModal(true);
											else setShowProductUploadModal(true);
										}}
										className="rounded-xl bg-[#404d85] px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-[#323d6a]"
									>
										+ Upload Your First Product
									</button>
								</div>
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
								{filteredProducts.map((product) => (
									<div
										key={product.id}
										className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col"
									>
										<div className="relative aspect-square bg-zinc-100 overflow-hidden">
											<img
												src={product.image}
												alt={product.title}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
											/>
											{product.sellerOfferBadge && (
												<span className="absolute top-3 left-3 rounded-full bg-zinc-900/80 backdrop-blur-sm px-3 py-1 text-[10px] font-bold text-white shadow-md">
													{product.sellerOfferBadge}
												</span>
											)}
										</div>

										<div className="p-5 flex-1 flex flex-col justify-between space-y-3">
											<div>
												<div className="flex justify-between items-center text-[11px] text-[#6678c1] font-bold mb-1">
													<span>{product.vendorLogo} {product.vendorName}</span>
												</div>
												<h3 className="font-bold text-sm text-zinc-900 line-clamp-2">{product.title}</h3>
												<p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">{product.description}</p>
											</div>

											<div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
												<div>
													<div className="text-base font-black text-zinc-900">
														${product.price.toFixed(2)}
													</div>
													{product.originalPrice && (
														<div className="text-xs text-zinc-400 line-through">
															${product.originalPrice.toFixed(2)}
														</div>
													)}
												</div>
												<button
													onClick={() => addToCart(product)}
													className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#323d6a] transition"
												>
													+ Add to Cart
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</section>
				</div>
			</main>

			{/* UPLOAD PRODUCT MODAL */}
			{showProductUploadModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
						<button
							onClick={() => setShowProductUploadModal(false)}
							className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 text-lg font-bold"
						>
							✕
						</button>
						<h2 className="text-xl font-extrabold text-zinc-900 mb-1">+ Upload New Product</h2>
						<p className="text-xs text-zinc-500 mb-6">
							Add a product to live Storefront ({loggedInVendor?.name || "Platform Store"})
						</p>

						<form onSubmit={handleUploadProductSubmit} className="space-y-4 text-xs">
							<div>
								<label className="block font-semibold text-zinc-700 mb-1">Product Title *</label>
								<input
									type="text"
									required
									placeholder="e.g. Organic Rose Hydrating Serum"
									value={newProductForm.title}
									onChange={(e) => setNewProductForm((prev) => ({ ...prev, title: e.target.value }))}
									className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-semibold text-zinc-700 mb-1">Category *</label>
									<input
										type="text"
										required
										placeholder="Beauty & Skincare"
										value={newProductForm.category}
										onChange={(e) => setNewProductForm((prev) => ({ ...prev, category: e.target.value }))}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
									/>
								</div>
								<div>
									<label className="block font-semibold text-zinc-700 mb-1">SKU Code</label>
									<input
										type="text"
										placeholder="SKU-BEAUTY-101"
										value={newProductForm.sku}
										onChange={(e) => setNewProductForm((prev) => ({ ...prev, sku: e.target.value }))}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-semibold text-zinc-700 mb-1">Selling Price ($) *</label>
									<input
										type="number"
										step="0.01"
										required
										placeholder="49.99"
										value={newProductForm.price}
										onChange={(e) => setNewProductForm((prev) => ({ ...prev, price: e.target.value }))}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-bold text-emerald-600"
									/>
								</div>
								<div>
									<label className="block font-semibold text-zinc-700 mb-1">Original Price ($)</label>
									<input
										type="number"
										step="0.01"
										placeholder="69.99"
										value={newProductForm.originalPrice}
										onChange={(e) => setNewProductForm((prev) => ({ ...prev, originalPrice: e.target.value }))}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
									/>
								</div>
							</div>

							<div>
								<label className="block font-semibold text-zinc-700 mb-1">Product Image URL</label>
								<input
									type="url"
									placeholder="https://images.unsplash.com/photo-..."
									value={newProductForm.image}
									onChange={(e) => setNewProductForm((prev) => ({ ...prev, image: e.target.value }))}
									className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-mono"
								/>
							</div>

							<div>
								<label className="block font-semibold text-zinc-700 mb-1">Description</label>
								<textarea
									rows={3}
									placeholder="Enter detailed product description..."
									value={newProductForm.description}
									onChange={(e) => setNewProductForm((prev) => ({ ...prev, description: e.target.value }))}
									className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
								/>
							</div>

							<button
								type="submit"
								disabled={isSubmittingProduct}
								className="w-full rounded-xl bg-[#404d85] py-3.5 text-xs font-bold text-white shadow-lg hover:bg-[#323d6a] transition"
							>
								{isSubmittingProduct ? "Publishing Product..." : "Publish Product to Marketplace"}
							</button>
						</form>
					</div>
				</div>
			)}

			{/* VENDOR AUTH MODAL */}
			{showVendorAuthModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
						<button
							onClick={() => setShowVendorAuthModal(false)}
							className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 text-lg font-bold"
						>
							✕
						</button>
						<h2 className="text-2xl font-bold text-zinc-900">
							{authMode === "login" ? "Seller Login" : "Register Brand Store"}
						</h2>
						<p className="mt-1 text-xs text-zinc-500">
							Access your multi-vendor portal and manage product listings.
						</p>

						{authMsg && (
							<div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
								{authMsg}
							</div>
						)}

						<form onSubmit={handleVendorAuthSubmit} className="mt-6 space-y-4 text-xs">
							{authMode === "register" && (
								<div>
									<label className="block font-semibold text-zinc-700 mb-1">Store / Brand Name *</label>
									<input
										type="text"
										required
										placeholder="e.g. Glow Beauty Cosmetics"
										value={vendorName}
										onChange={(e) => setVendorName(e.target.value)}
										className="w-full rounded-xl border border-zinc-300 p-3"
									/>
								</div>
							)}
							<div>
								<label className="block font-semibold text-zinc-700 mb-1">Email Address *</label>
								<input
									type="email"
									required
									placeholder="vendor@company.com"
									value={vendorEmail}
									onChange={(e) => setVendorEmail(e.target.value)}
									className="w-full rounded-xl border border-zinc-300 p-3"
								/>
							</div>
							<div>
								<label className="block font-semibold text-zinc-700 mb-1">Password *</label>
								<input
									type="password"
									required
									placeholder="••••••••"
									value={vendorPassword}
									onChange={(e) => setVendorPassword(e.target.value)}
									className="w-full rounded-xl border border-zinc-300 p-3"
								/>
							</div>

							<button
								type="submit"
								className="w-full rounded-xl bg-[#404d85] py-3.5 text-xs font-bold text-white shadow-lg hover:bg-[#323d6a]"
							>
								{authMode === "login" ? "Sign In to Seller Dashboard" : "Create Seller Account"}
							</button>

							<div className="pt-2 text-center text-xs">
								<button
									type="button"
									onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
									className="text-[#6678c1] font-bold hover:underline"
								>
									{authMode === "login" ? "Need a seller store? Register here" : "Already have a store? Sign in"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
