import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";

// E-Way Bill threshold in INR
const EWAY_BILL_THRESHOLD = 50000;

// Transport mode mapping
const TRANSPORT_MODE_MAP: Record<string, string> = {
	ROAD: "1",
	RAIL: "2",
	AIR: "3",
	SHIP: "4",
};

export interface TransportDetails {
	transporterName?: string;
	transporterGSTIN?: string;
	vehicleNumber?: string;
	transportMode?: "ROAD" | "RAIL" | "AIR" | "SHIP";
	distance?: number;
}

export interface EWayBillJSON {
	supplyType: string;
	subSupplyType?: string;
	docType: string;
	docNo: string;
	docDate: string;
	fromGstin: string;
	fromTrdName: string;
	fromAddr1: string;
	fromPlace: string;
	fromPincode?: string;
	fromStateCode: string;
	toGstin: string;
	toTrdName: string;
	toAddr1: string;
	toPlace: string;
	toPincode?: string;
	toStateCode: string;
	totalValue: number;
	cgstValue: number;
	sgstValue: number;
	igstValue: number;
	cessValue: number;
	transporterId?: string;
	transporterName?: string;
	transDocNo?: string;
	transMode: string;
	transDistance?: string;
	vehicleNo?: string;
	vehicleType?: string;
	itemList: Array<{
		itemNo: number;
		productName: string;
		productDesc?: string;
		hsnCode: string;
		quantity: number;
		qtyUnit: string;
		cgstRate: number;
		sgstRate: number;
		igstRate: number;
		cessRate: number;
		taxableAmount: number;
	}>;
}

export interface ValidationError {
	field: string;
	message: string;
}

/**
 * Validate if invoice is eligible for E-Way Bill generation
 */
