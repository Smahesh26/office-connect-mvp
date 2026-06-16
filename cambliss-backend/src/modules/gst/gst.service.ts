import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";

export class GSTError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "GSTError";
	}
}

const toMoney = (value: number): number => Number(value.toFixed(2));

/**
 * GST FUNDAMENTALS:
 * 
 * Same State (Intra-state): CGST + SGST
 * - Example: Telangana → Telangana, 18% GST = 9% CGST + 9% SGST
 * 
 * Different State (Inter-state): IGST
 * - Example: Telangana → Maharashtra, 18% GST = 18% IGST
 */

export interface GSTBreakdown {
	gstRate: number;
	cgstRate: number;
	sgstRate: number;
	igstRate: number;
	cgstAmount: number;
	sgstAmount: number;
	igstAmount: number;
	totalGSTAmount: number;
	isIntraState: boolean;
}

/**
 * Calculate GST breakdown based on seller and buyer state codes
 */
export const calculateGST = (
	sellerStateCode: string,
	buyerStateCode: string | null | undefined,
	taxableValue: number,
	gstRate: number,
): GSTBreakdown => {
	const normalizedSellerState = sellerStateCode?.trim();
	const normalizedBuyerState = buyerStateCode?.trim();

	if (!normalizedSellerState) {
		throw new GSTError(400, "Seller state code is required for GST calculation");
	}

	// If buyer state is not provided or same as seller → Intra-state (CGST + SGST)
	const isIntraState = !normalizedBuyerState || normalizedSellerState === normalizedBuyerState;

	let cgstRate = 0;
	let sgstRate = 0;
	let igstRate = 0;

	if (isIntraState) {
		// Same state: split GST into CGST and SGST
		cgstRate = toMoney(gstRate / 2);
		sgstRate = toMoney(gstRate / 2);
		igstRate = 0;
	} else {
		// Different state: full GST as IGST
		cgstRate = 0;
		sgstRate = 0;
		igstRate = gstRate;
	}

	const cgstAmount = toMoney((taxableValue * cgstRate) / 100);
	const sgstAmount = toMoney((taxableValue * sgstRate) / 100);
	const igstAmount = toMoney((taxableValue * igstRate) / 100);
	const totalGSTAmount = toMoney(cgstAmount + sgstAmount + igstAmount);

	return {
		gstRate,
		cgstRate,
		sgstRate,
		igstRate,
		cgstAmount,
		sgstAmount,
		igstAmount,
		totalGSTAmount,
		isIntraState,
	};
};

// ========== GST CONFIGURATION ==========

export interface CreateGSTConfigInput {
	gstNumber: string;
	legalName: string;
	tradeName?: string;
	stateCode: string;
	isComposition?: boolean;
}

export const createGSTConfig = async (organizationId: string, input: CreateGSTConfigInput) => {
	if (!input.gstNumber?.trim()) {
		throw new GSTError(400, "GST number is required");
	}

	if (!input.legalName?.trim()) {
		throw new GSTError(400, "Legal name is required");
	}

	if (!input.stateCode?.trim()) {
		throw new GSTError(400, "State code is required");
	}

	// Validate GST number format (15 characters: 2 state code + 10 PAN + 1 entity + 1 zone + 1 check)
	const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
	if (!gstPattern.test(input.gstNumber.trim())) {
		throw new GSTError(400, "Invalid GST number format");
	}

	// Check if GST config already exists
	const existing = await prisma.gSTConfig.findUnique({
		where: { organizationId },
	});

	if (existing) {
		throw new GSTError(409, "GST configuration already exists for this organization");
	}

	const gstConfig = await prisma.gSTConfig.create({
		data: {
			organizationId,
			gstNumber: input.gstNumber.trim(),
			legalName: input.legalName.trim(),
			tradeName: input.tradeName?.trim() || null,
			stateCode: input.stateCode.trim(),
			isComposition: input.isComposition ?? false,
		},
	});

	return gstConfig;
};

export const getGSTConfig = async (organizationId: string) => {
	const gstConfig = await prisma.gSTConfig.findUnique({
		where: { organizationId },
	});

	if (!gstConfig) {
		throw new GSTError(404, "GST configuration not found for this organization");
	}

	return gstConfig;
};

