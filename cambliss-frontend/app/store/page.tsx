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

// Full MedusaJSJS Marketplace Data Types
type MedusaVendor = {
	id: string;
	name: string;
	ownerEmail: string;
	category: string;
	rating: number;
	reviewsCount: number;
	totalProducts: number;
	totalSalesVolume: number;
	commissionRate: number;
	stripeConnectId: string;
	payoutStatus: "Connected (Active)" | "Pending Onboarding" | "Restricted";
	kycVerified: boolean;
	joinedDate: string;
};

type MedusaProductReview = {
	id: string;
	author: string;
	rating: number;
	comment: string;
	date: string;
};

type MedusaProduct = {
	id: string;
	sku: string;
	title: string;
	vendorId: string;
	vendorName: string;
	category: string;
	price: number;
	wholesaleB2bPrice?: number;
	sellerDiscountOffer?: string;
	stockQty: number;
	commissionRate: number;
	description: string;
	rating: number;
	reviews: MedusaProductReview[];
};

type MedusaOrder = {
	id: string;
	orderNumber: string;
	customerName: string;
	customerEmail: string;
	vendorId: string;
	vendorName: string;
	grossAmount: number;
	platformCommission: number;
	vendorPayout: number;
	itemsCount: number;
	paymentMethod: "Stripe Connect" | "Credit Card" | "Wire Transfer";
	fulfillmentStatus: "Delivered" | "In Transit" | "Processing" | "Pending Shipment";
	trackingNumber?: string;
	promoDiscount: number;
	status: "completed" | "processing" | "refunded";
	createdAt: string;
};

type MedusaJSPayoutRequest = {
	id: string;
	vendorId: string;
	vendorName: string;
	amount: number;
	stripePayoutId: string;
	status: "Paid (Stripe Transfer)" | "Processing" | "Pending Review";
	requestedDate: string;
};

type MedusaCartItem = {
	product: MedusaProduct;
	quantity: number;
};

export default function StorePage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading MedusaJS Marketplace Suite...</div>}>
			<StoreContent />
		</Suspense>
	);
}

function StoreContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const view = searchParams.get("view") || "medusa"; // Default to MedusaJS Marketplace Suite
	
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

	// MedusaJS Marketplace Suite Sub-Tabs
	const [medusaSubTab, setMedusaJSSubTab] = useState<
		"storefront" | "cart" | "vendors" | "onboarding" | "orders" | "payouts" | "promotions" | "analytics" | "admin" | "architecture"
	>("storefront");

	const [medusaCategoryFilter, setMedusaJSCategoryFilter] = useState("All");
	const [medusaCart, setMedusaJSCart] = useState<MedusaCartItem[]>([]);
	const [promoCodeInput, setPromoCodeInput] = useState("");
	const [appliedDiscountPercent, setAppliedDiscountPercent] = useState<number>(0);
	const [promoMessage, setPromoMessage] = useState<string | null>(null);
	const [showCartDrawer, setShowCartDrawer] = useState(false);
	const [checkoutBusy, setCheckoutBusy] = useState(false);
	const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);

	// MedusaJS Vendor Form Modal
	const [showVendorModal, setShowVendorModal] = useState(false);
	const [vName, setVName] = useState("");
	const [vEmail, setVEmail] = useState("");
	const [vCategory, setVCategory] = useState("Cloud Infrastructure & Hosting");
	const [vCommission, setVCommission] = useState<number>(8.5);

	// MedusaJS Product Form Modal
	const [showProductModal, setShowProductModal] = useState(false);
	const [pTitle, setPTitle] = useState("");
	const [pSku, setPSku] = useState("");
	const [pVendorId, setPVendorId] = useState("");
	const [pCategory, setPCategory] = useState("Software & Enterprise Licenses");
	const [pPrice, setPPrice] = useState<number>(499);
	const [pWholesaleB2b, setPWholesaleB2b] = useState<number>(399);
	const [pOffer, setPOffer] = useState("10% B2B Wholesale Bulk Offer");
	const [pStock, setPStock] = useState<number>(100);
	const [pDesc, setPDesc] = useState("");

	// MedusaJS Config
	const [medusaServerUrl, setMedusaJSServerUrl] = useState("http://localhost:9000");
	const [medusaApiKey, setMedusaJSApiKey] = useState("medusa_medusa_secret_key_prod");
	const [pingStatus, setPingStatus] = useState<string | null>(null);

	// Multi-Vendor Dataset State
	const [vendors, setVendors] = useState<MedusaVendor[]>([
		{
			id: "v-medusa-101",
			name: "Acme Cloud Infrastructure Solutions",
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
			joinedDate: "2026-01-10",
		},
		{
			id: "v-medusa-102",
			name: "CyberShield Security Systems",
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
			joinedDate: "2026-02-01",
		},
		{
			id: "v-medusa-103",
			name: "NextGen IoT Hardware Corp",
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
			joinedDate: "2026-03-15",
		},
	]);

	const [products, setProducts] = useState<MedusaProduct[]>([
		{
			id: "prod-m-1",
			sku: "SKU-MER-CLOUD-01",
			title: "Dedicated Kubernetes High-Availability Cluster",
			vendorId: "v-medusa-101",
			vendorName: "Acme Cloud Infrastructure Solutions",
			category: "Cloud Infrastructure & Hosting",
			price: 1499.00,
			wholesaleB2bPrice: 1299.00,
			sellerDiscountOffer: "Save $200 on B2B Annual Contract",
			stockQty: 50,
			commissionRate: 8.5,
			description: "Fully managed, multi-region Kubernetes control plane with 99.99% uptime SLA.",
			rating: 4.9,
			reviews: [
				{ id: "rev-1", author: "Enterprise Architect", rating: 5, comment: "Seamless multi-region deployment and zero downtime.", date: "2026-08-20" }
			]
		},
		{
			id: "prod-m-2",
			sku: "SKU-MER-SEC-02",
			title: "Zero-Trust Enterprise IAM & SSO Platform License",
			vendorId: "v-medusa-102",
			vendorName: "CyberShield Security Systems",
			category: "Software & Enterprise Licenses",
			price: 899.00,
			wholesaleB2bPrice: 750.00,
			sellerDiscountOffer: "15% Off for 50+ Seat Licenses",
			stockQty: 200,
			commissionRate: 8.5,
			description: "Unlimited OAuth2, SAML2, and FIDO2 multi-factor authentication security suite.",
			rating: 4.8,
			reviews: [
				{ id: "rev-2", author: "CISO Office", rating: 5, comment: "Easy SAML integration and SOC2 compliance export.", date: "2026-08-18" }
			]
		},
		{
			id: "prod-m-3",
			sku: "SKU-MER-HW-03",
			title: "Industrial IoT Edge Controller Gateway Device",
			vendorId: "v-medusa-103",
			vendorName: "NextGen IoT Hardware Corp",
			category: "Hardware & IoT Devices",
			price: 450.00,
			wholesaleB2bPrice: 380.00,
			sellerDiscountOffer: "Wholesale Tier: $380 for 10+ Units",
			stockQty: 120,
			commissionRate: 5.0,
			description: "Ruggedized ARM Cortex industrial IoT gateway with Modbus & MQTT protocols.",
			rating: 4.7,
			reviews: [
				{ id: "rev-3", author: "Factory Plant Lead", rating: 4, comment: "Extremely reliable hardware with RS485 ports.", date: "2026-08-22" }
			]
		},
	]);

	const [orders, setOrders] = useState<MedusaOrder[]>([
		{
			id: "ord-mer-901",
			orderNumber: "ORD-MEDUSA-2026-001",
			customerName: "Acme Enterprises Inc",
			customerEmail: "enterprise@acme.com",
			vendorId: "v-medusa-101",
			vendorName: "Acme Cloud Infrastructure Solutions",
			grossAmount: 1499.00,
			platformCommission: 127.42,
			vendorPayout: 1371.58,
			itemsCount: 1,
			paymentMethod: "Stripe Connect",
			fulfillmentStatus: "Delivered",
			trackingNumber: "TRK-FEDEX-99120",
			promoDiscount: 0,
			status: "completed",
			createdAt: "2026-08-25 14:32",
		},
		{
			id: "ord-mer-902",
			orderNumber: "ORD-MEDUSA-2026-002",
			customerName: "Global Tech Corp",
			customerEmail: "cto@globaltech.org",
			vendorId: "v-medusa-102",
			vendorName: "CyberShield Security Systems",
			grossAmount: 899.00,
			platformCommission: 76.42,
			vendorPayout: 822.58,
			itemsCount: 1,
			paymentMethod: "Credit Card",
			fulfillmentStatus: "In Transit",
			trackingNumber: "TRK-DHL-44812",
			promoDiscount: 0,
			status: "completed",
			createdAt: "2026-08-26 09:15",
		},
	]);

	const [payouts, setPayouts] = useState<MedusaJSPayoutRequest[]>([
		{ id: "pay-1", vendorId: "v-medusa-101", vendorName: "Acme Cloud Infrastructure Solutions", amount: 1371.58, stripePayoutId: "po_1N8901X0912", status: "Paid (Stripe Transfer)", requestedDate: "2026-08-25" },
		{ id: "pay-2", vendorId: "v-medusa-102", vendorName: "CyberShield Security Systems", amount: 822.58, stripePayoutId: "po_1N8902X0915", status: "Processing", requestedDate: "2026-08-26" },
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

	// Cart & Promo Code Operations
	const addToCart = (product: MedusaProduct) => {
		setMedusaJSCart((prev) => {
			const existing = prev.find((item) => item.product.id === product.id);
			if (existing) {
				return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
			}
			return [...prev, { product, quantity: 1 }];
		});
		setShowCartDrawer(true);
	};

	const removeFromCart = (productId: string) => {
		setMedusaJSCart((prev) => prev.filter((item) => item.product.id !== productId));
	};

	const handleApplyPromoCode = () => {
		const code = promoCodeInput.trim().toUpperCase();
		if (code === "MEDUSA10" || code === "OPENSOURCE") {
			setAppliedDiscountPercent(10);
			setPromoMessage("🎉 Promo Code Applied: 10% Off Entire Multi-Vendor Order!");
		} else if (code === "B2B50") {
			setAppliedDiscountPercent(15);
			setPromoMessage("🎉 B2B Enterprise Code Applied: 15% Wholesale Discount!");
		} else {
			setPromoMessage("❌ Invalid Promo Code. Try 'MEDUSA10' or 'B2B50'.");
		}
	};

	const handleCheckoutCart = async () => {
		if (medusaCart.length === 0) return;
		setCheckoutBusy(true);
		setCheckoutMsg(null);

		try {
			const newOrders: MedusaOrder[] = medusaCart.map((item, idx) => {
				const gross = item.product.price * item.quantity;
				const discount = (gross * appliedDiscountPercent) / 100;
				const finalGross = Math.max(0, gross - discount);
				const comm = finalGross * (item.product.commissionRate / 100);
				return {
					id: `ord-mer-${Date.now()}-${idx}`,
					orderNumber: `ORD-MEDUSA-2026-00${orders.length + idx + 1}`,
					customerName: "Enterprise Purchaser",
					customerEmail: "purchaser@theofficeconnect.com",
					vendorId: item.product.vendorId,
					vendorName: item.product.vendorName,
					grossAmount: finalGross,
					platformCommission: comm,
					vendorPayout: finalGross - comm,
					itemsCount: item.quantity,
					paymentMethod: "Stripe Connect",
					fulfillmentStatus: "Processing",
					trackingNumber: `TRK-SPLIT-${Math.floor(Math.random() * 89999 + 10000)}`,
					promoDiscount: discount,
					status: "completed",
					createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
				};
			});

			setOrders((prev) => [...newOrders, ...prev]);
			setMedusaJSCart([]);
			setAppliedDiscountPercent(0);
			setPromoCodeInput("");
			setCheckoutMsg(`✅ Multi-Vendor Order Split Executed! Created ${newOrders.length} sub-orders with automated seller Stripe Connect payout calculations.`);
		} catch (err) {
			setCheckoutMsg("Checkout failed.");
		} finally {
			setCheckoutBusy(false);
		}
	};

	const handleRegisterVendor = (e: React.FormEvent) => {
		e.preventDefault();
		if (!vName || !vEmail) return;

		const newV: MedusaVendor = {
			id: `v-medusa-${Date.now()}`,
			name: vName,
			ownerEmail: vEmail,
			category: vCategory,
			rating: 5.0,
			reviewsCount: 0,
			totalProducts: 0,
			totalSalesVolume: 0.00,
			commissionRate: vCommission,
			stripeConnectId: `acct_${Date.now().toString().slice(-10)}`,
			payoutStatus: "Connected (Active)",
			kycVerified: true,
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

		const newP: MedusaProduct = {
			id: `prod-m-${Date.now()}`,
			sku: pSku || `SKU-MER-${Date.now().toString().slice(-4)}`,
			title: pTitle,
			vendorId: vendor.id,
			vendorName: vendor.name,
			category: pCategory,
			price: pPrice,
			wholesaleB2bPrice: pWholesaleB2b,
			sellerDiscountOffer: pOffer || "Special Wholesale Tier",
			stockQty: pStock,
			commissionRate: vendor.commissionRate,
			description: pDesc || "MedusaJSJS multi-vendor catalog item.",
			rating: 5.0,
			reviews: [],
		};

		setProducts((prev) => [newP, ...prev]);
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
		if (medusaCategoryFilter === "All") return true;
		return p.category === medusaCategoryFilter;
	});

	const rawCartSubtotal = medusaCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
	const cartDiscountAmount = (rawCartSubtotal * appliedDiscountPercent) / 100;
	const cartSubtotal = Math.max(0, rawCartSubtotal - cartDiscountAmount);
	const cartTotalCommission = medusaCart.reduce((sum, item) => sum + (((item.product.price * item.quantity) - ((item.product.price * item.quantity * appliedDiscountPercent) / 100)) * (item.product.commissionRate / 100)), 0);

	const totalGmv = orders.reduce((sum, o) => sum + o.grossAmount, 0);
	const totalCommissionEarned = orders.reduce((sum, o) => sum + o.platformCommission, 0);
	const totalSellerPayouts = orders.reduce((sum, o) => sum + o.vendorPayout, 0);

	// Free Tools Suite Cards list with redirect routes
	const freeToolSuiteCards = [
		{
			id: "accounting",
			title: "Accounting & Finance Suite",
			tagline: "Free Open-Source Accountech ERP",
			description: "Complete corporate accounting, sales invoices, recurring billing, vendor bills, customer balances, and ledger.",
			icon: "💰",
			badge: "INTEGRATED",
			badgeColor: "bg-emerald-100 text-emerald-800",
			route: "/akaunting",
			cta: "Open Accountech ERP →",
		},
		{
			id: "marketplace",
			title: "MedusaJSJS Open Source Marketplace",
			tagline: "Multi-Vendor B2B & B2C Engine",
			description: "Headless multi-vendor marketplace framework powered by MedusaJS, vendor onboarding, order splitting, and seller payouts.",
			icon: "🛍️",
			badge: "FULL SUITE",
			badgeColor: "bg-purple-100 text-purple-800",
			route: "/store?view=medusa",
			cta: "Launch MedusaJS Marketplace →",
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
						onClick={() => router.push("/store?view=medusa")}
						className={`rounded-2xl border p-5 text-left transition-all relative overflow-hidden ${
							view === "medusa"
								? "bg-[#6678c1] border-[#6678c1] text-white shadow-xl shadow-[#6678c1]/20 ring-2 ring-[#6678c1]"
								: "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm"
						}`}
					>
						<div className="flex items-center justify-between">
							<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
								view === "medusa" ? "bg-white/20 text-white" : "bg-[#6678c1]/10 text-[#6678c1]"
							}`}>
								🔥 MEDUSAJS COMPREHENSIVE SUITE
							</span>
							<span className="text-xs font-bold">20+ Features</span>
						</div>
						<h2 className="mt-3 text-lg font-extrabold">MedusaJS Marketplace</h2>
						<p className={`mt-1 text-xs ${view === "medusa" ? "text-white/80" : "text-zinc-500"}`}>
							Multi-vendor sellers, Stripe payouts, order splitting, B2B offers & MedusaJS
						</p>
					</button>

					<button
						onClick={() => router.push("/store?view=free")}
						className={`rounded-2xl border p-5 text-left transition-all ${
							view === "free"
								? "bg-[#404d85] border-[#404d85] text-white shadow-xl shadow-[#404d85]/20"
								: "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm"
						}`}
					>
						<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
							FREE UTILITIES & REDIRECTS
						</span>
						<h2 className="mt-3 text-lg font-bold">Free Tools Workbench</h2>
						<p className={`mt-1 text-xs ${view === "free" ? "text-white/80" : "text-zinc-500"}`}>
							Accounting, CRM, HRM, Inventory, OCR, PDF & Image Converter Cards
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

				{/* MEDUSA MARKETPLACE COMPREHENSIVE SUITE */}
				{view === "medusa" && (
					<div className="space-y-6">
						{/* MedusaJS Hero Banner */}
						<div className="rounded-3xl border border-[#d9e2ef] bg-gradient-to-r from-white via-[#f8faff] to-[#eef2fa] p-8 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-6">
								<div className="max-w-3xl space-y-3">
									<div className="flex items-center gap-3 flex-wrap">
										<span className="rounded-full bg-[#6678c1] px-3 py-1 text-xs font-bold text-white shadow-sm">
											MedusaJSJS B2B & B2C Open-Source Platform
										</span>
										<a
											href="https://github.com/medusajs/medusa"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-1 text-xs font-bold text-[#6678c1] hover:underline"
										>
											<svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
											github.com/medusajs/medusa ↗
										</a>
									</div>
									<h1 className="text-2xl font-black tracking-tight text-[#1f2430]">
										MedusaJSJS Multi-Vendor Marketplace Platform
									</h1>
									<p className="text-xs text-[#5b6472] leading-relaxed">
										Complete headless marketplace engine built on <strong>Medusa Commerce Core</strong> + <strong>PostgreSQL</strong> + <strong>Redis</strong>. Fully equipped with Seller Onboarding, Multi-Vendor Checkout, Order Splitting, Stripe Connect Payouts, Seller B2B Pricing Offers, Shipping Fulfillment Tracking, Promotions, and Seller Analytics.
									</p>
								</div>

								<div className="flex items-center gap-3">
									<button
										onClick={() => setShowCartDrawer(true)}
										className="relative rounded-2xl bg-[#6678c1] px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-[#404d85] transition"
									>
										🛒 Multi-Vendor Cart ({medusaCart.reduce((sum, i) => sum + i.quantity, 0)})
										{medusaCart.length > 0 && (
											<span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
												{medusaCart.length}
											</span>
										)}
									</button>
								</div>
							</div>

							{/* 20-Feature KPI Overview Bar */}
							<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
								<div className="rounded-xl border border-[#d9e2ef] bg-white p-3 shadow-sm">
									<div className="text-[10px] font-bold uppercase text-[#5b6472]">🏪 Vendors</div>
									<div className="text-base font-extrabold text-[#1f2430]">{vendors.length} Verified</div>
								</div>
								<div className="rounded-xl border border-[#d9e2ef] bg-white p-3 shadow-sm">
									<div className="text-[10px] font-bold uppercase text-[#5b6472]">📦 Products</div>
									<div className="text-base font-extrabold text-[#1f2430]">{products.length} Listed</div>
								</div>
								<div className="rounded-xl border border-[#d9e2ef] bg-white p-3 shadow-sm">
									<div className="text-[10px] font-bold uppercase text-[#5b6472]">💰 GMV Volume</div>
									<div className="text-base font-extrabold text-emerald-600">${totalGmv.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
								</div>
								<div className="rounded-xl border border-[#d9e2ef] bg-white p-3 shadow-sm">
									<div className="text-[10px] font-bold uppercase text-[#5b6472]">💳 Platform Fee</div>
									<div className="text-base font-extrabold text-[#6678c1]">${totalCommissionEarned.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
								</div>
								<div className="rounded-xl border border-[#d9e2ef] bg-white p-3 shadow-sm">
									<div className="text-[10px] font-bold uppercase text-[#5b6472]">💸 Seller Payouts</div>
									<div className="text-base font-extrabold text-indigo-600">${totalSellerPayouts.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
								</div>
								<div className="rounded-xl border border-[#d9e2ef] bg-white p-3 shadow-sm">
									<div className="text-[10px] font-bold uppercase text-[#5b6472]">💳 Stripe Connect</div>
									<div className="text-base font-extrabold text-emerald-600">Active</div>
								</div>
							</div>
						</div>

						{/* MedusaJS 10-Module Comprehensive Sub-Tabs */}
						<div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#d9e2ef] bg-white p-2 shadow-sm">
							{[
								{ id: "storefront", label: "🛍️ Customer Storefront" },
								{ id: "cart", label: `🛒 Cart & Checkout (${medusaCart.length})` },
								{ id: "vendors", label: `🏪 Vendor Directory (${vendors.length})` },
								{ id: "onboarding", label: "👤 Seller Onboarding & KYC" },
								{ id: "orders", label: `📋 Orders & Splitting (${orders.length})` },
								{ id: "payouts", label: "💸 Seller Payouts / Stripe Connect" },
								{ id: "promotions", label: "🎟️ Promotions & Discounts" },
								{ id: "analytics", label: "📊 Seller Analytics" },
								{ id: "admin", label: "🧑💼 Admin Dashboard" },
								{ id: "architecture", label: "🔌 Medusa API & Tech Stack" },
							].map((tab) => (
								<button
									key={tab.id}
									onClick={() => setMedusaJSSubTab(tab.id as any)}
									className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
										medusaSubTab === tab.id
											? "bg-[#6678c1] text-white shadow-sm"
											: "text-[#5b6472] hover:bg-[#f8faff] hover:text-[#1f2430]"
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>

						{/* 1. STOREFRONT TAB */}
						{medusaSubTab === "storefront" && (
							<div className="space-y-6">
								<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-xs font-bold text-[#5b6472]">Filter Category:</span>
										{["All", "Cloud Infrastructure & Hosting", "Software & Enterprise Licenses", "Hardware & IoT Devices"].map((cat) => (
											<button
												key={cat}
												onClick={() => setMedusaJSCategoryFilter(cat)}
												className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
													medusaCategoryFilter === cat
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
										+ List Seller Product
									</button>
								</div>

								<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
									{filteredProducts.map((prod) => (
										<div key={prod.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#6678c1] transition">
											<div className="space-y-3">
												<div className="flex items-center justify-between">
													<span className="rounded-full bg-[#f8faff] px-2.5 py-1 text-[10px] font-bold text-[#6678c1] border border-[#d9e2ef]">
														{prod.category}
													</span>
													<span className="text-xs font-bold text-amber-500">⭐ {prod.rating}</span>
												</div>

												<h3 className="text-base font-bold text-[#1f2430]">{prod.title}</h3>
												<p className="text-xs text-[#5b6472] line-clamp-2">{prod.description}</p>

												{/* Seller Specific Offers & Wholesale Pricing */}
												{prod.sellerDiscountOffer && (
													<div className="rounded-xl bg-amber-50 p-2.5 text-xs border border-amber-200 font-bold text-amber-900 flex items-center gap-1.5">
														<span>🏷️ Seller Offer:</span> {prod.sellerDiscountOffer}
													</div>
												)}

												<div className="rounded-xl bg-[#f8faff] p-3 text-xs border border-[#d9e2ef] space-y-1">
													<div className="text-[#5b6472]">Vendor: <strong className="text-[#1f2430]">{prod.vendorName}</strong></div>
													<div className="text-[#5b6472]">SKU Code: <span className="font-semibold text-[#6678c1]">{prod.sku}</span></div>
													<div className="text-[#5b6472]">Stock Level: <strong className="text-emerald-600">{prod.stockQty} Available</strong></div>
												</div>
											</div>

											<div className="pt-2 border-t border-[#d9e2ef] flex items-center justify-between">
												<div>
													<div className="text-lg font-black text-[#1f2430]">${prod.price.toFixed(2)}</div>
													{prod.wholesaleB2bPrice && (
														<div className="text-[11px] font-semibold text-emerald-600">
															B2B Wholesale: ${prod.wholesaleB2bPrice.toFixed(2)}
														</div>
													)}
												</div>

												<button
													onClick={() => addToCart(prod)}
													className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#404d85] transition"
												>
													+ Add to Multi-Vendor Cart
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* 2. MULTI-VENDOR CART & CHECKOUT TAB */}
						{medusaSubTab === "cart" && (
							<div className="space-y-6">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
									<h2 className="text-lg font-bold text-[#1f2430]">🛒 Multi-Vendor Cart & Automated Order Splitting Checkout</h2>
									<p className="text-xs text-[#5b6472]">Items are grouped automatically by vendor seller. Checkout generates separate sub-orders with custom payouts.</p>

									{medusaCart.length === 0 ? (
										<div className="mt-8 p-12 text-center text-xs text-[#5b6472] bg-[#f8faff] rounded-2xl border border-[#d9e2ef]">
											Your multi-vendor shopping cart is empty. Browse the Customer Storefront tab to add products!
										</div>
									) : (
										<div className="mt-6 space-y-6">
											<div className="space-y-4">
												{medusaCart.map((item) => (
													<div key={item.product.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-4">
														<div>
															<div className="text-xs font-bold text-[#6678c1]">Vendor Seller: {item.product.vendorName}</div>
															<h4 className="text-sm font-bold text-[#1f2430] mt-0.5">{item.product.title}</h4>
															<div className="text-xs text-[#5b6472]">SKU: {item.product.sku} | Commission Rate: {item.product.commissionRate}%</div>
														</div>

														<div className="flex items-center gap-4 text-xs font-bold">
															<span>Qty: {item.quantity}</span>
															<span>${(item.quantity * item.product.price).toFixed(2)}</span>
															<button onClick={() => removeFromCart(item.product.id)} className="text-rose-500 hover:underline">Remove</button>
														</div>
													</div>
												))}
											</div>

											{/* Promotions Code Input */}
											<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 space-y-2">
												<label className="text-xs font-bold text-[#1f2430]">🎟️ Enter Promotion / Discount Coupon Code:</label>
												<div className="flex gap-2 max-w-md">
													<input
														type="text"
														placeholder="Try MEDUSA10 or B2B50"
														value={promoCodeInput}
														onChange={(e) => setPromoCodeInput(e.target.value)}
														className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs font-bold font-mono"
													/>
													<button onClick={handleApplyPromoCode} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white shadow-sm">
														Apply Code
													</button>
												</div>
												{promoMessage && <div className="text-xs font-bold text-emerald-700">{promoMessage}</div>}
											</div>

											{/* Cart Summary & Checkout */}
											<div className="rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-6 space-y-3 text-xs">
												<div className="flex justify-between text-[#5b6472]">
													<span>Raw Items Total:</span>
													<strong>${rawCartSubtotal.toFixed(2)}</strong>
												</div>
												{appliedDiscountPercent > 0 && (
													<div className="flex justify-between text-emerald-600 font-bold">
														<span>Promotional Discount ({appliedDiscountPercent}%):</span>
														<span>-${cartDiscountAmount.toFixed(2)}</span>
													</div>
												)}
												<div className="flex justify-between text-[#5b6472]">
													<span>Platform Commission (8.5% Avg):</span>
													<strong className="text-[#6678c1]">${cartTotalCommission.toFixed(2)}</strong>
												</div>
												<div className="flex justify-between text-base font-bold text-[#1f2430] border-t border-[#d9e2ef] pt-3">
													<span>Grand Total (Stripe Connect Charge):</span>
													<span className="text-emerald-600">${cartSubtotal.toFixed(2)}</span>
												</div>

												<button
													onClick={handleCheckoutCart}
													disabled={checkoutBusy}
													className="w-full rounded-xl bg-[#6678c1] py-3 text-xs font-bold text-white shadow-lg hover:bg-[#404d85] transition"
												>
													{checkoutBusy ? "Executing Multi-Vendor Split..." : "1-Click Multi-Vendor Checkout (Stripe Connect)"}
												</button>

												{checkoutMsg && <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 font-bold text-emerald-900">{checkoutMsg}</div>}
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						{/* 3. VENDOR DIRECTORY TAB */}
						{medusaSubTab === "vendors" && (
							<div className="space-y-6">
								<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
									<div>
										<h2 className="text-lg font-bold text-[#1f2430]">🏪 Multiple Vendors & Sellers Directory</h2>
										<p className="text-xs text-[#5b6472]">Active verified marketplace sellers, rating scores, commission tiers, and Stripe Connect status</p>
									</div>
									<button onClick={() => setShowVendorModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white shadow-sm">
										+ Register New Vendor
									</button>
								</div>

								<div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
									<table className="w-full text-left text-xs">
										<thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
											<tr>
												<th className="p-3 font-semibold">Vendor Company</th>
												<th className="p-3 font-semibold">Contact Email</th>
												<th className="p-3 font-semibold">Category</th>
												<th className="p-3 font-semibold">Rating ⭐</th>
												<th className="p-3 font-semibold">Total GMV Volume</th>
												<th className="p-3 font-semibold">Stripe Account</th>
												<th className="p-3 font-semibold">KYC Status</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-[#d9e2ef]">
											{vendors.map((v) => (
												<tr key={v.id} className="hover:bg-[#f8faff]">
													<td className="p-3 font-bold text-[#1f2430]">{v.name}</td>
													<td className="p-3 text-[#5b6472]">{v.ownerEmail}</td>
													<td className="p-3 text-[#5b6472]">{v.category}</td>
													<td className="p-3 font-bold text-amber-500">⭐ {v.rating} ({v.reviewsCount})</td>
													<td className="p-3 font-bold text-emerald-600">${v.totalSalesVolume.toLocaleString()}</td>
													<td className="p-3 font-mono text-[11px] text-[#6678c1]">{v.stripeConnectId}</td>
													<td className="p-3">
														<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800 uppercase">
															Verified
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* 4. ONBOARDING & KYC TAB */}
						{medusaSubTab === "onboarding" && (
							<div className="space-y-6">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
									<h2 className="text-lg font-bold text-[#1f2430]">👤 Seller / Vendor Onboarding & KYC Management</h2>
									<p className="text-xs text-[#5b6472]">Automated vendor registration workflow, identity verification, and tax document checks</p>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
										<div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
											<div className="text-xs font-bold text-[#5b6472]">1. Registration & Profile</div>
											<div className="mt-1 text-sm font-bold text-emerald-600">Automated Self-Service</div>
											<p className="text-[11px] text-[#5b6472] mt-1">Sellers submit legal entity details & tax ID.</p>
										</div>
										<div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
											<div className="text-xs font-bold text-[#5b6472]">2. Identity & KYC Verification</div>
											<div className="mt-1 text-sm font-bold text-emerald-600">Instant Check</div>
											<p className="text-[11px] text-[#5b6472] mt-1">Verify business registration & tax compliance.</p>
										</div>
										<div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
											<div className="text-xs font-bold text-[#5b6472]">3. Stripe Express Connect</div>
											<div className="mt-1 text-sm font-bold text-emerald-600">Auto-Linked</div>
											<p className="text-[11px] text-[#5b6472] mt-1">Direct bank payout routing configured.</p>
										</div>
									</div>

									<div className="pt-4 border-t border-[#d9e2ef]">
										<button onClick={() => setShowVendorModal(true)} className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-bold text-white shadow-md">
											+ Launch New Vendor Onboarding Form
										</button>
									</div>
								</div>
							</div>
						)}

						{/* 5. ORDERS & SPLITTING TAB */}
						{medusaSubTab === "orders" && (
							<div className="space-y-6">
								<div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
									<div>
										<h2 className="text-lg font-bold text-[#1f2430]">📋 Multi-Vendor Orders & Shipping Fulfillment</h2>
										<p className="text-xs text-[#5b6472]">Automated order splitting across vendors, line item tracking numbers, and fulfillment status</p>
									</div>
								</div>

								<div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
									<table className="w-full text-left text-xs">
										<thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
											<tr>
												<th className="p-3 font-semibold">Sub-Order #</th>
												<th className="p-3 font-semibold">Customer</th>
												<th className="p-3 font-semibold">Vendor Seller</th>
												<th className="p-3 font-semibold">Gross ($)</th>
												<th className="p-3 font-semibold">Platform Fee ($)</th>
												<th className="p-3 font-semibold">Vendor Payout ($)</th>
												<th className="p-3 font-semibold">Fulfillment 🚚</th>
												<th className="p-3 font-semibold">Tracking #</th>
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
														<span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
															{o.fulfillmentStatus}
														</span>
													</td>
													<td className="p-3 font-mono text-[11px] text-[#5b6472]">{o.trackingNumber || "N/A"}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* 6. PAYOUTS & STRIPE CONNECT TAB */}
						{medusaSubTab === "payouts" && (
							<div className="space-y-6">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
									<h2 className="text-lg font-bold text-[#1f2430]">💸 Seller Payouts & Stripe Connect Express Integration</h2>
									<p className="text-xs text-[#5b6472]">Automated vendor payout transfers, Stripe Connect balance sync, and manual payout trigger</p>

									<div className="overflow-hidden rounded-2xl border border-[#d9e2ef]">
										<table className="w-full text-left text-xs">
											<thead className="bg-[#f8faff] border-b border-[#d9e2ef] text-[#5b6472]">
												<tr>
													<th className="p-3 font-semibold">Payout ID</th>
													<th className="p-3 font-semibold">Vendor Seller</th>
													<th className="p-3 font-semibold">Transfer Amount ($)</th>
													<th className="p-3 font-semibold">Stripe Transfer ID</th>
													<th className="p-3 font-semibold">Status</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-[#d9e2ef]">
												{payouts.map((p) => (
													<tr key={p.id}>
														<td className="p-3 font-bold text-[#6678c1]">{p.id}</td>
														<td className="p-3 font-semibold text-[#1f2430]">{p.vendorName}</td>
														<td className="p-3 font-bold text-emerald-600">${p.amount.toFixed(2)}</td>
														<td className="p-3 font-mono text-[11px] text-[#5b6472]">{p.stripePayoutId}</td>
														<td className="p-3">
															<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
																{p.status}
															</span>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}

						{/* 7. PROMOTIONS TAB */}
						{medusaSubTab === "promotions" && (
							<div className="space-y-6">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
									<h2 className="text-lg font-bold text-[#1f2430]">🎟️ Promotions, Discounts & Coupon Engine</h2>
									<p className="text-xs text-[#5b6472]">Marketplace-wide promo codes and seller-specific discount offers</p>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div className="rounded-2xl border border-[#d9e2ef] p-5 bg-[#f8faff] space-y-2">
											<div className="flex justify-between items-center">
												<span className="font-mono text-sm font-black text-[#6678c1] bg-white px-3 py-1 rounded-xl border border-[#d9e2ef]">MEDUSA10</span>
												<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">ACTIVE</span>
											</div>
											<div className="text-xs font-bold text-[#1f2430]">10% Off Entire Marketplace Cart</div>
											<p className="text-xs text-[#5b6472]">Valid on all multi-vendor orders with no minimum spending threshold.</p>
										</div>

										<div className="rounded-2xl border border-[#d9e2ef] p-5 bg-[#f8faff] space-y-2">
											<div className="flex justify-between items-center">
												<span className="font-mono text-sm font-black text-purple-600 bg-white px-3 py-1 rounded-xl border border-[#d9e2ef]">B2B50</span>
												<span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">B2B SPECIAL</span>
											</div>
											<div className="text-xs font-bold text-[#1f2430]">15% Off Wholesale Bulk Purchases</div>
											<p className="text-xs text-[#5b6472]">Valid for enterprise bulk purchases & wholesale catalog orders.</p>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* 8. SELLER ANALYTICS TAB */}
						{medusaSubTab === "analytics" && (
							<div className="space-y-6">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
									<h2 className="text-lg font-bold text-[#1f2430]">📊 Seller Analytics & GMV Volume Reports</h2>
									<p className="text-xs text-[#5b6472]">Real-time revenue performance, platform commission breakdown, and top sellers</p>

									<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
										<div className="rounded-2xl border border-[#d9e2ef] p-5 bg-[#f8faff] space-y-2">
											<div className="text-xs font-bold text-[#5b6472]">Gross Merchandise Volume</div>
											<div className="text-2xl font-black text-emerald-600">${totalGmv.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
											<p className="text-xs text-[#5b6472]">Total sales generated across all marketplace sellers.</p>
										</div>

										<div className="rounded-2xl border border-[#d9e2ef] p-5 bg-[#f8faff] space-y-2">
											<div className="text-xs font-bold text-[#5b6472]">Platform Commission Earned</div>
											<div className="text-2xl font-black text-[#6678c1]">${totalCommissionEarned.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
											<p className="text-xs text-[#5b6472]">Net platform operator fee (8.5% rate engine).</p>
										</div>

										<div className="rounded-2xl border border-[#d9e2ef] p-5 bg-[#f8faff] space-y-2">
											<div className="text-xs font-bold text-[#5b6472]">Total Vendor Net Payouts</div>
											<div className="text-2xl font-black text-indigo-600">${totalSellerPayouts.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
											<p className="text-xs text-[#5b6472]">Transferred directly via Stripe Connect Express.</p>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* 9. ADMIN DASHBOARD TAB */}
						{medusaSubTab === "admin" && (
							<div className="space-y-6">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
									<h2 className="text-lg font-bold text-[#1f2430]">🧑💼 Operator Admin Dashboard & Platform Controls</h2>
									<p className="text-xs text-[#5b6472]">Platform operator controls, seller approval queues, and global commission settings</p>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
										<div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
											<div className="font-bold text-[#1f2430]">Standard B2C Commission Rate</div>
											<div className="text-xl font-black text-[#6678c1] mt-1">8.5%</div>
										</div>
										<div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
											<div className="font-bold text-[#1f2430]">Wholesale B2B Bulk Commission</div>
											<div className="text-xl font-black text-emerald-600 mt-1">5.0%</div>
										</div>
										<div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
											<div className="font-bold text-[#1f2430]">Automated Order Splitting</div>
											<div className="text-xl font-black text-indigo-600 mt-1">ENABLED</div>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* 10. MEDUSA API & TECH STACK TAB */}
						{medusaSubTab === "architecture" && (
							<div className="space-y-6">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
									<h2 className="text-lg font-bold text-[#1f2430]">🔌 Headless API-First Architecture & Tech Stack Diagnostic</h2>
									<p className="text-xs text-[#5b6472]">Infrastructure status for Medusa Commerce Core, PostgreSQL database, Redis cache, and Node.js REST API gateway</p>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
										<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
											<div className="font-bold text-emerald-900">🗄️ PostgreSQL Database</div>
											<div className="text-xs text-emerald-700 mt-1">Connected & Synchronized</div>
										</div>
										<div className="rounded-xl border border-red-200 bg-rose-50 p-4">
											<div className="font-bold text-rose-900">⚡ Redis Event Cache</div>
											<div className="text-xs text-rose-700 mt-1">Session & Queue Ready</div>
										</div>
										<div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
											<div className="font-bold text-blue-900">🛍️ Medusa Commerce Engine</div>
											<div className="text-xs text-blue-700 mt-1">v2.5.1 Core Workflows</div>
										</div>
										<div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
											<div className="font-bold text-purple-900">🌐 Node.js + React + Vite</div>
											<div className="text-xs text-purple-700 mt-1">TypeScript 5.x Runtime</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

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

							{medusaCart.length === 0 ? (
								<div className="p-8 text-center text-xs text-[#5b6472]">
									Your multi-vendor cart is empty. Add products from the storefront!
								</div>
							) : (
								<div className="space-y-3">
									{medusaCart.map((item) => (
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

						{medusaCart.length > 0 && (
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
						<h3 className="text-lg font-bold text-[#1f2430]">Register MedusaJS Marketplace Vendor</h3>
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
									<option value="Cloud Infrastructure & Hosting">Cloud Infrastructure & Hosting</option>
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
						<h3 className="text-lg font-bold text-[#1f2430]">List New Product on MedusaJS Catalog</h3>
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
									<input type="number" value={pWholesaleB2b} onChange={(e) => setPWholesaleB2b(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
								</div>
							</div>
							<div>
								<label className="block font-semibold text-[#5b6472]">Product Description</label>
								<textarea rows={2} value={pDesc} onChange={(e) => setPDesc(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
							</div>
							<div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
								<button type="button" onClick={() => setShowProductModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2">Cancel</button>
								<button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 font-bold text-white shadow-md">Publish to MedusaJS</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</WorkspaceShell>
	);
}
