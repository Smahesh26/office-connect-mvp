import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";

const toMoney = (value: number | Prisma.Decimal): number => {
	return Number(Number(value).toFixed(2));
};

export interface TaxBreakdown {
	cgst: number;
	sgst: number;
	igst: number;
	total: number;
}

export interface GSTR3BSummary {
	period: {
		month: number;
		year: number;
		startDate: Date;
		endDate: Date;
	};
	outputGST: TaxBreakdown;
	inputGST: TaxBreakdown;
	netPayable: TaxBreakdown;
	itcCarryForward: TaxBreakdown;
	metadata: {
		totalSalesInvoices: number;
		totalPurchaseInvoices: number;
		totalOutputValue: number;
		totalInputValue: number;
	};
	generatedAt: Date;
}

/**
 * Generate GSTR-3B Monthly Summary
 * Calculates: Output GST - Input GST = Net Payable
 */
export const generateGSTR3BSummary = async (
	organizationId: string,
	month: number,
	year: number,
): Promise<GSTR3BSummary> => {
	if (!Number.isInteger(month) || month < 1 || month > 12) {
		throw new Error("Month must be between 1 and 12");
	}

	if (!Number.isInteger(year) || year < 2000) {
		throw new Error("Invalid year");
	}

	// Date range for the month
	const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
	const endDate = new Date(year, month, 1, 0, 0, 0, 0);

	// 1️⃣ OUTPUT GST - From Sales Invoices (ISSUED)
	const salesInvoices = await prisma.invoice.findMany({
		where: {
			organizationId,
			status: "ISSUED",
			issuedAt: {
				gte: startDate,
				lt: endDate,
			},
		},
		select: {
			subtotal: true,
			cgstAmount: true,
			sgstAmount: true,
			igstAmount: true,
			totalAmount: true,
		},
	});

	let outputCGST = 0;
	let outputSGST = 0;
	let outputIGST = 0;
	let totalOutputValue = 0;

	for (const invoice of salesInvoices) {
		outputCGST += toMoney(invoice.cgstAmount);
		outputSGST += toMoney(invoice.sgstAmount);
		outputIGST += toMoney(invoice.igstAmount);
		totalOutputValue += toMoney(invoice.totalAmount);
	}

	// 2️⃣ INPUT GST - From Purchase Invoices (ITC Eligible)
	// Note: Purchases might be in a separate table or Bill model
	// For now, checking if there's a purchase-related model
	let inputCGST = 0;
	let inputSGST = 0;
	let inputIGST = 0;
	let totalInputValue = 0;
	let purchaseInvoiceCount = 0;

	// Try to fetch purchase/bill data if model exists
	try {
		// Check if Bill model exists for purchases
		const bills = await (prisma as any).bill?.findMany({
			where: {
				organizationId,
				status: "APPROVED",
				date: {
					gte: startDate,
					lt: endDate,
				},
			},
			select: {
				subtotal: true,
				cgstAmount: true,
				sgstAmount: true,
				igstAmount: true,
				totalAmount: true,
			},
		});

		if (bills) {
			for (const bill of bills) {
				inputCGST += toMoney(bill.cgstAmount);
				inputSGST += toMoney(bill.sgstAmount);
				inputIGST += toMoney(bill.igstAmount);
				totalInputValue += toMoney(bill.totalAmount);
			}
			purchaseInvoiceCount = bills.length;
		}
	} catch (error) {
		// Bill model might not exist - that's okay, input GST will be zero
		console.log("No purchase/bill data found - Input GST will be zero");
	}

	// 3️⃣ CALCULATE NET PAYABLE
	const netCGST = outputCGST - inputCGST;
	const netSGST = outputSGST - inputSGST;
	const netIGST = outputIGST - inputIGST;

	// 4️⃣ ITC CARRY FORWARD (if input > output)
	const itcCarryForwardCGST = netCGST < 0 ? Math.abs(netCGST) : 0;
	const itcCarryForwardSGST = netSGST < 0 ? Math.abs(netSGST) : 0;
	const itcCarryForwardIGST = netIGST < 0 ? Math.abs(netIGST) : 0;

	// 5️⃣ NET PAYABLE (only positive amounts)
	const payableCGST = netCGST > 0 ? netCGST : 0;
	const payableSGST = netSGST > 0 ? netSGST : 0;
	const payableIGST = netIGST > 0 ? netIGST : 0;

	return {
		period: {
			month,
			year,
			startDate,
			endDate,
		},
		outputGST: {
			cgst: toMoney(outputCGST),
			sgst: toMoney(outputSGST),
			igst: toMoney(outputIGST),
			total: toMoney(outputCGST + outputSGST + outputIGST),
		},
		inputGST: {
			cgst: toMoney(inputCGST),
			sgst: toMoney(inputSGST),
			igst: toMoney(inputIGST),
			total: toMoney(inputCGST + inputSGST + inputIGST),
		},
		netPayable: {
			cgst: toMoney(payableCGST),
			sgst: toMoney(payableSGST),
			igst: toMoney(payableIGST),
			total: toMoney(payableCGST + payableSGST + payableIGST),
		},
		itcCarryForward: {
			cgst: toMoney(itcCarryForwardCGST),
			sgst: toMoney(itcCarryForwardSGST),
			igst: toMoney(itcCarryForwardIGST),
			total: toMoney(itcCarryForwardCGST + itcCarryForwardSGST + itcCarryForwardIGST),
		},
		metadata: {
			totalSalesInvoices: salesInvoices.length,
			totalPurchaseInvoices: purchaseInvoiceCount,
			totalOutputValue: toMoney(totalOutputValue),
			totalInputValue: toMoney(totalInputValue),
		},
		generatedAt: new Date(),
	};
};

