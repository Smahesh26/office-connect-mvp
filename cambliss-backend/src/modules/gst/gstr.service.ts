import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";

const toMoney = (value: number): number => Number(value.toFixed(2));

const formatDateDDMMYYYY = (date: Date) => {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
};

export interface B2BInvoiceRecord {
	gstin: string;
	invoiceNumber: string;
	invoiceDate: string;
	invoiceValue: number;
	placeOfSupply: string;
	taxableValue: number;
	cgstAmount: number;
	sgstAmount: number;
	igstAmount: number;
	totalTax: number;
}

export interface B2CInvoiceRecord {
	invoiceNumber: string;
	invoiceDate: string;
	invoiceValue: number;
	placeOfSupply: string;
	taxableValue: number;
	cgstAmount: number;
	sgstAmount: number;
	igstAmount: number;
	totalTax: number;
}

export interface GSTR1Summary {
	totalB2BInvoices: number;
	totalB2CInvoices: number;
	totalTaxableValue: number;
	totalCGST: number;
	totalSGST: number;
	totalIGST: number;
	totalTax: number;
	totalInvoiceValue: number;
}

export interface GSTR1Report {
	period: {
		month: number;
		year: number;
		startDate: Date;
		endDate: Date;
	};
	b2b: B2BInvoiceRecord[];
	b2c: B2CInvoiceRecord[];
	summary: GSTR1Summary;
	generatedAt: Date;
}

/**
 * Generate GSTR-1 report for a given month/year
 */
export const generateGSTR1Report = async (
	organizationId: string,
	month: number,
	year: number,
): Promise<GSTR1Report> => {
	if (!Number.isInteger(month) || month < 1 || month > 12) {
		throw new Error("Month must be between 1 and 12");
	}

	if (!Number.isInteger(year) || year < 2000) {
		throw new Error("Invalid year");
	}

	// Date range for the month
	const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
	const endDate = new Date(year, month, 1, 0, 0, 0, 0);

	// Fetch all ISSUED invoices for this period
	const invoices = await prisma.invoice.findMany({
		where: {
			organizationId,
			status: "ISSUED",
			issuedAt: {
				gte: startDate,
				lt: endDate,
			},
		},
		include: {
			customer: {
				select: {
					gstNumber: true,
					stateCode: true,
				},
			},
		},
		orderBy: {
			issuedAt: "asc",
		},
	});

	const b2b: B2BInvoiceRecord[] = [];
	const b2c: B2CInvoiceRecord[] = [];

	let totalTaxableValue = 0;
	let totalCGST = 0;
	let totalSGST = 0;
	let totalIGST = 0;
	let totalInvoiceValue = 0;

	for (const invoice of invoices) {
		const invoiceValue = toMoney(Number(invoice.totalAmount));
		const taxableValue = toMoney(Number(invoice.subtotal));
		const cgst = toMoney(Number(invoice.cgstAmount));
		const sgst = toMoney(Number(invoice.sgstAmount));
		const igst = toMoney(Number(invoice.igstAmount));
		const totalTax = toMoney(cgst + sgst + igst);

		totalTaxableValue += taxableValue;
		totalCGST += cgst;
		totalSGST += sgst;
		totalIGST += igst;
		totalInvoiceValue += invoiceValue;

		const baseRecord = {
			invoiceNumber: invoice.invoiceNumber,
			invoiceDate: formatDateDDMMYYYY(invoice.issuedAt),
			invoiceValue,
			placeOfSupply: invoice.placeOfSupply || invoice.customer?.stateCode || "00",
			taxableValue,
			cgstAmount: cgst,
			sgstAmount: sgst,
			igstAmount: igst,
			totalTax,
		};

		if (invoice.customer?.gstNumber?.trim()) {
			b2b.push({
				gstin: invoice.customer.gstNumber,
				...baseRecord,
			});
		} else {
			b2c.push(baseRecord);
		}
	}

	const summary: GSTR1Summary = {
		totalB2BInvoices: b2b.length,
		totalB2CInvoices: b2c.length,
		totalTaxableValue: toMoney(totalTaxableValue),
		totalCGST: toMoney(totalCGST),
		totalSGST: toMoney(totalSGST),
		totalIGST: toMoney(totalIGST),
		totalTax: toMoney(totalCGST + totalSGST + totalIGST),
		totalInvoiceValue: toMoney(totalInvoiceValue),
	};

	return {
		period: {
			month,
			year,
			startDate,
			endDate,
		},
		b2b,
		b2c,
		summary,
		generatedAt: new Date(),
	};
};

/**
 * Generate CSV content from GSTR-1 report data
 */
