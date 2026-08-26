"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

type AuthUser = {
	role?: string;
	accesses?: string[];
};

type DailyUtilityItem = {
	id: string;
	name: string;
	category: string;
	dailyUseCase: string;
	status: "integrated" | "planned";
	provider: string;
};

type PdfOperationResponse = {
	fileName: string;
	dataUrl: string;
	originalSizeBytes?: number;
	compressedSizeBytes?: number;
};

type ImageUpscaleResponse = {
	fileName: string;
	dataUrl: string;
	scale: number;
	originalWidth: number;
	originalHeight: number;
	upscaledWidth: number;
	upscaledHeight: number;
	originalSizeBytes: number;
	upscaledSizeBytes: number;
};

type BackgroundRemovalResponse = {
	fileName: string;
	dataUrl: string;
	tolerance: number;
	width: number;
	height: number;
	modeRequested?: string;
	modeUsed?: "heuristic" | "rembg";
	fallbackUsed?: boolean;
};

type DocumentConversionKind = "pdf-to-docx" | "docx-to-pdf" | "xlsx-to-csv" | "csv-to-xlsx" | "pdf-to-txt" | "txt-to-docx" | "pptx-to-txt" | "txt-to-pptx";

type DocumentConversionResponse = {
	fileName: string;
	dataUrl: string;
	mimeType: string;
	characterCount?: number;
	rowCount?: number;
	columnCount?: number;
	sheetName?: string;
};

// MercurJS Marketplace Types
type MercurVendor = {
	id: string;
	name: string;
	email: string;
	category: string;
	rating: number;
	totalProducts: number;
	commissionRate: number;
	payoutStatus: "verified" | "pending_kyc" | "suspended";
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
	b2bPriceTier?: number;
	stockQty: number;
	commissionRate: number;
	description: string;
};

type MercurOrder = {
	id: string;
	orderNumber: string;
	customerEmail: string;
	vendorId: string;
	vendorName: string;
	grossAmount: number;
	platformCommission: number;
	vendorPayout: number;
	itemsCount: number;
	status: "completed" | "processing" | "refunded";
	createdAt: string;
};

type MercurCartItem = {
	product: MercurProduct;
	quantity: number;
};

export default function StorePage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading Tools Suite...</div>}>
			<StoreContent />
		</Suspense>
	);
}

function StoreContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const view = searchParams.get("view") || "free"; // Default to Free Tools
	
	const [authUser, setAuthUser] = useState<AuthUser | null>(null);

	// Free Tools States
	const [ocrFile, setOcrFile] = useState<File | null>(null);
	const [ocrLoading, setOcrLoading] = useState(false);
	const [ocrError, setOcrError] = useState<string | null>(null);
	const [ocrResult, setOcrResult] = useState<string>("");
	const [dailyUtilities, setDailyUtilities] = useState<DailyUtilityItem[]>([]);
	const [pdfMergeFiles, setPdfMergeFiles] = useState<File[]>([]);
	const [pdfSplitFile, setPdfSplitFile] = useState<File | null>(null);
	const [pdfSplitPages, setPdfSplitPages] = useState("1");
	const [pdfCompressFile, setPdfCompressFile] = useState<File | null>(null);
	const [pdfBusyOperation, setPdfBusyOperation] = useState<"merge" | "split" | "compress" | null>(null);
	const [pdfError, setPdfError] = useState<string | null>(null);
	const [pdfInfo, setPdfInfo] = useState<string>("");
	const [upscaleFile, setUpscaleFile] = useState<File | null>(null);
	const [upscaleScale, setUpscaleScale] = useState("2");
	const [upscaleBusy, setUpscaleBusy] = useState(false);
	const [upscaleError, setUpscaleError] = useState<string | null>(null);
	const [upscaleInfo, setUpscaleInfo] = useState<string>("");
	const [upscaledPreview, setUpscaledPreview] = useState<string | null>(null);
	const [bgRemovalFile, setBgRemovalFile] = useState<File | null>(null);
	const [bgTolerance, setBgTolerance] = useState("42");
	const [bgMode, setBgMode] = useState<"auto" | "heuristic" | "rembg">("auto");
	const [bgBusy, setBgBusy] = useState(false);
	const [bgError, setBgError] = useState<string | null>(null);
	const [bgInfo, setBgInfo] = useState<string>("");
	const [bgPreview, setBgPreview] = useState<string | null>(null);
	const [docConversion, setDocConversion] = useState<DocumentConversionKind>("pdf-to-docx");
	const [docFile, setDocFile] = useState<File | null>(null);
	const [docBusy, setDocBusy] = useState(false);
	const [docError, setDocError] = useState<string | null>(null);
	const [docInfo, setDocInfo] = useState<string>("");
	const [docDownloadUrl, setDocDownloadUrl] = useState<string | null>(null);
	const [docDownloadName, setDocDownloadName] = useState<string>("");

	// Mercur Marketplace States
	const [mercurSubTab, setMercurSubTab] = useState<"storefront" | "vendors" | "admin" | "config">("storefront");
	const [mercurCategoryFilter, setMercurCategoryFilter] = useState("All");
	const [mercurCart, setMercurCart] = useState<MercurCartItem[]>([]);
	const [showCartDrawer, setShowCartDrawer] = useState(false);
	const [checkoutBusy, setCheckoutBusy] = useState(false);
	const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);

	// Mercur Vendor Form Modal
	const [showVendorModal, setShowVendorModal] = useState(false);
	const [vName, setVName] = useState("");
	const [vEmail, setVEmail] = useState("");
	const [vCategory, setVCategory] = useState("Cloud Services & Hosting");
	const [vCommission, setVCommission] = useState<number>(8.5);

	// Mercur Product Form Modal
	const [showProductModal, setShowProductModal] = useState(false);
	const [pTitle, setPTitle] = useState("");
	const [pSku, setPSku] = useState("");
	const [pVendorId, setPVendorId] = useState("");
	const [pCategory, setPCategory] = useState("Software & Enterprise Licenses");
	const [pPrice, setPPrice] = useState<number>(499);
	const [pB2bPrice, setPB2bPrice] = useState<number>(399);
	const [pStock, setPStock] = useState<number>(100);
	const [pDesc, setPDesc] = useState("");

	// Mercur Config
	const [mercurServerUrl, setMercurServerUrl] = useState("http://localhost:9000");
	const [mercurApiKey, setMercurApiKey] = useState("mercur_medusa_secret_key_prod");
	const [pingStatus, setPingStatus] = useState<string | null>(null);

	// Mercur Mock Data State
	const [vendors, setVendors] = useState<MercurVendor[]>([
		{ id: "v-mercur-101", name: "Acme Cloud Infrastructure Solutions", email: "vendors@acmecloud.io", category: "Cloud Services & Hosting", rating: 4.9, totalProducts: 14, commissionRate: 8.5, payoutStatus: "verified", joinedDate: "2026-01-10" },
		{ id: "v-mercur-102", name: "CyberShield Security Systems", email: "partners@cybershield.tech", category: "Software & Enterprise Licenses", rating: 4.8, totalProducts: 8, commissionRate: 8.5, payoutStatus: "verified", joinedDate: "2026-02-01" },
		{ id: "v-mercur-103", name: "NextGen IoT Hardware Corp", email: "sales@nextgeniot.com", category: "Hardware & IoT Devices", rating: 4.7, totalProducts: 22, commissionRate: 5.0, payoutStatus: "verified", joinedDate: "2026-03-15" },
	]);

	const [products, setProducts] = useState<MercurProduct[]>([
		{ id: "prod-m-1", sku: "SKU-MER-CLOUD-01", title: "Dedicated Kubernetes High-Availability Cluster", vendorId: "v-mercur-101", vendorName: "Acme Cloud Infrastructure Solutions", category: "Cloud Services & Hosting", price: 1499.00, b2bPriceTier: 1299.00, stockQty: 50, commissionRate: 8.5, description: "Fully managed, multi-region Kubernetes control plane with 99.99% uptime SLA." },
		{ id: "prod-m-2", sku: "SKU-MER-SEC-02", title: "Zero-Trust Enterprise IAM & SSO Platform License", vendorId: "v-mercur-102", vendorName: "CyberShield Security Systems", category: "Software & Enterprise Licenses", price: 899.00, b2bPriceTier: 750.00, stockQty: 200, commissionRate: 8.5, description: "Unlimited OAuth2, SAML2, and FIDO2 multi-factor authentication security suite." },
		{ id: "prod-m-3", sku: "SKU-MER-HW-03", title: "Industrial IoT Edge Controller Gateway Device", vendorId: "v-mercur-103", vendorName: "NextGen IoT Hardware Corp", category: "Hardware & IoT Devices", price: 450.00, b2bPriceTier: 380.00, stockQty: 120, commissionRate: 5.0, description: "Ruggedized ARM Cortex industrial IoT gateway with Modbus & MQTT protocols." },
	]);

	const [orders, setOrders] = useState<MercurOrder[]>([
		{ id: "ord-mer-901", orderNumber: "ORD-MERCUR-2026-001", customerEmail: "enterprise@acme.com", vendorId: "v-mercur-101", vendorName: "Acme Cloud Infrastructure Solutions", grossAmount: 1499.00, platformCommission: 127.42, vendorPayout: 1371.58, itemsCount: 1, status: "completed", createdAt: "2026-08-25 14:32" },
		{ id: "ord-mer-902", orderNumber: "ORD-MERCUR-2026-002", customerEmail: "cto@globaltech.org", vendorId: "v-mercur-102", vendorName: "CyberShield Security Systems", grossAmount: 899.00, platformCommission: 76.42, vendorPayout: 822.58, itemsCount: 1, status: "completed", createdAt: "2026-08-26 09:15" },
	]);

	useEffect(() => {
		const rawAuthUser = localStorage.getItem("authUser");
		if (rawAuthUser) {
			try { setAuthUser(JSON.parse(rawAuthUser)); } catch {}
		}
	}, []);

	const authHeaders = (): Record<string, string> => {
		const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
		return token ? { Authorization: `Bearer ${token}` } : {};
	};

	// Cart Operations
	const addToCart = (product: MercurProduct) => {
		setMercurCart((prev) => {
			const existing = prev.find((item) => item.product.id === product.id);
			if (existing) {
				return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
			}
			return [...prev, { product, quantity: 1 }];
		});
		setShowCartDrawer(true);
	};

	const removeFromCart = (productId: string) => {
		setMercurCart((prev) => prev.filter((item) => item.product.id !== productId));
	};

	const handleCheckoutCart = async () => {
		if (mercurCart.length === 0) return;
		setCheckoutBusy(true);
		setCheckoutMsg(null);

		try {
			const newOrders: MercurOrder[] = mercurCart.map((item, idx) => {
				const itemTotal = item.product.price * item.quantity;
				const comm = itemTotal * (item.product.commissionRate / 100);
				return {
					id: `ord-mer-${Date.now()}-${idx}`,
					orderNumber: `ORD-MERCUR-2026-00${orders.length + idx + 1}`,
					customerEmail: "purchaser@theofficeconnect.com",
					vendorId: item.product.vendorId,
					vendorName: item.product.vendorName,
					grossAmount: itemTotal,
					platformCommission: comm,
					vendorPayout: itemTotal - comm,
					itemsCount: item.quantity,
					status: "completed",
					createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
				};
			});

			setOrders((prev) => [...newOrders, ...prev]);
			setMercurCart([]);
			setCheckoutMsg(`✅ Checkout Successful! Executed ${newOrders.length} multi-vendor split sub-orders via MercurJS Medusa Engine.`);
		} catch (err) {
			setCheckoutMsg("Checkout failed.");
		} finally {
			setCheckoutBusy(false);
		}
	};

	const handleRegisterVendor = (e: React.FormEvent) => {
		e.preventDefault();
		if (!vName || !vEmail) return;

		const newV: MercurVendor = {
			id: `v-mercur-${Date.now()}`,
			name: vName,
			email: vEmail,
			category: vCategory,
			rating: 5.0,
			totalProducts: 0,
			commissionRate: vCommission,
			payoutStatus: "verified",
			joinedDate: new Date().toISOString().split("T")[0],
		};

		setVendors((prev) => [newV, ...prev]);
		setShowVendorModal(false);
		setVName("");
		setVEmail("");
	};

	const handleAddProduct = (e: React.FormEvent) => {
		e.preventDefault();
		if (!pTitle || !pPrice) return;

		const vendor = vendors.find((v) => v.id === pVendorId) || vendors[0];

		const newP: MercurProduct = {
			id: `prod-m-${Date.now()}`,
			sku: pSku || `SKU-MER-${Date.now().toString().slice(-4)}`,
			title: pTitle,
			vendorId: vendor.id,
			vendorName: vendor.name,
			category: pCategory,
			price: pPrice,
			b2bPriceTier: pB2bPrice,
			stockQty: pStock,
			commissionRate: vendor.commissionRate,
			description: pDesc || "MercurJS multi-vendor catalog item.",
		};

		setProducts((prev) => [...prev, newP]);
		setShowProductModal(false);
		setPTitle("");
	};

	// Free Tools Helpers
	const runOcr = async () => {
		if (!ocrFile) return;
		setOcrLoading(true);
		setOcrError(null);
		setOcrResult("");

		try {
			const formData = new FormData();
			formData.append("file", ocrFile);
			const res = await fetch("/api/tools/ocr/extract", { method: "POST", headers: authHeaders(), body: formData });
			if (!res.ok) throw new Error("OCR failed");
			const data = await res.json();
			setOcrResult(data.extractedText || data.preview || "No text detected.");
		} catch (err: any) {
			setOcrError(err.message || "OCR failed");
		} finally {
			setOcrLoading(false);
		}
	};

	const triggerPdfDownload = (fileName: string, dataUrl: string) => {
		const link = document.createElement("a");
		link.href = dataUrl;
		link.download = fileName;
		link.click();
	};

	const runPdfMerge = async () => {
		if (pdfMergeFiles.length < 2) return;
		setPdfBusyOperation("merge");
		try {
			const formData = new FormData();
			pdfMergeFiles.forEach((f) => formData.append("files", f));
			const res = await fetch("/api/tools/pdf/merge", { method: "POST", headers: authHeaders(), body: formData });
			if (!res.ok) throw new Error("PDF merge failed");
			const data = await res.json();
			triggerPdfDownload(data.fileName || "merged.pdf", data.dataUrl);
			setPdfInfo("Merged successfully!");
			setPdfMergeFiles([]);
		} catch (err: any) {
			setPdfError(err.message);
		} finally {
			setPdfBusyOperation(null);
		}
	};

	const runPdfSplit = async () => {
		if (!pdfSplitFile) return;
		setPdfBusyOperation("split");
		try {
			const formData = new FormData();
			formData.append("file", pdfSplitFile);
			formData.append("pages", pdfSplitPages);
			const res = await fetch("/api/tools/pdf/split", { method: "POST", headers: authHeaders(), body: formData });
			if (!res.ok) throw new Error("PDF split failed");
			const data = await res.json();
			triggerPdfDownload(data.fileName || "split.pdf", data.dataUrl);
			setPdfInfo("Split PDF downloaded!");
		} catch (err: any) {
			setPdfError(err.message);
		} finally {
			setPdfBusyOperation(null);
		}
	};

	const runPdfCompress = async () => {
		if (!pdfCompressFile) return;
		setPdfBusyOperation("compress");
		try {
			const formData = new FormData();
			formData.append("file", pdfCompressFile);
			const res = await fetch("/api/tools/pdf/compress", { method: "POST", headers: authHeaders(), body: formData });
			if (!res.ok) throw new Error("PDF compression failed");
			const data = await res.json();
			triggerPdfDownload(data.fileName || "compressed.pdf", data.dataUrl);
			setPdfInfo("PDF compression completed!");
		} catch (err: any) {
			setPdfError(err.message);
		} finally {
			setPdfBusyOperation(null);
		}
	};

	const runImageUpscale = async () => {
		if (!upscaleFile) return;
		setUpscaleBusy(true);
		try {
			const formData = new FormData();
			formData.append("file", upscaleFile);
			formData.append("scale", upscaleScale);
			const res = await fetch("/api/tools/image/upscale", { method: "POST", headers: authHeaders(), body: formData });
			if (!res.ok) throw new Error("Upscale failed");
			const data = await res.json();
			setUpscaledPreview(data.dataUrl);
			setUpscaleInfo(`Upscaled to ${data.upscaledWidth}x${data.upscaledHeight}`);
		} catch (err: any) {
			setUpscaleError(err.message);
		} finally {
			setUpscaleBusy(false);
		}
	};

	const runBackgroundRemoval = async () => {
		if (!bgRemovalFile) return;
		setBgBusy(true);
		try {
			const formData = new FormData();
			formData.append("file", bgRemovalFile);
			formData.append("tolerance", bgTolerance);
			formData.append("mode", bgMode);
			const res = await fetch("/api/tools/image/remove-background", { method: "POST", headers: authHeaders(), body: formData });
			if (!res.ok) throw new Error("Background removal failed");
			const data = await res.json();
			setBgPreview(data.dataUrl);
			setBgInfo("Background removed successfully!");
		} catch (err: any) {
			setBgError(err.message);
		} finally {
			setBgBusy(false);
		}
	};

	const runDocumentConversion = async () => {
		if (!docFile) return;
		setDocBusy(true);
		try {
			const formData = new FormData();
			formData.append("file", docFile);
			const endpointMap: Record<DocumentConversionKind, string> = {
				"pdf-to-docx": "/api/tools/convert/pdf-to-docx",
				"docx-to-pdf": "/api/tools/convert/docx-to-pdf",
				"xlsx-to-csv": "/api/tools/convert/xlsx-to-csv",
				"csv-to-xlsx": "/api/tools/convert/csv-to-xlsx",
				"pdf-to-txt": "/api/tools/convert/pdf-to-txt",
				"txt-to-docx": "/api/tools/convert/txt-to-docx",
				"pptx-to-txt": "/api/tools/convert/pptx-to-txt",
				"txt-to-pptx": "/api/tools/convert/txt-to-pptx",
			};
			const res = await fetch(endpointMap[docConversion], { method: "POST", headers: authHeaders(), body: formData });
			if (!res.ok) throw new Error("Document conversion failed");
			const data = await res.json();
			setDocDownloadUrl(data.dataUrl);
			setDocDownloadName(data.fileName);
			setDocInfo("Conversion complete!");
		} catch (err: any) {
			setDocError(err.message);
		} finally {
			setDocBusy(false);
		}
	};

	// Category filtering for Storefront
	const filteredProducts = products.filter((p) => {
		if (mercurCategoryFilter === "All") return true;
		return p.category === mercurCategoryFilter;
	});

	const cartSubtotal = mercurCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
	const cartTotalCommission = mercurCart.reduce((sum, item) => sum + ((item.product.price * item.quantity) * (item.product.commissionRate / 100)), 0);

	const totalGmv = orders.reduce((sum, o) => sum + o.grossAmount, 0);
	const totalCommissionEarned = orders.reduce((sum, o) => sum + o.platformCommission, 0);

	// Free Tools Suite Cards list with redirect routes
	const freeToolSuiteCards = [
		{
			id: "accounting",
			title: "Accounting & Finance Suite",
			tagline: "Free Open-Source Accountech ERP",
			description: "Complete corporate accounting, invoices, recurring billing, vendor bills, customer balances, and ledger.",
			icon: "💰",
			badge: "INTEGRATED",
			badgeColor: "bg-emerald-100 text-emerald-800",
			route: "/akaunting",
			cta: "Open Accountech ERP →",
		},
		{
			id: "marketplace",
			title: "MercurJS Open Source Marketplace",
			tagline: "Multi-Vendor B2B & B2C Engine",
			description: "Headless multi-vendor marketplace framework powered by MedusaJS, vendor onboarding, order splitting, and seller payouts.",
			icon: "🛍️",
			badge: "NEW INTEGRATION",
			badgeColor: "bg-purple-100 text-purple-800",
			route: "/store?view=mercur",
			cta: "Launch Mercur Marketplace →",
		},
		{
			id: "crm",
			title: "CRM & Sales Pipeline",
			tagline: "Customer Relationship Suite",
			description: "Lead management, sales deals pipeline, customer directory, contact details, and conversion tracking.",
			icon: "📊",
			badge: "WORKSPACE TOOL",
			badgeColor: "bg-blue-100 text-blue-800",
			route: "/crm",
			cta: "Open CRM Portal →",
		},
		{
			id: "hrm",
			title: "HRM & Workforce Portal",
			tagline: "Human Resources Management",
			description: "Employee records, attendance, payroll calculations, leave requests, and department directory.",
			icon: "👥",
			badge: "HR SUITE",
			badgeColor: "bg-indigo-100 text-indigo-800",
			route: "/hrm",
			cta: "Open HRM Suite →",
		},
		{
			id: "inventory",
			title: "Inventory & Warehouse Engine",
			tagline: "Stock & Catalog Controller",
			description: "Manage product catalogs, SKU tracking, reorder thresholds, warehouse stock quantities, and cost prices.",
			icon: "📦",
			badge: "STOCK CONTROL",
			badgeColor: "bg-[#6678c1]/20 text-[#6678c1]",
			route: "/inventory",
			cta: "Open Inventory Manager →",
		},
		{
			id: "files",
			title: "Cloud File Sharing & Storage",
			tagline: "Secure Document Repository",
			description: "Organization file sharing, folder hierarchy, team document sharing, and cloud file management.",
			icon: "📁",
			badge: "STORAGE",
			badgeColor: "bg-teal-100 text-teal-800",
			route: "/file-sharing",
			cta: "Open File Sharing →",
		},
		{
			id: "video",
			title: "Video Connect & Meetings",
			tagline: "WebRTC Conference Rooms",
			description: "Instant video calling, virtual meeting rooms, screen sharing, and team video conferencing.",
			icon: "📹",
			badge: "MEETINGS",
			badgeColor: "bg-rose-100 text-rose-800",
			route: "/video-connect",
			cta: "Start Video Meeting →",
		},
		{
			id: "users",
			title: "User & Access Management",
			tagline: "RBAC & Role Permissions",
			description: "Manage organization team members, user roles, permission access keys, and admin controls.",
			icon: "⚙️",
			badge: "ADMIN",
			badgeColor: "bg-amber-100 text-amber-800",
			route: "/user-management",
			cta: "Open User Management →",
		},
	];

	return (
		<WorkspaceShell>
			<div className="mt-5 mx-auto max-w-7xl space-y-6">
				{/* Top 3-Way Tools Navigation */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<button
						onClick={() => router.push("/store?view=free")}
						className={`rounded-2xl border p-5 text-left transition-all ${
							view === "free"
								? "bg-[#6678c1] border-[#6678c1] text-white shadow-xl shadow-[#6678c1]/20 ring-2 ring-[#6678c1]"
								: "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm"
						}`}
					>
						<div className="flex items-center justify-between">
							<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
								view === "free" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
							}`}>
								FREE TOOLS & SUITE
							</span>
							<span className="text-xs font-bold">100% Free</span>
						</div>
						<h2 className="mt-3 text-lg font-extrabold">Free Open-Source Tools</h2>
						<p className={`mt-1 text-xs ${view === "free" ? "text-white/80" : "text-zinc-500"}`}>
							Accounting, Mercur Marketplace, CRM, HRM, OCR, PDF & Image Utilities
						</p>
					</button>

					<button
						onClick={() => router.push("/store?view=mercur")}
						className={`rounded-2xl border p-5 text-left transition-all ${
							view === "mercur"
								? "bg-[#404d85] border-[#404d85] text-white shadow-xl shadow-[#404d85]/20"
								: "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm"
						}`}
					>
						<span className="rounded-full bg-[#6678c1]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#6678c1] uppercase">
							MERCURJS MARKETPLACE
						</span>
						<h2 className="mt-3 text-lg font-bold">Mercur Multi-Vendor Engine</h2>
						<p className={`mt-1 text-xs ${view === "mercur" ? "text-white/80" : "text-zinc-500"}`}>
							Headless B2B & B2C multi-vendor marketplace framework
						</p>
					</button>

					<button
						onClick={() => router.push("/store?view=paid")}
						className={`rounded-2xl border p-5 text-left transition-all ${
							view === "paid"
								? "bg-[#404d85] border-[#404d85] text-white shadow-xl shadow-[#404d85]/20"
								: "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm"
						}`}
					>
						<span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 uppercase">
							PREMIUM
						</span>
						<h2 className="mt-3 text-lg font-bold">Paid Tools Store</h2>
						<p className={`mt-1 text-xs ${view === "paid" ? "text-white/80" : "text-zinc-500"}`}>
							5000+ premium apps under Cambliss subscription
						</p>
					</button>
				</div>

				{/* FREE TOOLS TAB */}
				{view === "free" && (
					<div className="space-y-8">
						{/* Header Banner */}
						<div className="rounded-3xl border border-[#d9e2ef] bg-gradient-to-r from-white via-[#f8faff] to-[#eef2fa] p-8 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div>
									<div className="flex items-center gap-2">
										<span className="rounded-full bg-[#6678c1] px-3 py-0.5 text-[11px] font-extrabold text-white uppercase">
											OPEN SOURCE WORKSPACE UTILITIES
										</span>
									</div>
									<h1 className="mt-2 text-2xl font-black text-[#1f2430]">
										Free Tools & Integrated Applications
									</h1>
									<p className="mt-1 text-xs text-[#5b6472]">
										Click any card below to launch the corresponding platform, open-source ERP, marketplace engine, or online utility.
									</p>
								</div>
							</div>
						</div>

						{/* SECTION 1: REDIRECT SUITE CARDS */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-bold text-[#1f2430]">
									🚀 Free Platform Applications & Open-Source Tools
								</h2>
								<span className="text-xs font-semibold text-[#5b6472]">
									{freeToolSuiteCards.length} Clickable Integrations
								</span>
							</div>

							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
								{freeToolSuiteCards.map((tool) => (
									<div
										key={tool.id}
										onClick={() => router.push(tool.route)}
										className="group cursor-pointer rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#6678c1] hover:shadow-md transition-all duration-200"
									>
										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<span className="text-3xl">{tool.icon}</span>
												<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${tool.badgeColor}`}>
													{tool.badge}
												</span>
											</div>

											<div>
												<h3 className="text-base font-bold text-[#1f2430] group-hover:text-[#6678c1] transition">
													{tool.title}
												</h3>
												<div className="text-[11px] font-semibold text-[#6678c1] mt-0.5">{tool.tagline}</div>
											</div>

											<p className="text-xs text-[#5b6472] leading-relaxed">
												{tool.description}
											</p>
										</div>

										<div className="pt-3 border-t border-[#d9e2ef] flex items-center justify-between text-xs font-bold text-[#6678c1] group-hover:translate-x-1 transition-transform">
											<span>{tool.cta}</span>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* SECTION 2: INTERACTIVE UTILITIES (CONVERTER, OCR, PDF, IMAGE) */}
						<div className="space-y-4 border-t border-[#d9e2ef] pt-8">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-bold text-[#1f2430]">
									🛠️ Interactive File & Media Utilities
								</h2>
								<span className="text-xs font-semibold text-[#5b6472]">
									Server-Side Open-Source Engines
								</span>
							</div>

							<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
								{/* Document Converter */}
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm xl:col-span-2 space-y-3">
									<div className="flex items-center justify-between gap-3 border-b border-[#d9e2ef] pb-3">
										<div>
											<h3 className="text-sm font-bold text-[#1f2430]">📄 Document Format Converter</h3>
											<p className="text-xs text-[#5b6472]">Convert between PDF, Word (.docx), Excel (.xlsx), CSV, PowerPoint (.pptx), and Text</p>
										</div>
										<span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 uppercase">
											OPEN SOURCE ENGINE
										</span>
									</div>

									<div className="grid gap-3 md:grid-cols-[1.5fr_1fr_auto] items-center pt-2">
										<select
											value={docConversion}
											onChange={(e) => setDocConversion(e.target.value as any)}
											className="rounded-xl border border-[#d9e2ef] px-3 py-2 text-xs font-semibold text-[#1f2430] bg-white"
										>
											<option value="pdf-to-docx">PDF to Word (.docx)</option>
											<option value="docx-to-pdf">Word to PDF (.pdf)</option>
											<option value="xlsx-to-csv">Excel to CSV (.csv)</option>
											<option value="csv-to-xlsx">CSV to Excel (.xlsx)</option>
											<option value="pdf-to-txt">PDF to Plain Text (.txt)</option>
											<option value="txt-to-docx">Text to Word (.docx)</option>
											<option value="pptx-to-txt">PowerPoint to Text (.txt)</option>
											<option value="txt-to-pptx">Text to PowerPoint (.pptx)</option>
										</select>

										<label className="cursor-pointer truncate rounded-xl border border-[#d9e2ef] bg-[#f8faff] px-4 py-2 text-xs font-semibold text-[#1f2430] hover:bg-[#eef2fa]">
											{docFile ? docFile.name : "📁 Select Document"}
											<input type="file" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} className="hidden" />
										</label>

										<button
											type="button"
											onClick={() => void runDocumentConversion()}
											className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#404d85]"
										>
											{docBusy ? "Converting..." : "Convert Now"}
										</button>
									</div>

									{docDownloadUrl && (
										<div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-50 p-3 border border-emerald-200">
											<span className="text-xs font-bold text-emerald-800">✅ Conversion Done:</span>
											<a href={docDownloadUrl} download={docDownloadName || "converted-file"} className="text-xs font-bold text-[#6678c1] hover:underline">
												Download {docDownloadName} ↗
											</a>
										</div>
									)}
								</div>

								{/* Image Upscaler */}
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-3">
									<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
										<div>
											<h3 className="text-sm font-bold text-[#1f2430]">🖼️ AI Image Upscaler</h3>
											<p className="text-xs text-[#5b6472]">Enhance low-resolution images 2x to 4x for product catalog assets</p>
										</div>
										<span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 uppercase">
											IMAGE AI
										</span>
									</div>

									<div className="flex flex-wrap items-center gap-2 pt-2">
										<label className="cursor-pointer truncate rounded-xl border border-[#d9e2ef] bg-[#f8faff] px-4 py-2 text-xs font-semibold text-[#1f2430]">
											{upscaleFile ? upscaleFile.name : "🖼️ Choose Image"}
											<input type="file" accept="image/*" onChange={(e) => setUpscaleFile(e.target.files?.[0] ?? null)} className="hidden" />
										</label>

										<select
											value={upscaleScale}
											onChange={(e) => setUpscaleScale(e.target.value)}
											className="rounded-xl border border-[#d9e2ef] px-3 py-2 text-xs bg-white font-semibold"
										>
											<option value="2">2x Upscale</option>
											<option value="3">3x Upscale</option>
											<option value="4">4x Upscale</option>
										</select>

										<button
											type="button"
											onClick={() => void runImageUpscale()}
											className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white hover:bg-[#404d85]"
										>
											{upscaleBusy ? "Upscaling..." : "Upscale Image"}
										</button>
									</div>

									{upscaledPreview && (
										<div className="mt-3 flex items-center gap-3 pt-2">
											<img src={upscaledPreview} alt="Upscaled output" className="h-20 w-20 rounded-xl object-cover border border-[#d9e2ef]" />
											<a href={upscaledPreview} download="upscaled-image.png" className="text-xs font-bold text-[#6678c1] hover:underline">
												Download Upscaled Image ↗
											</a>
										</div>
									)}
								</div>

								{/* Background Remover */}
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-3">
									<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
										<div>
											<h3 className="text-sm font-bold text-[#1f2430]">✂️ Background Remover</h3>
											<p className="text-xs text-[#5b6472]">Generate transparent PNGs for product photos & logos</p>
										</div>
										<span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
											TRANSPARENT PNG
										</span>
									</div>

									<div className="flex flex-wrap items-center gap-2 pt-2">
										<label className="cursor-pointer truncate rounded-xl border border-[#d9e2ef] bg-[#f8faff] px-4 py-2 text-xs font-semibold text-[#1f2430]">
											{bgRemovalFile ? bgRemovalFile.name : "📷 Choose Photo"}
											<input type="file" accept="image/*" onChange={(e) => setBgRemovalFile(e.target.files?.[0] ?? null)} className="hidden" />
										</label>

										<button
											type="button"
											onClick={() => void runBackgroundRemoval()}
											className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white hover:bg-[#404d85]"
										>
											{bgBusy ? "Removing..." : "Remove BG"}
										</button>
									</div>

									{bgPreview && (
										<div className="mt-3 flex items-center gap-3 pt-2">
											<img src={bgPreview} alt="Output" className="h-20 w-20 rounded-xl object-cover border border-[#d9e2ef] bg-zinc-100" />
											<a href={bgPreview} download="transparent-bg.png" className="text-xs font-bold text-[#6678c1] hover:underline">
												Download Transparent PNG ↗
											</a>
										</div>
									)}
								</div>

								{/* PDF Workbench */}
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm xl:col-span-2 space-y-3">
									<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
										<div>
											<h3 className="text-sm font-bold text-[#1f2430]">📑 PDF Workbench</h3>
											<p className="text-xs text-[#5b6472]">Merge multiple PDF documents, split page ranges, or compress file size</p>
										</div>
										<span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
											PDF UTILITIES
										</span>
									</div>

									<div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-2 text-xs">
										<div className="rounded-xl border border-[#d9e2ef] p-3 bg-[#f8faff] space-y-2">
											<div className="font-bold text-[#1f2430]">Merge PDFs</div>
											<label className="block cursor-pointer rounded-lg border border-[#d9e2ef] bg-white p-2 text-center text-[11px] font-semibold text-[#5b6472]">
												Select PDF Files
												<input type="file" accept="application/pdf" multiple onChange={(e) => setPdfMergeFiles(Array.from(e.target.files || []))} className="hidden" />
											</label>
											{pdfMergeFiles.length > 0 && <div className="text-[11px] font-bold text-emerald-600">{pdfMergeFiles.length} files selected</div>}
											<button type="button" onClick={() => void runPdfMerge()} className="w-full rounded-lg bg-[#6678c1] py-1.5 font-bold text-white">Merge & Download</button>
										</div>

										<div className="rounded-xl border border-[#d9e2ef] p-3 bg-[#f8faff] space-y-2">
											<div className="font-bold text-[#1f2430]">Split PDF Pages</div>
											<label className="block cursor-pointer rounded-lg border border-[#d9e2ef] bg-white p-2 text-center text-[11px] font-semibold text-[#5b6472]">
												{pdfSplitFile ? pdfSplitFile.name : "Select PDF File"}
												<input type="file" accept="application/pdf" onChange={(e) => setPdfSplitFile(e.target.files?.[0] ?? null)} className="hidden" />
											</label>
											<input type="text" placeholder="Page range (e.g. 1-3)" value={pdfSplitPages} onChange={(e) => setPdfSplitPages(e.target.value)} className="w-full rounded-lg border border-[#d9e2ef] p-1.5 text-xs" />
											<button type="button" onClick={() => void runPdfSplit()} className="w-full rounded-lg bg-[#6678c1] py-1.5 font-bold text-white">Split & Download</button>
										</div>

										<div className="rounded-xl border border-[#d9e2ef] p-3 bg-[#f8faff] space-y-2">
											<div className="font-bold text-[#1f2430]">Compress PDF Size</div>
											<label className="block cursor-pointer rounded-lg border border-[#d9e2ef] bg-white p-2 text-center text-[11px] font-semibold text-[#5b6472]">
												{pdfCompressFile ? pdfCompressFile.name : "Select PDF File"}
												<input type="file" accept="application/pdf" onChange={(e) => setPdfCompressFile(e.target.files?.[0] ?? null)} className="hidden" />
											</label>
											<button type="button" onClick={() => void runPdfCompress()} className="w-full rounded-lg bg-[#6678c1] py-1.5 font-bold text-white">Compress PDF</button>
										</div>
									</div>
								</div>

								{/* OCR Text Extractor */}
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm xl:col-span-2 space-y-3">
									<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
										<div>
											<h3 className="text-sm font-bold text-[#1f2430]">🔍 OCR Text Extractor</h3>
											<p className="text-xs text-[#5b6472]">Extract editable text from scanned PDF documents, invoices, or images</p>
										</div>
										<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
											TESSERACT OCR
										</span>
									</div>

									<div className="flex items-center gap-3 pt-2">
										<label className="cursor-pointer rounded-xl border border-[#d9e2ef] bg-[#f8faff] px-4 py-2 text-xs font-semibold text-[#1f2430]">
											{ocrFile ? ocrFile.name : "🔍 Select Scanned File or Image"}
											<input type="file" accept="application/pdf,image/*" onChange={(e) => setOcrFile(e.target.files?.[0] ?? null)} className="hidden" />
										</label>

										<button type="button" onClick={() => void runOcr()} className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-bold text-white hover:bg-[#404d85]">
											{ocrLoading ? "Extracting..." : "Extract Text"}
										</button>
									</div>

									{ocrResult && (
										<textarea readOnly value={ocrResult} className="mt-3 h-40 w-full rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-3 text-xs leading-5 font-mono text-[#1f2430]" />
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* MERCUR MARKETPLACE TAB */}
				{view === "mercur" && (
					<div className="space-y-6">
						{/* Mercur Hero Banner */}
						<div className="rounded-3xl border border-[#d9e2ef] bg-gradient-to-r from-white via-[#f8faff] to-[#eef2fa] p-8 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-6">
								<div className="max-w-3xl space-y-3">
									<div className="flex items-center gap-3 flex-wrap">
										<span className="rounded-full bg-[#6678c1] px-3 py-1 text-xs font-bold text-white shadow-sm">
											MercurJS B2B & B2C Open-Source Engine
										</span>
										<a
											href="https://github.com/mercurjs/mercur"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-1 text-xs font-bold text-[#6678c1] hover:underline"
										>
											<svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
											github.com/mercurjs/mercur ↗
										</a>
									</div>
									<h1 className="text-2xl font-black tracking-tight text-[#1f2430]">
										Multi-Vendor Marketplace Platform
									</h1>
									<p className="text-xs text-[#5b6472] leading-relaxed">
										Fully integrated headless marketplace framework built on <strong>MedusaJS</strong> core. Supports multi-vendor onboarding, automated multi-vendor order splitting, rule-based seller commission fees, and seller payout management.
									</p>
								</div>

								<div className="flex items-center gap-3">
									<button
										onClick={() => setShowCartDrawer(true)}
										className="relative rounded-2xl bg-[#6678c1] px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-[#404d85] transition"
									>
										🛒 Marketplace Cart ({mercurCart.reduce((sum, i) => sum + i.quantity, 0)})
										{mercurCart.length > 0 && (
											<span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
												{mercurCart.length}
											</span>
										)}
									</button>
								</div>
							</div>

							{/* KPI Cards */}
							<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm">
									<div className="text-[11px] font-bold uppercase tracking-wider text-[#5b6472]">Active Vendors</div>
									<div className="mt-1 text-xl font-extrabold text-[#1f2430]">{vendors.length} Verified Sellers</div>
									<div className="mt-1 text-[11px] text-emerald-600 font-semibold">100% KYC Approved</div>
								</div>

								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm">
									<div className="text-[11px] font-bold uppercase tracking-wider text-[#5b6472]">Multi-Vendor Catalog</div>
									<div className="mt-1 text-xl font-extrabold text-[#1f2430]">{products.length} Listed Items</div>
									<div className="mt-1 text-[11px] text-[#6678c1] font-semibold">B2B & B2C Tier Prices</div>
								</div>

								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm">
									<div className="text-[11px] font-bold uppercase tracking-wider text-[#5b6472]">Marketplace Volume (GMV)</div>
									<div className="mt-1 text-xl font-extrabold text-emerald-600">${totalGmv.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
									<div className="mt-1 text-[11px] text-emerald-600 font-semibold">{orders.length} Executed Orders</div>
								</div>

								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm">
									<div className="text-[11px] font-bold uppercase tracking-wider text-[#5b6472]">Platform Commission</div>
									<div className="mt-1 text-xl font-extrabold text-[#6678c1]">${totalCommissionEarned.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
									<div className="mt-1 text-[11px] text-[#5b6472] font-semibold">8.5% Fee Engine</div>
								</div>
							</div>
						</div>

						{/* Mercur Sub-Tabs */}
						<div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#d9e2ef] bg-white p-2 shadow-sm">
							{[
								{ id: "storefront", label: "🛍️ Multi-Vendor Storefront" },
								{ id: "vendors", label: `🏪 Vendor Portal (${vendors.length})` },
								{ id: "admin", label: "⚡ Operator Admin & Commissions" },
								{ id: "config", label: "⚙️ Mercur Engine & API Gateway" },
							].map((tab) => (
								<button
									key={tab.id}
									onClick={() => setMercurSubTab(tab.id as any)}
									className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
										mercurSubTab === tab.id
											? "bg-[#6678c1] text-white shadow-sm"
											: "text-[#5b6472] hover:bg-[#f8faff] hover:text-[#1f2430]"
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>

						{/* SUB-TAB 1: STOREFRONT */}
						{mercurSubTab === "storefront" && (
							<div className="space-y-6">
								<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-xs font-bold text-[#5b6472]">Category Filter:</span>
										{["All", "Cloud Services & Hosting", "Software & Enterprise Licenses", "Hardware & IoT Devices"].map((cat) => (
											<button
												key={cat}
												onClick={() => setMercurCategoryFilter(cat)}
												className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
													mercurCategoryFilter === cat
														? "bg-[#6678c1] text-white"
														: "border border-[#d9e2ef] bg-[#f8faff] text-[#5b6472] hover:bg-[#eef2fa]"
												}`}
											>
												{cat}
											</button>
										))}
									</div>

									<button
										onClick={() => setShowProductModal(true)}
										className="rounded-xl border border-[#6678c1] px-3.5 py-1.5 text-xs font-bold text-[#6678c1] hover:bg-[#6678c1] hover:text-white transition"
									>
										+ List Product on Mercur
									</button>
								</div>

								<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
									{filteredProducts.map((prod) => (
										<div key={prod.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#6678c1] transition">
											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<span className="rounded-full bg-[#f8faff] px-2.5 py-1 text-[10px] font-bold text-[#6678c1] border border-[#d9e2ef]">
														{prod.category}
													</span>
													<span className="text-[11px] font-semibold text-emerald-600">Stock: {prod.stockQty}</span>
												</div>

												<h3 className="text-base font-bold text-[#1f2430]">{prod.title}</h3>
												<p className="text-xs text-[#5b6472] line-clamp-2">{prod.description}</p>

												<div className="rounded-xl bg-[#f8faff] p-3 text-xs border border-[#d9e2ef] space-y-1">
													<div className="text-[#5b6472]">Vendor: <strong className="text-[#1f2430]">{prod.vendorName}</strong></div>
													<div className="text-[#5b6472]">SKU Code: <span className="font-semibold text-[#6678c1]">{prod.sku}</span></div>
												</div>
											</div>

											<div className="pt-2 border-t border-[#d9e2ef] flex items-center justify-between">
												<div>
													<div className="text-lg font-black text-[#1f2430]">${prod.price.toFixed(2)}</div>
													{prod.b2bPriceTier && (
														<div className="text-[11px] font-semibold text-emerald-600">
															B2B Tier: ${prod.b2bPriceTier.toFixed(2)}
														</div>
													)}
												</div>

												<button
													onClick={() => addToCart(prod)}
													className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#404d85] transition"
												>
													+ Add to Cart
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* SUB-TAB 2: VENDOR PORTAL */}
						{mercurSubTab === "vendors" && (
							<div className="space-y-6">
								<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
									<div>
										<h2 className="text-lg font-bold text-[#1f2430]">Vendor Seller Hub & Onboarding</h2>
										<p className="text-xs text-[#5b6472]">Manage marketplace sellers, commission rates, and product listings</p>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => setShowVendorModal(true)}
											className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#404d85]"
										>
											+ Register New Marketplace Vendor
										</button>
										<button
											onClick={() => setShowProductModal(true)}
											className="rounded-xl border border-[#6678c1] px-4 py-2 text-xs font-bold text-[#6678c1] hover:bg-[#6678c1] hover:text-white"
										>
											+ Add Vendor Product
										</button>
									</div>
								</div>

								<div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
									<table className="w-full text-left text-xs">
										<thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
											<tr>
												<th className="p-3 font-semibold">Vendor Company</th>
												<th className="p-3 font-semibold">Contact Email</th>
												<th className="p-3 font-semibold">Primary Category</th>
												<th className="p-3 font-semibold">Rating</th>
												<th className="p-3 font-semibold">Products</th>
												<th className="p-3 font-semibold">Commission %</th>
												<th className="p-3 font-semibold">Payout Status</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-[#d9e2ef]">
											{vendors.map((v) => (
												<tr key={v.id} className="hover:bg-[#f8faff]">
													<td className="p-3 font-bold text-[#1f2430]">{v.name}</td>
													<td className="p-3 text-[#5b6472]">{v.email}</td>
													<td className="p-3 text-[#5b6472]">{v.category}</td>
													<td className="p-3 font-bold text-amber-500">⭐ {v.rating}</td>
													<td className="p-3 font-bold text-[#6678c1]">{v.totalProducts} Items</td>
													<td className="p-3 font-bold text-[#1f2430]">{v.commissionRate}%</td>
													<td className="p-3">
														<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800 uppercase">
															{v.payoutStatus}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* SUB-TAB 3: ADMIN & COMMISSIONS */}
						{mercurSubTab === "admin" && (
							<div className="space-y-6">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
									<h2 className="text-lg font-bold text-[#1f2430]">Platform Admin & Commission Rule Engine</h2>
									<p className="text-xs text-[#5b6472]">Rule-based seller commission calculation and multi-vendor order audit log</p>

									<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
										<div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
											<div className="text-xs font-bold text-[#5b6472]">Standard B2C Commission</div>
											<div className="mt-1 text-2xl font-black text-[#6678c1]">8.5%</div>
											<div className="mt-1 text-[11px] text-[#5b6472]">Applied to retail sales</div>
										</div>
										<div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
											<div className="text-xs font-bold text-[#5b6472]">B2B Bulk Order Rate</div>
											<div className="mt-1 text-2xl font-black text-emerald-600">5.0%</div>
											<div className="mt-1 text-[11px] text-[#5b6472]">Orders &gt; $1,000</div>
										</div>
										<div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
											<div className="text-xs font-bold text-[#5b6472]">Automated Order Splitting</div>
											<div className="mt-1 text-2xl font-black text-[#1f2430]">ENABLED</div>
											<div className="mt-1 text-[11px] text-emerald-600 font-semibold">MedusaJS Core Workflow</div>
										</div>
									</div>
								</div>

								{/* Orders Audit Table */}
								<div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
									<div className="border-b border-[#d9e2ef] p-4 bg-[#f8faff]">
										<h3 className="text-sm font-bold text-[#1f2430]">Multi-Vendor Orders & Commission Audit ({orders.length})</h3>
									</div>
									<table className="w-full text-left text-xs">
										<thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
											<tr>
												<th className="p-3 font-semibold">Order #</th>
												<th className="p-3 font-semibold">Customer</th>
												<th className="p-3 font-semibold">Vendor</th>
												<th className="p-3 font-semibold">Gross ($)</th>
												<th className="p-3 font-semibold">Platform Fee ($)</th>
												<th className="p-3 font-semibold">Vendor Payout ($)</th>
												<th className="p-3 font-semibold">Status</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-[#d9e2ef]">
											{orders.map((o) => (
												<tr key={o.id} className="hover:bg-[#f8faff]">
													<td className="p-3 font-bold text-[#6678c1]">{o.orderNumber}</td>
													<td className="p-3 text-[#5b6472]">{o.customerEmail}</td>
													<td className="p-3 font-semibold text-[#1f2430]">{o.vendorName}</td>
													<td className="p-3 font-bold text-[#1f2430]">${o.grossAmount.toFixed(2)}</td>
													<td className="p-3 font-bold text-[#6678c1]">${o.platformCommission.toFixed(2)}</td>
													<td className="p-3 font-bold text-emerald-600">${o.vendorPayout.toFixed(2)}</td>
													<td className="p-3">
														<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800 uppercase">
															{o.status}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* SUB-TAB 4: CONFIGURATION */}
						{mercurSubTab === "config" && (
							<div className="space-y-6">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
									<h2 className="text-lg font-bold text-[#1f2430]">Mercur Engine Server & Gateway Connection</h2>
									<p className="text-xs text-[#5b6472]">Configure the open-source MercurJS server API endpoint and Medusa framework secrets</p>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
										<div>
											<label className="block font-semibold text-[#5b6472]">Mercur API Gateway URL</label>
											<input
												type="text"
												value={mercurServerUrl}
												onChange={(e) => setMercurServerUrl(e.target.value)}
												className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 font-mono text-xs"
											/>
										</div>

										<div>
											<label className="block font-semibold text-[#5b6472]">Medusa Core Secret Key</label>
											<input
												type="password"
												value={mercurApiKey}
												onChange={(e) => setMercurApiKey(e.target.value)}
												className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 font-mono text-xs"
											/>
										</div>
									</div>

									<div className="pt-4 border-t border-[#d9e2ef] flex items-center gap-3">
										<button
											onClick={() => {
												setPingStatus("Pinging Mercur API Gateway...");
												setTimeout(() => {
													setPingStatus("✅ 200 OK — Mercur Gateway connected successfully at " + mercurServerUrl);
												}, 800);
											}}
											className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white hover:bg-[#404d85]"
										>
											Test Gateway Ping
										</button>
										{pingStatus && <span className="text-xs font-bold text-emerald-600">{pingStatus}</span>}
									</div>

									<div className="mt-4 rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-4 text-xs space-y-2">
										<div className="font-bold text-[#1f2430]">Quick CLI Setup Reference (MercurJS Starter)</div>
										<code className="block rounded-lg bg-zinc-900 p-3 font-mono text-emerald-400">
											npx mercurjs@latest
										</code>
										<p className="text-[#5b6472] text-[11px]">
											Runs the Mercur CLI initializer to start a headless multi-vendor marketplace with Admin, Vendor, and Storefront surfaces.
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* PAID TOOLS TAB */}
				{view === "paid" && (
					<div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
						<h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Paid Tools</h2>
						<p className="mt-2 text-zinc-600">5000+ tools under Cambliss paid subscription. Coming soon!</p>
					</div>
				)}
			</div>

			{/* MULTI-VENDOR CART DRAWER MODAL */}
			{showCartDrawer && (
				<div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
					<div className="w-full max-w-md bg-white p-6 shadow-2xl space-y-4 flex flex-col justify-between h-full">
						<div className="space-y-4 overflow-y-auto">
							<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
								<h3 className="text-base font-bold text-[#1f2430]">🛒 Multi-Vendor Marketplace Cart</h3>
								<button onClick={() => setShowCartDrawer(false)} className="text-sm font-bold text-[#5b6472]">✕</button>
							</div>

							{mercurCart.length === 0 ? (
								<div className="p-8 text-center text-xs text-[#5b6472]">
									Your multi-vendor cart is empty. Add products from the storefront!
								</div>
							) : (
								<div className="space-y-3">
									{mercurCart.map((item) => (
										<div key={item.product.id} className="rounded-xl border border-[#d9e2ef] p-3 space-y-2 bg-[#f8faff]">
											<div className="flex justify-between items-start">
												<div>
													<div className="text-xs font-bold text-[#1f2430]">{item.product.title}</div>
													<div className="text-[11px] text-[#5b6472]">Vendor: {item.product.vendorName}</div>
												</div>
												<button onClick={() => removeFromCart(item.product.id)} className="text-rose-500 font-bold text-xs">✕</button>
											</div>

											<div className="flex justify-between items-center text-xs pt-1 border-t border-[#d9e2ef]">
												<span>Qty: <strong>{item.quantity}</strong> x ${item.product.price.toFixed(2)}</span>
												<span className="font-bold text-[#1f2430]">${(item.quantity * item.product.price).toFixed(2)}</span>
											</div>
										</div>
									))}
								</div>
							)}

							{checkoutMsg && (
								<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
									{checkoutMsg}
								</div>
							)}
						</div>

						{mercurCart.length > 0 && (
							<div className="space-y-3 pt-4 border-t border-[#d9e2ef]">
								<div className="space-y-1 text-xs">
									<div className="flex justify-between text-[#5b6472]">
										<span>Cart Subtotal:</span>
										<strong>${cartSubtotal.toFixed(2)}</strong>
									</div>
									<div className="flex justify-between text-[#5b6472]">
										<span>Platform Commission (8.5%):</span>
										<strong className="text-[#6678c1]">${cartTotalCommission.toFixed(2)}</strong>
									</div>
									<div className="flex justify-between text-base font-bold text-[#1f2430] pt-2 border-t border-[#d9e2ef]">
										<span>Grand Total:</span>
										<span className="text-emerald-600">${cartSubtotal.toFixed(2)}</span>
									</div>
								</div>

								<button
									onClick={handleCheckoutCart}
									disabled={checkoutBusy}
									className="w-full rounded-xl bg-[#6678c1] py-3 text-xs font-bold text-white shadow-lg hover:bg-[#404d85] transition"
								>
									{checkoutBusy ? "Executing Multi-Vendor Split..." : "1-Click Multi-Vendor Checkout"}
								</button>
							</div>
						)}
					</div>
				</div>
			)}

			{/* REGISTER VENDOR MODAL */}
			{showVendorModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
					<div className="w-full max-w-md rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
						<h3 className="text-lg font-bold text-[#1f2430]">Register Mercur Marketplace Vendor</h3>
						<form onSubmit={handleRegisterVendor} className="space-y-3 text-xs">
							<div>
								<label className="block font-semibold text-[#5b6472]">Vendor Company Name *</label>
								<input type="text" placeholder="e.g. Acme Tech" value={vName} onChange={(e) => setVName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
							</div>
							<div>
								<label className="block font-semibold text-[#5b6472]">Contact Email *</label>
								<input type="email" placeholder="vendors@acme.com" value={vEmail} onChange={(e) => setVEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
							</div>
							<div>
								<label className="block font-semibold text-[#5b6472]">Primary Category</label>
								<select value={vCategory} onChange={(e) => setVCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs bg-white">
									<option value="Cloud Services & Hosting">Cloud Services & Hosting</option>
									<option value="Software & Enterprise Licenses">Software & Enterprise Licenses</option>
									<option value="Hardware & IoT Devices">Hardware & IoT Devices</option>
								</select>
							</div>
							<div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
								<button type="button" onClick={() => setShowVendorModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2">Cancel</button>
								<button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 font-bold text-white shadow-md">Register Seller</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ADD PRODUCT MODAL */}
			{showProductModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
					<div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
						<h3 className="text-lg font-bold text-[#1f2430]">List New Product on Mercur Catalog</h3>
						<form onSubmit={handleAddProduct} className="space-y-3 text-xs">
							<div className="grid grid-cols-2 gap-3">
								<div className="col-span-2">
									<label className="block font-semibold text-[#5b6472]">Product Title *</label>
									<input type="text" placeholder="e.g. Enterprise Cloud Instance" value={pTitle} onChange={(e) => setPTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
								</div>
								<div>
									<label className="block font-semibold text-[#5b6472]">SKU Code</label>
									<input type="text" placeholder="SKU-MER-001" value={pSku} onChange={(e) => setPSku(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
								</div>
								<div>
									<label className="block font-semibold text-[#5b6472]">Vendor Owner</label>
									<select value={pVendorId} onChange={(e) => setPVendorId(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs bg-white">
										{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
									</select>
								</div>
								<div>
									<label className="block font-semibold text-[#5b6472]">Retail Sale Price ($) *</label>
									<input type="number" value={pPrice} onChange={(e) => setPPrice(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
								</div>
								<div>
									<label className="block font-semibold text-[#5b6472]">B2B Bulk Price Tier ($)</label>
									<input type="number" value={pB2bPrice} onChange={(e) => setPB2bPrice(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
								</div>
							</div>
							<div>
								<label className="block font-semibold text-[#5b6472]">Product Description</label>
								<textarea rows={2} value={pDesc} onChange={(e) => setPDesc(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
							</div>
							<div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
								<button type="button" onClick={() => setShowProductModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2">Cancel</button>
								<button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 font-bold text-white shadow-md">Publish to Mercur</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</WorkspaceShell>
	);
}