export async function validateEWayBillEligibility(
	invoiceId: string,
	organizationId: string
): Promise<{ valid: boolean; errors: ValidationError[] }> {
	const errors: ValidationError[] = [];

	// Fetch invoice with all related data
	const invoice = await prisma.invoice.findFirst({
		where: {
			id: invoiceId,
			organizationId,
		},
		include: {
			customer: true,
			items: {
				include: {
					product: true,
				},
			},
			organization: {
				include: {
					gstConfig: true,
				},
			},
		},
	});

	if (!invoice) {
		errors.push({ field: "invoiceId", message: "Invoice not found" });
		return { valid: false, errors };
	}

	// Check if invoice is cancelled
	if (invoice.status === "CANCELLED") {
		errors.push({ field: "status", message: "Cannot generate E-Way Bill for cancelled invoice" });
	}

	// Check if total value exceeds threshold
	const totalValue = Number(invoice.totalAmount);
	if (totalValue < EWAY_BILL_THRESHOLD) {
		errors.push({
			field: "totalAmount",
			message: `Invoice value (₹${totalValue}) is below E-Way Bill threshold (₹${EWAY_BILL_THRESHOLD})`,
		});
	}

	// Check if buyer GSTIN exists
	if (!invoice.customer?.gstNumber) {
		errors.push({ field: "customer.gstNumber", message: "Buyer GSTIN is required for E-Way Bill" });
	}

	// Check if seller GSTIN exists
	if (!invoice.organization.gstConfig?.gstNumber) {
		errors.push({
			field: "organization.gstNumber",
			message: "Seller GSTIN is required. Please configure GST settings.",
		});
	}

	// Check if all products have HSN codes
	const itemsWithoutHSN = invoice.items.filter(
		(item) => !item.product.hsnCode || item.product.hsnCode.trim() === ""
	);
	if (itemsWithoutHSN.length > 0) {
		errors.push({
			field: "items.hsnCode",
			message: `${itemsWithoutHSN.length} product(s) missing HSN codes. HSN is required for E-Way Bill.`,
		});
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Format date for E-Way Bill JSON (DD/MM/YYYY)
 */
function formatDateForEWay(date: Date): string {
	const day = date.getDate().toString().padStart(2, "0");
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
}

/**
 * Generate E-Way Bill JSON for an invoice
 */
export async function generateEWayBillJSON(
	invoiceId: string,
	organizationId: string,
	transportDetails: TransportDetails
): Promise<{ success: boolean; data?: EWayBillJSON; errors?: ValidationError[] }> {
	// Validate eligibility
	const validation = await validateEWayBillEligibility(invoiceId, organizationId);
	if (!validation.valid) {
		return { success: false, errors: validation.errors };
	}

	// Fetch full invoice data
	const invoice = await prisma.invoice.findFirst({
		where: {
			id: invoiceId,
			organizationId,
		},
		include: {
			customer: true,
			items: {
				include: {
					product: true,
				},
			},
			organization: {
				include: {
					gstConfig: true,
				},
			},
		},
	});

	if (!invoice) {
		return { success: false, errors: [{ field: "invoiceId", message: "Invoice not found" }] };
	}

	const gstConfig = invoice.organization.gstConfig!;
	const customer = invoice.customer!;

	// Determine supply type (intra-state vs inter-state)
	const isInterState = gstConfig.stateCode !== customer.stateCode;
	const supplyType = "Outward"; // For sales invoices

	// Build item list
	const itemList = invoice.items.map((item, index) => ({
		itemNo: index + 1,
		productName: item.product.name,
		productDesc: item.product.description || item.product.name,
		hsnCode: item.product.hsnCode || "",
		quantity: item.quantity,
		qtyUnit: "PCS", // Default unit
		cgstRate: Number(item.cgstRate || 0),
		sgstRate: Number(item.sgstRate || 0),
		igstRate: Number(item.igstRate || 0),
		cessRate: 0, // Cess not implemented yet
		taxableAmount: Number(item.price) * item.quantity,
	}));

	// Calculate totals
	const totalValue = Number(invoice.totalAmount);
	const cgstValue = Number(invoice.cgstAmount);
	const sgstValue = Number(invoice.sgstAmount);
	const igstValue = Number(invoice.igstAmount);

	// Build E-Way Bill JSON
	const ewayBillJSON: EWayBillJSON = {
		supplyType,
		docType: "INV", // Invoice
		docNo: invoice.invoiceNumber,
		docDate: formatDateForEWay(invoice.issuedAt),
		fromGstin: gstConfig.gstNumber,
		fromTrdName: gstConfig.tradeName || gstConfig.legalName,
		fromAddr1: customer.billingAddress || "Not Provided",
		fromPlace: customer.state || "Not Provided",
		fromStateCode: gstConfig.stateCode,
		toGstin: customer.gstNumber!,
		toTrdName: customer.companyName || `${customer.firstName} ${customer.lastName}`.trim(),
		toAddr1: customer.shippingAddress || customer.billingAddress || "Not Provided",
		toPlace: customer.state || "Not Provided",
		toStateCode: customer.stateCode || "00",
		totalValue,
		cgstValue,
		sgstValue,
		igstValue,
		cessValue: 0,
		transMode: TRANSPORT_MODE_MAP[transportDetails.transportMode || "ROAD"],
		itemList,
	};

	// Add optional transport details
	if (transportDetails.transporterGSTIN) {
		ewayBillJSON.transporterId = transportDetails.transporterGSTIN;
	}
	if (transportDetails.transporterName) {
		ewayBillJSON.transporterName = transportDetails.transporterName;
	}
	if (transportDetails.vehicleNumber) {
		ewayBillJSON.vehicleNo = transportDetails.vehicleNumber;
	}
	if (transportDetails.distance) {
		ewayBillJSON.transDistance = transportDetails.distance.toString();
	}

	// Save E-Way Bill record
	await prisma.eWayBill.create({
		data: {
			organizationId,
			invoiceId,
			transporterName: transportDetails.transporterName,
			transporterGSTIN: transportDetails.transporterGSTIN,
			vehicleNumber: transportDetails.vehicleNumber,
			transportMode: transportDetails.transportMode,
			distance: transportDetails.distance,
			status: "GENERATED",
		},
	});

	return { success: true, data: ewayBillJSON };
}

/**
 * Get E-Way Bill history for an invoice
 */
export async function getEWayBillHistory(invoiceId: string, organizationId: string) {
	return await prisma.eWayBill.findMany({
		where: {
			invoiceId,
			organizationId,
		},
		orderBy: {
			generatedAt: "desc",
		},
	});
}

/**
 * Cancel E-Way Bill
 */
export async function cancelEWayBill(ewayBillId: string, organizationId: string) {
	const ewayBill = await prisma.eWayBill.findFirst({
		where: {
			id: ewayBillId,
			organizationId,
		},
	});

	if (!ewayBill) {
		throw new Error("E-Way Bill not found");
	}

	if (ewayBill.status === "CANCELLED") {
		throw new Error("E-Way Bill is already cancelled");
	}

	return await prisma.eWayBill.update({
		where: { id: ewayBillId },
		data: { status: "CANCELLED" },
	});
}
