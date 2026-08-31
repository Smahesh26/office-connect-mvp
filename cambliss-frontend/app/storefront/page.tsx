"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, Suspense, FormEvent, MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type MedusaVendor = {
	id: string;
	slug: string;
	name: string;
	legalName: string;
	entityType: string;
	einNumber: string;
	logo: string;
	banner: string;
	ownerEmail: string;
	phone: string;
	category: string;
	rating: number;
	reviewsCount: number;
	totalProducts: number;
	grossSales: number;
	totalEarnings: number;
	payoutStatus: string;
	bankAccountIban: string;
	taxIdVat: string;
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

	// 3D Card Interactive Mouse Tilt State
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

	const [vendors, setVendors] = useState<MedusaVendor[]>([
		{
			id: "v-office-direct",
			slug: "office-direct",
			name: "Office Connect Direct 👑",
			legalName: "Office Connect Global Inc.",
			entityType: "Corporation",
			einNumber: "EIN-98-4029102",
			logo: "👑",
			banner: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
			ownerEmail: "admin@camblissstudio.com",
			phone: "+1 (800) 555-0199",
			category: "Electronics & Gadgets",
			rating: 5.0,
			reviewsCount: 520,
			totalProducts: 2,
			grossSales: 98400.00,
			totalEarnings: 90036.00,
			payoutStatus: "Connected (Stripe Active)",
			bankAccountIban: "US8930192840192019",
			taxIdVat: "VAT-US9402102",
			kycVerified: true,
			location: "Global Platform HQ 🌐",
			description: "Official 1P Flagship Store for Office Connect Hardware, Smartwear & Cloud Software."
		},
		{
			id: "v-glow-beauty",
			slug: "glow-beauty",
			name: "Glow Beauty Organics 🌸",
			legalName: "Glow Beauty Grasse SAS",
			entityType: "LLC / Private Limited",
			einNumber: "FR-84019201",
			logo: "🌸",
			banner: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
			ownerEmail: "care@glowbeautyorganics.com",
			phone: "+33 1 42 68 55 00",
			category: "Beauty & Personal Care",
			rating: 5.0,
			reviewsCount: 310,
			totalProducts: 2,
			grossSales: 48250.00,
			totalEarnings: 44148.75,
			payoutStatus: "Connected (Stripe Active)",
			bankAccountIban: "FR7630006000011234567890189",
			taxIdVat: "FR-VAT-99201",
			kycVerified: true,
			location: "Paris, France 🇫🇷",
			description: "Luxury French organic skincare, cold-pressed rose extracts, and botanical lip elixirs."
		},
		{
			id: "v-acme-cloud",
			slug: "acme-cloud",
			name: "Acme Cloud Corp ☁️",
			legalName: "Acme Cloud Infrastructure GmbH",
			entityType: "Corporation",
			einNumber: "DE-99201920",
			logo: "☁️",
			banner: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
			ownerEmail: "vendors@acmecloud.io",
			phone: "+49 89 2018 3900",
			category: "Enterprise Software & Cloud",
			rating: 4.8,
			reviewsCount: 94,
			totalProducts: 1,
			grossSales: 62000.00,
			totalEarnings: 56730.00,
			payoutStatus: "Connected (Stripe Active)",
			bankAccountIban: "DE89370400440532013000",
			taxIdVat: "DE-VAT-481029",
			kycVerified: true,
			location: "Munich, Germany 🇩🇪",
			description: "Dedicated enterprise cloud server infrastructure, NVMe VPS nodes, and Kubernetes clusters."
		},
		{
			id: "v-autocare",
			slug: "autocare-motors",
			name: "AutoCare Garage & Motors 🚘",
			legalName: "AutoCare Motors Inc",
			entityType: "LLC",
			einNumber: "EIN-38-991029",
			logo: "🚘",
			banner: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80",
			ownerEmail: "service@autocaregarage.com",
			phone: "+1 (313) 555-0144",
			category: "Automotive Parts & Services",
			rating: 4.9,
			reviewsCount: 215,
			totalProducts: 1,
			grossSales: 35400.00,
			totalEarnings: 32391.00,
			payoutStatus: "Connected (Stripe Active)",
			bankAccountIban: "US94029102948102",
			taxIdVat: "US-TAX-389910",
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
	const [showAmazonOnboardingWizard, setShowAmazonOnboardingWizard] = useState(false);
	const [onboardingStep, setOnboardingStep] = useState(1);
	const [addedToast, setAddedToast] = useState<string | null>(null);

	// AMAZON 5-STEP SELLER ONBOARDING WIZARD FORM STATE
	const [wizardForm, setWizardForm] = useState({
		legalName: "",
		entityType: "LLC / Private Limited",
		einNumber: "",
		businessAddress: "",
		storeName: "",
		storeSlug: "",
		category: "Electronics & Gadgets",
		ownerEmail: "",
		phone: "",
		description: "",
		ownerFullName: "",
		idDocType: "Passport",
		idDocNumber: "",
		idDocVerified: true,
		bankAccountHolder: "",
		bankRouting: "",
		accountIban: "",
		stripeConnectAgreed: true,
		taxIdVat: "",
		w9DeclarationConfirmed: true
	});

	const handleCompleteAmazonOnboarding = (e: FormEvent) => {
		e.preventDefault();
		if (!wizardForm.storeName || !wizardForm.ownerEmail) return;

		const newId = `v-${Date.now()}`;
		const newVendor: MedusaVendor = {
			id: newId,
			slug: wizardForm.storeSlug || wizardForm.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
			name: wizardForm.storeName,
			legalName: wizardForm.legalName || wizardForm.storeName,
			entityType: wizardForm.entityType,
			einNumber: wizardForm.einNumber || "EIN-99-402910",
			logo: "🏬",
			banner: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
			ownerEmail: wizardForm.ownerEmail,
			phone: wizardForm.phone || "+1 (555) 019-2831",
			category: wizardForm.category,
			rating: 5.0,
			reviewsCount: 1,
			totalProducts: 0,
			grossSales: 0,
			totalEarnings: 0,
			payoutStatus: "Connected (Stripe Active)",
			bankAccountIban: wizardForm.accountIban || "US94029102948102",
			taxIdVat: wizardForm.taxIdVat || "TAX-US94021",
			kycVerified: true,
			location: wizardForm.businessAddress || "Online Verified Merchant 🌐",
			description: wizardForm.description || "Official verified seller store on Office Connect Marketplace."
		};

		setVendors([...vendors, newVendor]);
		setShowAmazonOnboardingWizard(false);
		setOnboardingStep(1);
		alert(`🎉 Amazon Verification Complete! Store "${wizardForm.storeName}" is live!`);
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

	return (
		<div className="min-h-screen bg-[#f8fafc] font-sans text-[#1f2430] flex flex-col antialiased selection:bg-[#404d85] selection:text-white">
			
			{/* TOP UTILITY HEADER BAR */}
			<div className="bg-[#1f2430] text-white px-4 sm:px-8 py-2 text-xs font-semibold border-b border-[#252f5a]">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-6 text-blue-200">
						<span>🚚 Express Delivery Across All Verified Vendor Stores</span>
						<span className="hidden md:inline font-normal text-zinc-300">• 1,280+ Live Buyers Online</span>
					</div>

					<div className="flex items-center gap-4 text-xs">
						<button
							onClick={() => setShowAmazonOnboardingWizard(true)}
							className="text-amber-300 font-extrabold hover:underline flex items-center gap-1"
						>
							<span>📋 Amazon Seller Onboarding</span>
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
							placeholder="Search products across all verified seller stores..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-transparent focus:outline-none text-[#1f2430] placeholder-zinc-400 font-medium"
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-3 shrink-0">
						<button
							onClick={() => setShowAmazonOnboardingWizard(true)}
							className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#323d6a] transition"
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

			{/* STYLISH 3D INTERACTIVE MARKETPLACE INTRO BANNER CARD (GLOBAL STORE FRONT ONLY) */}
			{activeVendorId === "All" && (
				<section className="relative overflow-hidden bg-gradient-to-r from-[#1f2430] via-[#252f5a] to-[#404d85] text-white py-12 px-4 sm:px-8 border-b border-[#323d6a] shadow-xl">
					
					{/* Ambient Glowing Halo background effects */}
					<div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#6678c1]/20 rounded-full blur-3xl pointer-events-none" />
					<div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

					<div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
						
						{/* Left Storytelling Text */}
						<div className="space-y-5 text-center lg:text-left">
							<span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 text-xs font-extrabold text-blue-200 shadow-xl">
								<span>✨</span> 3D MULTI-VENDOR MARKETPLACE PLATFORM
							</span>

							<h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
								The Next-Gen Hub for <br />
								<span className="bg-gradient-to-r from-blue-200 via-indigo-200 to-white bg-clip-text text-transparent">
									Verified Sellers & Global Brands
								</span>
							</h1>

							<p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
								Shop certified products directly from top-rated merchants across cosmetics, audio, cloud servers, and motor spares. Built with 100% Stripe Connect escrow protection.
							</p>

							{/* Interactive 3D Marketplace Metrics Strip */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-left">
								<div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
									<div className="text-[10px] text-blue-200 font-bold">Escrow Safety</div>
									<div className="text-sm font-black text-emerald-300">100% Protection</div>
								</div>
								<div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
									<div className="text-[10px] text-blue-200 font-bold">Platform Fee</div>
									<div className="text-sm font-black text-amber-300">8.5% Low Cut</div>
								</div>
								<div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
									<div className="text-[10px] text-blue-200 font-bold">Delivery</div>
									<div className="text-sm font-black text-blue-200">Express 48-Hr</div>
								</div>
								<div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
									<div className="text-[10px] text-blue-200 font-bold">Verified Stores</div>
									<div className="text-sm font-black text-white">500+ Active</div>
								</div>
							</div>

							<div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
								<button
									onClick={() => setShowAmazonOnboardingWizard(true)}
									className="rounded-2xl bg-white px-6 py-3.5 text-xs font-black text-[#404d85] shadow-2xl hover:bg-blue-50 transition transform hover:-translate-y-0.5"
								>
									📋 Register Store (5-Step Wizard)
								</button>
								<Link
									href="/vendor-dashboard"
									className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition"
								>
									🔑 Access Seller Portal ↗
								</Link>
							</div>
						</div>

						{/* Right 3D Interactive Showcase Card */}
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
								className="relative w-full max-w-md aspect-[4/3] rounded-3xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/30 p-6 backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col justify-between group overflow-hidden"
							>
								<div className="flex justify-between items-center">
									<span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-3 py-1 text-[10px] font-black text-emerald-200 uppercase tracking-wider">
										3D Interactive Marketplace
									</span>
									<span className="text-xl">✨</span>
								</div>

								<div className="my-auto text-center space-y-3">
									<img
										src={products[0].image}
										alt="Marketplace Featured Product"
										className="w-44 h-44 object-cover mx-auto rounded-2xl border border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-500"
									/>
									<h3 className="text-lg font-black text-white">{products[0].title}</h3>
									<p className="text-xs text-blue-200">{products[0].vendorName}</p>
								</div>

								<div className="flex justify-between items-center pt-3 border-t border-white/15 text-xs">
									<span className="font-black text-emerald-300 text-lg">${products[0].price.toFixed(2)}</span>
									<span className="font-bold text-blue-200 group-hover:underline">Interactive 3D Stage ↗</span>
								</div>
							</div>
						</div>

					</div>
				</section>
			)}

			{/* DEDICATED VENDOR STOREFRONT BANNER HEADER (IF FILTERED BY VENDOR) */}
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
									<span>•</span>
									<span>🏛️ {activeVendorObj.legalName} ({activeVendorObj.entityType})</span>
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

			{/* QUICK VENDORS FILTER BAR */}
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
						onClick={() => setShowAmazonOnboardingWizard(true)}
						className="rounded-xl bg-[#404d85] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]"
					>
						+ Amazon Seller Onboarding
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

			{/* AMAZON-GRADE 5-STEP SELLER ONBOARDING WIZARD MODAL */}
			{showAmazonOnboardingWizard && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
					<div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl relative border border-zinc-200 space-y-6 my-6 max-h-[92vh] overflow-y-auto">
						<button onClick={() => setShowAmazonOnboardingWizard(false)} className="absolute right-6 top-6 text-zinc-400 font-bold text-xl">✕</button>

						<div className="space-y-2">
							<span className="rounded-full bg-[#404d85]/10 border border-[#404d85]/20 px-3 py-1 text-xs font-extrabold text-[#404d85]">
								📋 AMAZON SELLER CENTRAL VERIFICATION WIZARD
							</span>
							<h2 className="text-2xl font-black text-[#1f2430]">Seller Onboarding & KYC/KYB Verification</h2>
						</div>

						{/* 5-Step Progress Bar */}
						<div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold">
							{[
								{ step: 1, name: "1. Business Identity" },
								{ step: 2, name: "2. Store Profile" },
								{ step: 3, name: "3. Owner KYC" },
								{ step: 4, name: "4. Bank Payout" },
								{ step: 5, name: "5. Tax Declaration" }
							].map((item) => (
								<div key={item.step} className="space-y-1">
									<div className={`h-2 rounded-full transition-all ${
										onboardingStep >= item.step ? "bg-[#404d85]" : "bg-zinc-200"
									}`} />
									<span className={onboardingStep >= item.step ? "text-[#404d85] font-extrabold" : "text-zinc-400"}>
										{item.name}
									</span>
								</div>
							))}
						</div>

						{/* STEP 1: BUSINESS IDENTITY & KYB */}
						{onboardingStep === 1 && (
							<div className="space-y-4 text-xs font-medium">
								<h3 className="font-extrabold text-sm text-[#404d85] border-b border-zinc-100 pb-2">
									🏛️ Step 1: Legal Business Entity (KYB)
								</h3>
								<div>
									<label className="block font-bold text-zinc-700">Legal Business Name *</label>
									<input
										type="text"
										required
										placeholder="e.g. Apex Electronics Global SAS"
										value={wizardForm.legalName}
										onChange={(e) => setWizardForm({ ...wizardForm, legalName: e.target.value })}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block font-bold text-zinc-700">Business Structure Type *</label>
										<select
											value={wizardForm.entityType}
											onChange={(e) => setWizardForm({ ...wizardForm, entityType: e.target.value })}
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-bold text-[#404d85]"
										>
											<option value="LLC / Private Limited">LLC / Private Limited</option>
											<option value="Sole Proprietorship">Sole Proprietorship / Individual</option>
											<option value="Corporation">Corporation / Public Ltd</option>
											<option value="Partnership">Partnership</option>
										</select>
									</div>
									<div>
										<label className="block font-bold text-zinc-700">Company Registration EIN/CRN *</label>
										<input
											type="text"
											required
											placeholder="EIN-98-4029102"
											value={wizardForm.einNumber}
											onChange={(e) => setWizardForm({ ...wizardForm, einNumber: e.target.value })}
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-mono"
										/>
									</div>
								</div>
								<div>
									<label className="block font-bold text-zinc-700">Registered Business Address *</label>
									<input
										type="text"
										required
										placeholder="100 Market Street, Suite 400, San Francisco, CA 94105"
										value={wizardForm.businessAddress}
										onChange={(e) => setWizardForm({ ...wizardForm, businessAddress: e.target.value })}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
									/>
								</div>
								<button onClick={() => setOnboardingStep(2)} className="w-full rounded-xl bg-[#404d85] py-3.5 font-bold text-white shadow-lg">
									Continue to Step 2: Store Profile →
								</button>
							</div>
						)}

						{/* STEP 2: STORE PROFILE & BRANDING */}
						{onboardingStep === 2 && (
							<div className="space-y-4 text-xs font-medium">
								<h3 className="font-extrabold text-sm text-[#404d85] border-b border-zinc-100 pb-2">
									🏪 Step 2: Store Branding & Identity
								</h3>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block font-bold text-zinc-700">Store Display Name *</label>
										<input
											type="text"
											required
											placeholder="e.g. Apex Electronics ⚡"
											value={wizardForm.storeName}
											onChange={(e) => setWizardForm({ ...wizardForm, storeName: e.target.value, storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })}
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
										/>
									</div>
									<div>
										<label className="block font-bold text-zinc-700">Store Slug / Handle *</label>
										<input
											type="text"
											required
											placeholder="apex-electronics"
											value={wizardForm.storeSlug}
											onChange={(e) => setWizardForm({ ...wizardForm, storeSlug: e.target.value })}
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-mono"
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block font-bold text-zinc-700">Primary Product Category *</label>
										<select
											value={wizardForm.category}
											onChange={(e) => setWizardForm({ ...wizardForm, category: e.target.value })}
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-bold text-[#404d85]"
										>
											<option value="Electronics & Gadgets">Electronics & Gadgets</option>
											<option value="Beauty & Personal Care">Beauty & Personal Care</option>
											<option value="Enterprise Software & Cloud">Enterprise Software & Cloud</option>
											<option value="Automotive Parts & Services">Automotive Parts & Services</option>
										</select>
									</div>
									<div>
										<label className="block font-bold text-zinc-700">Customer Support Email *</label>
										<input
											type="email"
											required
											placeholder="support@apexelectronics.com"
											value={wizardForm.ownerEmail}
											onChange={(e) => setWizardForm({ ...wizardForm, ownerEmail: e.target.value })}
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
										/>
									</div>
								</div>
								<div className="flex gap-3">
									<button onClick={() => setOnboardingStep(1)} className="w-1/3 rounded-xl border border-zinc-300 py-3 font-bold text-zinc-700">
										← Back
									</button>
									<button onClick={() => setOnboardingStep(3)} className="w-2/3 rounded-xl bg-[#404d85] py-3 font-bold text-white shadow-lg">
										Continue to Step 3: Owner KYC →
									</button>
								</div>
							</div>
						)}

						{/* STEP 3: OWNER KYC VERIFICATION */}
						{onboardingStep === 3 && (
							<div className="space-y-4 text-xs font-medium">
								<h3 className="font-extrabold text-sm text-[#404d85] border-b border-zinc-100 pb-2">
									👤 Step 3: Representative Identity (KYC Verification)
								</h3>
								<div>
									<label className="block font-bold text-zinc-700">Primary Owner / Contact Full Name *</label>
									<input
										type="text"
										required
										placeholder="Johnathan Doe"
										value={wizardForm.ownerFullName}
										onChange={(e) => setWizardForm({ ...wizardForm, ownerFullName: e.target.value })}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block font-bold text-zinc-700">Government Photo ID Type *</label>
										<select
											value={wizardForm.idDocType}
											onChange={(e) => setWizardForm({ ...wizardForm, idDocType: e.target.value })}
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-bold text-[#404d85]"
										>
											<option value="Passport">Passport</option>
											<option value="Driver's License">Driver's License</option>
											<option value="National Identity Card">National Identity Card</option>
										</select>
									</div>
									<div>
										<label className="block font-bold text-zinc-700">ID Document Number *</label>
										<input
											type="text"
											required
											placeholder="P-94820194"
											value={wizardForm.idDocNumber}
											onChange={(e) => setWizardForm({ ...wizardForm, idDocNumber: e.target.value })}
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-mono"
										/>
									</div>
								</div>
								<div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
									<span>✓ Photo ID Document Uploaded & Verified</span>
									<span className="text-emerald-600 font-extrabold">Auto-Pass KYB</span>
								</div>
								<div className="flex gap-3">
									<button onClick={() => setOnboardingStep(2)} className="w-1/3 rounded-xl border border-zinc-300 py-3 font-bold text-zinc-700">
										← Back
									</button>
									<button onClick={() => setOnboardingStep(4)} className="w-2/3 rounded-xl bg-[#404d85] py-3 font-bold text-white shadow-lg">
										Continue to Step 4: Bank Payout →
									</button>
								</div>
							</div>
						)}

						{/* STEP 4: BANK PAYOUT & STRIPE CONNECT */}
						{onboardingStep === 4 && (
							<div className="space-y-4 text-xs font-medium">
								<h3 className="font-extrabold text-sm text-[#404d85] border-b border-zinc-100 pb-2">
									💳 Step 4: Payout Banking & Stripe Connect Setup
								</h3>
								<div>
									<label className="block font-bold text-zinc-700">Bank Account Holder Name *</label>
									<input
										type="text"
										required
										placeholder="Apex Electronics Global LLC"
										value={wizardForm.bankAccountHolder}
										onChange={(e) => setWizardForm({ ...wizardForm, bankAccountHolder: e.target.value })}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block font-bold text-zinc-700">Routing Number / Sort Code *</label>
										<input
											type="text"
											required
											placeholder="121000358"
											value={wizardForm.bankRouting}
											onChange={(e) => setWizardForm({ ...wizardForm, bankRouting: e.target.value })}
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-mono"
										/>
									</div>
									<div>
										<label className="block font-bold text-zinc-700">Bank IBAN / Account Number *</label>
										<input
											type="text"
											required
											placeholder="US8930192840192019"
											value={wizardForm.accountIban}
											onChange={(e) => setWizardForm({ ...wizardForm, accountIban: e.target.value })}
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-mono"
										/>
									</div>
								</div>
								<div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-[#404d85] text-xs font-bold flex items-center justify-between">
									<span>🟢 Stripe Connect Escrow Wallet Enabled (8.5% Fee Split)</span>
									<span className="font-extrabold text-emerald-600">Active</span>
								</div>
								<div className="flex gap-3">
									<button onClick={() => setOnboardingStep(3)} className="w-1/3 rounded-xl border border-zinc-300 py-3 font-bold text-zinc-700">
										← Back
									</button>
									<button onClick={() => setOnboardingStep(5)} className="w-2/3 rounded-xl bg-[#404d85] py-3 font-bold text-white shadow-lg">
										Continue to Step 5: Tax Declaration →
									</button>
								</div>
							</div>
						)}

						{/* STEP 5: TAX & FINAL SUBMISSION */}
						{onboardingStep === 5 && (
							<form onSubmit={handleCompleteAmazonOnboarding} className="space-y-4 text-xs font-medium">
								<h3 className="font-extrabold text-sm text-[#404d85] border-b border-zinc-100 pb-2">
									📑 Step 5: Tax Compliance & W-9 Declaration
								</h3>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block font-bold text-zinc-700">Taxpayer TIN / SSN / EIN *</label>
										<input
											type="text"
											required
											placeholder="TIN-98-401920"
											value={wizardForm.taxIdVat}
											onChange={(e) => setWizardForm({ ...wizardForm, taxIdVat: e.target.value })}
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-mono"
										/>
									</div>
									<div>
										<label className="block font-bold text-zinc-700">Sales Tax / VAT Registration ID</label>
										<input
											type="text"
											placeholder="VAT-US94021"
											className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-mono"
										/>
									</div>
								</div>

								<div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium space-y-2">
									<label className="flex items-center gap-2 font-bold text-zinc-800 cursor-pointer">
										<input type="checkbox" required defaultChecked className="rounded text-[#404d85]" />
										<span>I hereby declare that all legal entity, banking, and tax documents submitted are accurate under perjury of law.</span>
									</label>
								</div>

								<div className="flex gap-3">
									<button type="button" onClick={() => setOnboardingStep(4)} className="w-1/3 rounded-xl border border-zinc-300 py-3.5 font-bold text-zinc-700">
										← Back
									</button>
									<button type="submit" className="w-2/3 rounded-xl bg-gradient-to-r from-emerald-600 to-[#404d85] py-3.5 font-extrabold text-white shadow-xl hover:opacity-90 transition">
										🎉 Complete Verification & Launch Storefront
									</button>
								</div>
							</form>
						)}

					</div>
				</div>
			)}

		</div>
	);
}