export const updateGSTConfig = async (organizationId: string, input: Partial<CreateGSTConfigInput>) => {
	const existing = await prisma.gSTConfig.findUnique({
		where: { organizationId },
	});

	if (!existing) {
		throw new GSTError(404, "GST configuration not found");
	}

	// Validate GST number if provided
	if (input.gstNumber) {
		const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
		if (!gstPattern.test(input.gstNumber.trim())) {
			throw new GSTError(400, "Invalid GST number format");
		}
	}

	const updated = await prisma.gSTConfig.update({
		where: { organizationId },
		data: {
			gstNumber: input.gstNumber?.trim() || existing.gstNumber,
			legalName: input.legalName?.trim() || existing.legalName,
			tradeName: input.tradeName !== undefined ? input.tradeName?.trim() || null : existing.tradeName,
			stateCode: input.stateCode?.trim() || existing.stateCode,
			isComposition: input.isComposition ?? existing.isComposition,
		},
	});

	return updated;
};

export const deleteGSTConfig = async (organizationId: string) => {
	const existing = await prisma.gSTConfig.findUnique({
		where: { organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new GSTError(404, "GST configuration not found");
	}

	await prisma.gSTConfig.delete({
		where: { organizationId },
	});

	return { message: "GST configuration deleted" };
};

// ========== GST REPORTING ==========

export interface GSTReportInput {
	month: number;  // 1-12
	year: number;
}

export interface GSTReportResult {
	period: {
		month: number;
		year: number;
		startDate: Date;
		endDate: Date;
	};
	output: {
		totalInvoices: number;
		totalTaxableValue: number;
		totalCGST: number;
		totalSGST: number;
		totalIGST: number;
		totalGST: number;
	};
	input: {
		totalPurchases: number;
		totalTaxableValue: number;
		totalCGST: number;
		totalSGST: number;
		totalIGST: number;
		totalITC: number;
	};
	netGSTPayable: number;
}

export const generateGSTReport = async (
	organizationId: string,
	input: GSTReportInput,
): Promise<GSTReportResult> => {
	const { month, year } = input;

	if (!Number.isInteger(month) || month < 1 || month > 12) {
		throw new GSTError(400, "Month must be between 1 and 12");
	}

	if (!Number.isInteger(year) || year < 2000) {
		throw new GSTError(400, "Invalid year");
	}

	// Date range for the month
	const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
	const endDate = new Date(year, month, 1, 0, 0, 0, 0);

	// Output GST: Invoices (sales)
	const invoices = await prisma.invoice.findMany({
		where: {
			organizationId,
			issuedAt: {
				gte: startDate,
				lt: endDate,
			},
			status: {
				not: "CANCELLED",
			},
		},
		select: {
			subtotal: true,
			cgstAmount: true,
			sgstAmount: true,
			igstAmount: true,
		},
	});

	const outputTaxableValue = toMoney(
		invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0),
	);
	const outputCGST = toMoney(
		invoices.reduce((sum, inv) => sum + Number(inv.cgstAmount), 0),
	);
	const outputSGST = toMoney(
		invoices.reduce((sum, inv) => sum + Number(inv.sgstAmount), 0),
	);
	const outputIGST = toMoney(
		invoices.reduce((sum, inv) => sum + Number(inv.igstAmount), 0),
	);
	const totalOutputGST = toMoney(outputCGST + outputSGST + outputIGST);

	// Input Tax Credit (ITC): Purchase orders
	const purchases = await prisma.purchaseOrder.findMany({
		where: {
			organizationId,
			createdAt: {
				gte: startDate,
				lt: endDate,
			},
			status: "RECEIVED",
		},
		include: {
			items: {
				select: {
					quantity: true,
					unitPrice: true,
					cgstAmount: true,
					sgstAmount: true,
					igstAmount: true,
				},
			},
		},
	});

	let inputTaxableValue = 0;
	let inputCGST = 0;
	let inputSGST = 0;
	let inputIGST = 0;

	purchases.forEach((po) => {
		po.items.forEach((item) => {
			const itemValue = Number(item.unitPrice) * item.quantity;
			inputTaxableValue += itemValue;
			inputCGST += Number(item.cgstAmount);
			inputSGST += Number(item.sgstAmount);
			inputIGST += Number(item.igstAmount);
		});
	});

	inputTaxableValue = toMoney(inputTaxableValue);
	inputCGST = toMoney(inputCGST);
	inputSGST = toMoney(inputSGST);
	inputIGST = toMoney(inputIGST);
	const totalITC = toMoney(inputCGST + inputSGST + inputIGST);

	// Net GST payable = Output GST - Input Tax Credit
	const netGSTPayable = toMoney(totalOutputGST - totalITC);

	return {
		period: {
			month,
			year,
			startDate,
			endDate,
		},
		output: {
			totalInvoices: invoices.length,
			totalTaxableValue: outputTaxableValue,
			totalCGST: outputCGST,
			totalSGST: outputSGST,
			totalIGST: outputIGST,
			totalGST: totalOutputGST,
		},
		input: {
			totalPurchases: purchases.length,
			totalTaxableValue: inputTaxableValue,
			totalCGST: inputCGST,
			totalSGST: inputSGST,
			totalIGST: inputIGST,
			totalITC: totalITC,
		},
		netGSTPayable,
	};
};

// ========== GSTR-1 EXPORT ==========

export interface GSTR1InvoiceData {
	invoiceNumber: string;
	invoiceDate: string;
	customerGSTIN: string | null;
	customerName: string | null;
	placeOfSupply: string | null;
	invoiceValue: number;
	taxableValue: number;
	cgstAmount: number;
	sgstAmount: number;
	igstAmount: number;
	totalGST: number;
	isIntraState: boolean;
}

export interface GSTR1Report {
	gstin: string;
	legalName: string;
	tradeName: string | null;
	period: {
		month: number;
		year: number;
	};
	generatedAt: Date;
	summary: {
		totalInvoices: number;
		totalInvoiceValue: number;
		totalTaxableValue: number;
		totalCGST: number;
		totalSGST: number;
		totalIGST: number;
		totalGST: number;
	};
	invoices: GSTR1InvoiceData[];
}

export const generateGSTR1Data = async (
	organizationId: string,
	input: GSTReportInput,
): Promise<GSTR1Report> => {
	const { month, year } = input;

	if (!Number.isInteger(month) || month < 1 || month > 12) {
		throw new GSTError(400, "Month must be between 1 and 12");
	}

	if (!Number.isInteger(year) || year < 2000) {
		throw new GSTError(400, "Invalid year");
	}

	// Get GST config
	const gstConfig = await getGSTConfig(organizationId);

	// Date range for the month
	const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
	const endDate = new Date(year, month, 1, 0, 0, 0, 0);

	// Fetch all invoices for the period
	const invoices = await prisma.invoice.findMany({
		where: {
			organizationId,
			issuedAt: {
				gte: startDate,
				lt: endDate,
			},
			status: {
				not: "CANCELLED",
			},
		},
		include: {
			customer: {
				select: {
					gstNumber: true,
					firstName: true,
					lastName: true,
					companyName: true,
					stateCode: true,
				},
			},
		},
		orderBy: {
			issuedAt: "asc",
		},
	});

	const invoiceData: GSTR1InvoiceData[] = invoices.map((inv) => {
		const customerName = inv.customer
			? inv.customer.companyName || `${inv.customer.firstName || ""} ${inv.customer.lastName || ""}`.trim()
			: null;

		const cgst = Number(inv.cgstAmount);
		const sgst = Number(inv.sgstAmount);
		const igst = Number(inv.igstAmount);
		const totalGST = toMoney(cgst + sgst + igst);

		return {
			invoiceNumber: inv.invoiceNumber,
			invoiceDate: inv.issuedAt.toISOString().split("T")[0],
			customerGSTIN: inv.customer?.gstNumber || null,
			customerName,
			placeOfSupply: inv.placeOfSupply || inv.customer?.stateCode || null,
			invoiceValue: Number(inv.totalAmount),
			taxableValue: Number(inv.subtotal),
			cgstAmount: cgst,
			sgstAmount: sgst,
			igstAmount: igst,
			totalGST,
			isIntraState: igst === 0,
		};
	});

	// Calculate summary
	const summary = {
		totalInvoices: invoiceData.length,
		totalInvoiceValue: toMoney(invoiceData.reduce((sum, inv) => sum + inv.invoiceValue, 0)),
		totalTaxableValue: toMoney(invoiceData.reduce((sum, inv) => sum + inv.taxableValue, 0)),
		totalCGST: toMoney(invoiceData.reduce((sum, inv) => sum + inv.cgstAmount, 0)),
		totalSGST: toMoney(invoiceData.reduce((sum, inv) => sum + inv.sgstAmount, 0)),
		totalIGST: toMoney(invoiceData.reduce((sum, inv) => sum + inv.igstAmount, 0)),
		totalGST: toMoney(invoiceData.reduce((sum, inv) => sum + inv.totalGST, 0)),
	};

	return {
		gstin: gstConfig.gstNumber,
		legalName: gstConfig.legalName,
		tradeName: gstConfig.tradeName,
		period: {
			month,
			year,
		},
		generatedAt: new Date(),
		summary,
		invoices: invoiceData,
	};
};