export const generateGSTR1CSV = (report: GSTR1Report): string => {
	const lines: string[] = [];

	// Header and metadata
	lines.push("GSTR-1 RETURN");
	lines.push(`Month: ${String(report.period.month).padStart(2, "0")}, Year: ${report.period.year}`);
	lines.push(`Generated: ${report.generatedAt.toISOString()}`);
	lines.push("");

	// B2B Section
	lines.push("B2B INVOICES - SUPPLIES TO REGISTERED CUSTOMERS");
	lines.push(
		"GSTIN,Invoice Number,Invoice Date,Invoice Value,Place of Supply,Taxable Value,CGST (%),SGST (%),IGST (%),Total Tax,Invoice Total",
	);

	for (const record of report.b2b) {
		const taxableValue = record.taxableValue;
		const cgstRate = taxableValue > 0 ? ((record.cgstAmount / taxableValue) * 100).toFixed(2) : "0.00";
		const sgstRate = taxableValue > 0 ? ((record.sgstAmount / taxableValue) * 100).toFixed(2) : "0.00";
		const igstRate = taxableValue > 0 ? ((record.igstAmount / taxableValue) * 100).toFixed(2) : "0.00";

		lines.push(
			`"${record.gstin}","${record.invoiceNumber}","${record.invoiceDate}","${record.invoiceValue.toFixed(2)}","${record.placeOfSupply}","${record.taxableValue.toFixed(2)}","${cgstRate}%","${sgstRate}%","${igstRate}%","${record.totalTax.toFixed(2)}","${record.invoiceValue.toFixed(2)}"`,
		);
	}

	lines.push("");
	lines.push(`B2B Summary: ${report.summary.totalB2BInvoices} invoices`);
	lines.push("");

	// B2C Section
	if (report.b2c.length > 0) {
		lines.push("B2C INVOICES - SUPPLIES TO UNREGISTERED CUSTOMERS");
		lines.push(
			"Invoice Number,Invoice Date,Invoice Value,Place of Supply,Taxable Value,CGST (%),SGST (%),IGST (%),Total Tax,Invoice Total",
		);

		for (const record of report.b2c) {
			const taxableValue = record.taxableValue;
			const cgstRate = taxableValue > 0 ? ((record.cgstAmount / taxableValue) * 100).toFixed(2) : "0.00";
			const sgstRate = taxableValue > 0 ? ((record.sgstAmount / taxableValue) * 100).toFixed(2) : "0.00";
			const igstRate = taxableValue > 0 ? ((record.igstAmount / taxableValue) * 100).toFixed(2) : "0.00";

			lines.push(
				`"${record.invoiceNumber}","${record.invoiceDate}","${record.invoiceValue.toFixed(2)}","${record.placeOfSupply}","${record.taxableValue.toFixed(2)}","${cgstRate}%","${sgstRate}%","${igstRate}%","${record.totalTax.toFixed(2)}","${record.invoiceValue.toFixed(2)}"`,
			);
		}

		lines.push("");
		lines.push(`B2C Summary: ${report.summary.totalB2CInvoices} invoices`);
		lines.push("");
	}

	// Combined Summary
	lines.push("GSTR-1 SUMMARY");
	lines.push(`Total Invoices,${report.summary.totalB2BInvoices + report.summary.totalB2CInvoices}`);
	lines.push(`Total Taxable Value,"${report.summary.totalTaxableValue.toFixed(2)}"`);
	lines.push(`Total CGST,"${report.summary.totalCGST.toFixed(2)}"`);
	lines.push(`Total SGST,"${report.summary.totalSGST.toFixed(2)}"`);
	lines.push(`Total IGST,"${report.summary.totalIGST.toFixed(2)}"`);
	lines.push(`Total Tax,"${report.summary.totalTax.toFixed(2)}"`);
	lines.push(`Total Invoice Value,"${report.summary.totalInvoiceValue.toFixed(2)}"`);

	return lines.join("\n");
};

/**
 * Generate standardized JSON for GSTR-1 submission
 */
export const generateGSTR1JSON = (report: GSTR1Report) => {
	return {
		period: {
			month: report.period.month,
			year: report.period.year,
		},
		b2b: report.b2b.map((r) => ({
			gstin: r.gstin,
			invoiceNo: r.invoiceNumber,
			invoiceDate: r.invoiceDate,
			invoiceValue: r.invoiceValue,
			placeOfSupply: r.placeOfSupply,
			taxableValue: r.taxableValue,
			cgst: r.cgstAmount,
			sgst: r.sgstAmount,
			igst: r.igstAmount,
		})),
		b2c: report.b2c.map((r) => ({
			invoiceNo: r.invoiceNumber,
			invoiceDate: r.invoiceDate,
			invoiceValue: r.invoiceValue,
			placeOfSupply: r.placeOfSupply,
			taxableValue: r.taxableValue,
			cgst: r.cgstAmount,
			sgst: r.sgstAmount,
			igst: r.igstAmount,
		})),
		summary: {
			totalB2BInvoices: report.summary.totalB2BInvoices,
			totalB2CInvoices: report.summary.totalB2CInvoices,
			totalTaxableValue: report.summary.totalTaxableValue,
			totalCGST: report.summary.totalCGST,
			totalSGST: report.summary.totalSGST,
			totalIGST: report.summary.totalIGST,
			totalTax: report.summary.totalTax,
			totalInvoiceValue: report.summary.totalInvoiceValue,
		},
	};
};