/**
 * Generate JSON for GSTR-3B filing
 */
export const generateGSTR3BJSON = (summary: GSTR3BSummary) => {
	return {
		gstin: "", // To be filled by organization
		ret_period: `${String(summary.period.month).padStart(2, "0")}${summary.period.year}`,
		// Table 3.1 - Tax on outward and reverse charge inward supplies
		sup_details: {
			osup_det: {
				// Outward taxable supplies
				txval: summary.metadata.totalOutputValue,
				iamt: summary.outputGST.igst,
				camt: summary.outputGST.cgst,
				samt: summary.outputGST.sgst,
				csamt: 0, // Cess amount (not implemented)
			},
		},
		// Table 4 - Eligible ITC
		itc_elg: {
			itc_avl: [
				{
					ty: "IMPG", // Import of goods
					iamt: summary.inputGST.igst,
					camt: summary.inputGST.cgst,
					samt: summary.inputGST.sgst,
					csamt: 0,
				},
			],
		},
		// Table 6.1 - Payment of tax
		intr_details: {
			intr_det: {
				iamt: summary.netPayable.igst,
				camt: summary.netPayable.cgst,
				samt: summary.netPayable.sgst,
				csamt: 0,
			},
		},
	};
};

/**
 * Generate human-readable summary report
 */
export const generateGSTR3BReport = (summary: GSTR3BSummary): string => {
	const lines: string[] = [];

	lines.push("═══════════════════════════════════════════════════════");
	lines.push("              GSTR-3B MONTHLY SUMMARY                  ");
	lines.push("═══════════════════════════════════════════════════════");
	lines.push("");
	lines.push(`Period: ${summary.period.month}/${summary.period.year}`);
	lines.push(`Generated: ${summary.generatedAt.toLocaleString("en-IN")}`);
	lines.push("");

	lines.push("───────────────────────────────────────────────────────");
	lines.push("1. OUTPUT GST (Tax Collected on Sales)");
	lines.push("───────────────────────────────────────────────────────");
	lines.push(`   CGST: ₹${summary.outputGST.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
	lines.push(`   SGST: ₹${summary.outputGST.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
	lines.push(`   IGST: ₹${summary.outputGST.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
	lines.push(`   ────────────────────────────────────────────`);
	lines.push(
		`   TOTAL OUTPUT GST: ₹${summary.outputGST.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
	);
	lines.push("");

	lines.push("───────────────────────────────────────────────────────");
	lines.push("2. INPUT GST (ITC from Purchases)");
	lines.push("───────────────────────────────────────────────────────");
	lines.push(`   CGST: ₹${summary.inputGST.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
	lines.push(`   SGST: ₹${summary.inputGST.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
	lines.push(`   IGST: ₹${summary.inputGST.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
	lines.push(`   ────────────────────────────────────────────`);
	lines.push(
		`   TOTAL INPUT GST: ₹${summary.inputGST.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
	);
	lines.push("");

	lines.push("═══════════════════════════════════════════════════════");
	lines.push("3. NET GST PAYABLE (Output - Input)");
	lines.push("═══════════════════════════════════════════════════════");
	lines.push(`   CGST: ₹${summary.netPayable.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
	lines.push(`   SGST: ₹${summary.netPayable.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
	lines.push(`   IGST: ₹${summary.netPayable.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
	lines.push(`   ────────────────────────────────────────────`);
	lines.push(
		`   TOTAL PAYABLE: ₹${summary.netPayable.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
	);
	lines.push("");

	if (summary.itcCarryForward.total > 0) {
		lines.push("───────────────────────────────────────────────────────");
		lines.push("4. ITC CARRY FORWARD (Credit Available)");
		lines.push("───────────────────────────────────────────────────────");
		lines.push(
			`   CGST: ₹${summary.itcCarryForward.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
		);
		lines.push(
			`   SGST: ₹${summary.itcCarryForward.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
		);
		lines.push(
			`   IGST: ₹${summary.itcCarryForward.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
		);
		lines.push(`   ────────────────────────────────────────────`);
		lines.push(
			`   TOTAL ITC CARRY FORWARD: ₹${summary.itcCarryForward.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
		);
		lines.push("");
	}

	lines.push("───────────────────────────────────────────────────────");
	lines.push("SUMMARY STATISTICS");
	lines.push("───────────────────────────────────────────────────────");
	lines.push(`   Sales Invoices: ${summary.metadata.totalSalesInvoices}`);
	lines.push(`   Purchase Invoices: ${summary.metadata.totalPurchaseInvoices}`);
	lines.push(
		`   Total Sales Value: ₹${summary.metadata.totalOutputValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
	);
	lines.push(
		`   Total Purchase Value: ₹${summary.metadata.totalInputValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
	);
	lines.push("");

	lines.push("═══════════════════════════════════════════════════════");
	const dueDate = new Date(summary.period.year, summary.period.month, 20);
	lines.push(`Due Date: 20th ${dueDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`);
	lines.push("═══════════════════════════════════════════════════════");

	return lines.join("\n");
};
