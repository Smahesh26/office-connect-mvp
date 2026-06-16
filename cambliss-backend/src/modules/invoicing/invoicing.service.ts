import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";
import PDFDocument from "pdfkit";
import { createTransactionWithEntries } from "../accounting/accounting.service";
import { calculateGST, getGSTConfig } from "../gst/gst.service";

export class InvoiceError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "InvoiceError";
	}
}

const toMoney = (value: number): number => Number(value.toFixed(2));

const getYearRange = () => {
	const now = new Date();
	const year = now.getFullYear();
	const start = new Date(year, 0, 1, 0, 0, 0, 0);
	const end = new Date(year + 1, 0, 1, 0, 0, 0, 0);
	return { year, start, end };
};

const buildInvoiceNumber = (year: number, serial: number) => {
	return `INV-${year}-${serial.toString().padStart(5, "0")}`;
};

const isUniqueConstraintError = (error: unknown) => {
	return (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === "P2002"
	);
};

const getRevenueAndReceivableLedgers = async (
	organizationId: string,
	tx?: Prisma.TransactionClient,
) => {
	const db = tx ?? prisma;
	const ledgers = await db.ledgerAccount.findMany({
		where: {
			organizationId,
			name: {
				in: ["Revenue", "Accounts Receivable", "Cash"],
			},
		},
		select: {
			id: true,
			name: true,
		},
	});

	const revenue = ledgers.find((ledger) => ledger.name === "Revenue");
	const receivable = ledgers.find((ledger) => ledger.name === "Accounts Receivable");
	const cash = ledgers.find((ledger) => ledger.name === "Cash");

	if (!revenue || !receivable || !cash) {
		throw new InvoiceError(400, "Required ledgers Revenue, Accounts Receivable, and Cash must exist");
	}

	return {
		revenueLedgerId: revenue.id,
		receivableLedgerId: receivable.id,
		cashLedgerId: cash.id,
	};
};

const computeLineTax = (lineAmount: number, taxRate: number) => toMoney((lineAmount * taxRate) / 100);

export const generateInvoiceNumber = async (
	organizationId: string,
	tx?: Prisma.TransactionClient,
): Promise<string> => {
	const db = tx ?? prisma;
	const { year, start, end } = getYearRange();

	const count = await db.invoice.count({
		where: {
			organizationId,
			issuedAt: {
				gte: start,
				lt: end,
			},
		},
	});

	return buildInvoiceNumber(year, count + 1);
};

interface CreateInvoiceRecordInput {
	organizationId: string;
	orderId?: string | null;
	posOrderId?: string | null;
	customerId?: string | null;
	customerStateCode?: string | null;
	status?: string;
	items: Array<{
		productId: string;
		quantity: number;
		price: number;
		gstRate: number;
	}>;
	tx?: Prisma.TransactionClient;
}

const createInvoiceRecord = async (input: CreateInvoiceRecordInput) => {
	const createOnce = async (db: Prisma.TransactionClient | typeof prisma) => {
		const invoiceNumber = await generateInvoiceNumber(input.organizationId, db as Prisma.TransactionClient);

		// Get seller's GST config for state code
		let sellerStateCode: string;
		try {
			const gstConfig = await getGSTConfig(input.organizationId);
			sellerStateCode = gstConfig.stateCode;
		} catch {
			// If no GST config, use default calculation without state-specific GST
			sellerStateCode = "";
		}

		const itemPayload = input.items.map((item) => {
			const lineSubtotal = toMoney(item.price * item.quantity);
			
			// Calculate GST breakdown using state codes
			const gstBreakdown = calculateGST(
				sellerStateCode,
				input.customerStateCode,
				lineSubtotal,
				item.gstRate,
			);

			return {
				productId: item.productId,
				quantity: item.quantity,
				price: toMoney(item.price),
				gstRate: toMoney(item.gstRate),
				cgstRate: gstBreakdown.cgstRate > 0 ? toMoney(gstBreakdown.cgstRate) : null,
				sgstRate: gstBreakdown.sgstRate > 0 ? toMoney(gstBreakdown.sgstRate) : null,
				igstRate: gstBreakdown.igstRate > 0 ? toMoney(gstBreakdown.igstRate) : null,
				cgstAmount: gstBreakdown.cgstAmount,
				sgstAmount: gstBreakdown.sgstAmount,
				igstAmount: gstBreakdown.igstAmount,
				lineSubtotal,
			};
		});

		const subtotal = toMoney(itemPayload.reduce((sum, item) => sum + item.lineSubtotal, 0));
		const cgstAmount = toMoney(itemPayload.reduce((sum, item) => sum + item.cgstAmount, 0));
		const sgstAmount = toMoney(itemPayload.reduce((sum, item) => sum + item.sgstAmount, 0));
		const igstAmount = toMoney(itemPayload.reduce((sum, item) => sum + item.igstAmount, 0));
		const totalAmount = toMoney(subtotal + cgstAmount + sgstAmount + igstAmount);

		return db.invoice.create({
			data: {
				organizationId: input.organizationId,
				invoiceNumber,
				orderId: input.orderId ?? null,
				posOrderId: input.posOrderId ?? null,
				customerId: input.customerId ?? null,
				placeOfSupply: input.customerStateCode || null,
				subtotal,
				cgstAmount,
				sgstAmount,
				igstAmount,
				totalAmount,
				status: input.status ?? "ISSUED",
				items: {
					create: itemPayload.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
						price: item.price,
						gstRate: item.gstRate,
						cgstRate: item.cgstRate,
						sgstRate: item.sgstRate,
						igstRate: item.igstRate,
						cgstAmount: item.cgstAmount,
						sgstAmount: item.sgstAmount,
						igstAmount: item.igstAmount,
					})),
				},
			},
			include: {
				items: {
					include: {
						product: {
							select: {
								id: true,
								name: true,
								sku: true,
							},
						},
					},
				},
			},
		});
	};

	if (input.tx) {
		return createOnce(input.tx);
	}

	for (let attempt = 0; attempt < 3; attempt += 1) {
		try {
			return await prisma.$transaction(async (tx) => createOnce(tx));
		} catch (error) {
			if (isUniqueConstraintError(error) && attempt < 2) {
				continue;
			}
			throw error;
		}
	}

	throw new InvoiceError(500, "Unable to generate unique invoice number");
};

export const createInvoiceFromEcommerceOrder = async (
	organizationId: string,
	orderId: string,
	options?: { tx?: Prisma.TransactionClient },
) => {
	if (!orderId?.trim()) {
		throw new InvoiceError(400, "orderId is required");
	}

	const existing = await (options?.tx ?? prisma).invoice.findFirst({
		where: { orderId: orderId.trim() },
		include: { items: true },
	});
	if (existing) {
		throw new InvoiceError(409, "Invoice already exists for this ecommerce order");
	}

	const order = await (options?.tx ?? prisma).order.findUnique({
		where: { id: orderId.trim() },
		include: {
			customer: {
				select: {
					stateCode: true,
				},
			},
			items: {
				include: {
					productListing: {
						include: {
							product: {
								select: {
									id: true,
									taxRate: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!order) {
		throw new InvoiceError(404, "Order not found");
	}

	if (order.organizationId !== organizationId) {
		throw new InvoiceError(403, "Order does not belong to this organization");
	}

	if (order.paymentStatus !== "PAID") {
		throw new InvoiceError(400, "Invoice can only be generated for PAID ecommerce orders");
	}

	const items = order.items.map((item) => ({
		productId: item.productListing.product.id,
		quantity: item.quantity,
		price: Number(item.unitPrice),
		gstRate: Number(item.productListing.product.taxRate ?? 0),
	}));

	return createInvoiceRecord({
		organizationId,
		orderId: order.id,
		customerId: order.customerId,
		customerStateCode: order.customer?.stateCode || null,
		status: "PAID",
		items,
		tx: options?.tx,
	});
};

export const createInvoiceDraftFromOrder = async (
	organizationId: string,
	orderId: string,
	options?: { tx?: Prisma.TransactionClient },
) => {
	if (!orderId?.trim()) {
		throw new InvoiceError(400, "orderId is required");
	}

	const existing = await (options?.tx ?? prisma).invoice.findFirst({
		where: { orderId: orderId.trim() },
		include: { items: true },
	});
	if (existing) {
		throw new InvoiceError(409, "Invoice already exists for this ecommerce order");
	}

	const order = await (options?.tx ?? prisma).order.findUnique({
		where: { id: orderId.trim() },
		include: {
			customer: {
				select: {
					stateCode: true,
				},
			},
			items: {
				include: {
					productListing: {
						include: {
							product: {
								select: {
									id: true,
									taxRate: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!order) {
		throw new InvoiceError(404, "Order not found");
	}

	if (order.organizationId !== organizationId) {
		throw new InvoiceError(403, "Order does not belong to this organization");
	}

	if (!order.items.length) {
		throw new InvoiceError(400, "Order has no items");
	}

	const items = order.items.map((item) => ({
		productId: item.productListing.product.id,
		quantity: item.quantity,
		price: Number(item.unitPrice),
		gstRate: Number(item.productListing.product.taxRate ?? 0),
	}));

	return createInvoiceRecord({
		organizationId,
		orderId: order.id,
		customerId: order.customerId,
		customerStateCode: order.customer?.stateCode || null,
		status: "DRAFT",
		items,
		tx: options?.tx,
	});
};

export const createInvoiceFromPOSOrder = async (
	organizationId: string,
	posOrderId: string,
	options?: { tx?: Prisma.TransactionClient },
) => {
	if (!posOrderId?.trim()) {
		throw new InvoiceError(400, "posOrderId is required");
	}

	const existing = await (options?.tx ?? prisma).invoice.findFirst({
		where: { posOrderId: posOrderId.trim() },
		include: { items: true },
	});
	if (existing) {
		throw new InvoiceError(409, "Invoice already exists for this POS order");
	}

	const posOrder = await (options?.tx ?? prisma).pOSOrder.findUnique({
		where: { id: posOrderId.trim() },
		include: {
			customer: {
				select: {
					stateCode: true,
				},
			},
			items: {
				include: {
					product: {
						select: {
							id: true,
							taxRate: true,
						},
					},
				},
			},
		},
	});

	if (!posOrder) {
		throw new InvoiceError(404, "POS order not found");
	}

	if (posOrder.organizationId !== organizationId) {
		throw new InvoiceError(403, "POS order does not belong to this organization");
	}

	if (posOrder.status !== "COMPLETED") {
		throw new InvoiceError(400, "Invoice can only be generated for completed POS orders");
	}

	const items = posOrder.items.map((item) => ({
		productId: item.product.id,
		quantity: item.quantity,
		price: Number(item.price),
		gstRate: Number(item.product.taxRate ?? 0),
	}));

	return createInvoiceRecord({
		organizationId,
		posOrderId: posOrder.id,
		customerId: posOrder.customerId,
		customerStateCode: posOrder.customer?.stateCode || null,
		status: "PAID",
		items,
		tx: options?.tx,
	});
};

export interface CreateManualInvoiceInput {
	customerId?: string;
	items: Array<{
		productId: string;
		quantity: number;
		price?: number;
		taxRate?: number;
	}>;
	status?: "DRAFT" | "ISSUED" | "PAID";
}

export const createManualInvoice = async (organizationId: string, input: CreateManualInvoiceInput) => {
	if (!Array.isArray(input.items) || input.items.length === 0) {
		throw new InvoiceError(400, "items are required");
	}

	// Get customer state if customerId provided
	let customerStateCode: string | null = null;
	if (input.customerId) {
		const customer = await prisma.contact.findUnique({
			where: { id: input.customerId },
			select: { stateCode: true },
		});
		customerStateCode = customer?.stateCode || null;
	}

	const productIds = input.items.map((item) => item.productId);
	const products = await prisma.product.findMany({
		where: {
			id: { in: productIds },
			organizationId,
			isActive: true,
		},
		select: {
			id: true,
			unitPrice: true,
			taxRate: true,
		},
	});

	if (products.length !== productIds.length) {
		throw new InvoiceError(400, "One or more products are invalid");
	}

	const productMap = new Map(products.map((product) => [product.id, product]));
	const normalized = input.items.map((item) => {
		if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
			throw new InvoiceError(400, "Item quantity must be an integer > 0");
		}
		const product = productMap.get(item.productId);
		if (!product) {
			throw new InvoiceError(400, `Invalid product ${item.productId}`);
		}
		return {
			productId: item.productId,
			quantity: item.quantity,
			price: toMoney(item.price ?? Number(product.unitPrice)),
			gstRate: toMoney(item.taxRate ?? Number(product.taxRate ?? 0)),
		};
	});

	return createInvoiceRecord({
		organizationId,
		customerId: input.customerId ?? null,
		customerStateCode,
		status: input.status ?? "DRAFT",
		items: normalized,
	});
};

const getTotalCreditsForInvoice = async (
	organizationId: string,
	invoiceId: string,
	tx?: Prisma.TransactionClient,
): Promise<number> => {
	const db = tx ?? prisma;
	const credits = await db.transaction.aggregate({
		where: {
			organizationId,
			type: "REFUND",
			referenceNumber: {
				startsWith: `CREDIT-NOTE-${invoiceId}`,
			},
		},
		_sum: {
			totalAmount: true,
		},
	});

	return toMoney(Number(credits._sum.totalAmount ?? 0));
};

export const listInvoices = async (
	organizationId: string,
	filters?: { status?: string; customerId?: string; overdueOnly?: boolean },
) => {
	const invoices = await prisma.invoice.findMany({
		where: {
			organizationId,
			...(filters?.status ? { status: filters.status } : {}),
			...(filters?.customerId ? { customerId: filters.customerId } : {}),
		},
		include: {
			customer: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					companyName: true,
					email: true,
				},
			},
			paymentAllocations: {
				select: {
					amount: true,
				},
			},
		},
		orderBy: [{ issuedAt: "desc" }],
	});

	const normalized = invoices.map((invoice) => {
		const allocatedAmount = toMoney(
			invoice.paymentAllocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0),
		);
		const outstandingAmount = toMoney(Number(invoice.totalAmount) - allocatedAmount);
		const daysSinceIssue = Math.floor((Date.now() - new Date(invoice.issuedAt).getTime()) / (1000 * 60 * 60 * 24));
		const isOverdue = outstandingAmount > 0 && daysSinceIssue > 30 && invoice.status !== "CANCELLED";

		return {
			id: invoice.id,
			invoiceNumber: invoice.invoiceNumber,
			status: invoice.status,
			issuedAt: invoice.issuedAt,
			totalAmount: Number(invoice.totalAmount),
			allocatedAmount,
			outstandingAmount,
			daysSinceIssue,
			isOverdue,
			customer: invoice.customer,
		};
	});

	if (filters?.overdueOnly) {
		return normalized.filter((invoice) => invoice.isOverdue);
	}

	return normalized;
};

export const getInvoiceFollowUps = async (organizationId: string, followUpAfterDays = 30) => {
	const invoices = await listInvoices(organizationId, { overdueOnly: false });
	return invoices
		.filter((invoice) => invoice.outstandingAmount > 0 && invoice.daysSinceIssue >= followUpAfterDays)
		.map((invoice) => ({
			invoiceId: invoice.id,
			invoiceNumber: invoice.invoiceNumber,
			customer: invoice.customer,
			outstandingAmount: invoice.outstandingAmount,
			daysSinceIssue: invoice.daysSinceIssue,
			recommendedAction:
				invoice.daysSinceIssue >= 60
					? "Send final reminder and assign collections task"
					: "Send payment reminder email",
		}));
};

export const createCreditNoteFromInvoice = async (
	organizationId: string,
	input: { invoiceId: string; amount?: number; reason?: string },
) => {
	if (!input.invoiceId?.trim()) {
		throw new InvoiceError(400, "invoiceId is required");
	}

	return prisma.$transaction(async (tx) => {
		const invoice = await tx.invoice.findUnique({
			where: { id: input.invoiceId.trim() },
			include: {
				paymentAllocations: {
					select: { amount: true },
				},
			},
		});

		if (!invoice) {
			throw new InvoiceError(404, "Invoice not found");
		}

		if (invoice.organizationId !== organizationId) {
			throw new InvoiceError(403, "Invoice does not belong to this organization");
		}

		if (invoice.status === "CANCELLED") {
			throw new InvoiceError(409, "Cancelled invoice cannot be credited");
		}

		const previouslyCredited = await getTotalCreditsForInvoice(organizationId, invoice.id, tx);
		const availableToCredit = toMoney(Number(invoice.totalAmount) - previouslyCredited);
		if (availableToCredit <= 0) {
			throw new InvoiceError(409, "Invoice is already fully credited");
		}

		const creditAmount = toMoney(input.amount ?? availableToCredit);
		if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
			throw new InvoiceError(400, "amount must be a positive number");
		}

		if (creditAmount > availableToCredit) {
			throw new InvoiceError(400, "Credit amount exceeds remaining invoice amount");
		}

		const allocatedAmount = toMoney(
			invoice.paymentAllocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0),
		);
		const isPaidFlow = allocatedAmount > 0 || invoice.status === "PAID";

		const { revenueLedgerId, receivableLedgerId, cashLedgerId } = await getRevenueAndReceivableLedgers(
			organizationId,
			tx,
		);

		const transaction = await createTransactionWithEntries(
			organizationId,
			"REFUND",
			`CREDIT-NOTE-${invoice.id}-${Date.now()}`,
			[
				{ ledgerAccountId: revenueLedgerId, debit: creditAmount },
				{
					ledgerAccountId: isPaidFlow ? cashLedgerId : receivableLedgerId,
					credit: creditAmount,
				},
			],
			{
				contactId: invoice.customerId ?? undefined,
				totalAmount: creditAmount,
				status: "POSTED",
				tx,
			},
		);

		const newCredited = toMoney(previouslyCredited + creditAmount);
		const newStatus = newCredited >= Number(invoice.totalAmount) ? "CREDIT_NOTED" : "PARTIALLY_CREDITED";

		const updatedInvoice = await tx.invoice.update({
			where: { id: invoice.id },
			data: {
				status: newStatus,
			},
			include: {
				items: true,
				customer: true,
			},
		});

		return {
			message: "Credit note posted successfully",
			reason: input.reason ?? null,
			creditAmount,
			creditedTotal: newCredited,
			invoice: updatedInvoice,
			refundTransactionId: transaction.id,
		};
	});
};

export const cancelInvoice = async (organizationId: string, invoiceId: string) => {
	if (!invoiceId?.trim()) {
		throw new InvoiceError(400, "invoiceId is required");
	}

	const invoice = await prisma.invoice.findUnique({
		where: { id: invoiceId.trim() },
		select: {
			id: true,
			organizationId: true,
			status: true,
			totalAmount: true,
			customerId: true,
			orderId: true,
			posOrderId: true,
		},
	});

	if (!invoice) {
		throw new InvoiceError(404, "Invoice not found");
	}

	if (invoice.organizationId !== organizationId) {
		throw new InvoiceError(403, "Invoice does not belong to this organization");
	}

	if (invoice.status === "CANCELLED") {
		throw new InvoiceError(409, "Invoice already cancelled");
	}

	return prisma.$transaction(async (tx) => {
		const { revenueLedgerId, receivableLedgerId, cashLedgerId } = await getRevenueAndReceivableLedgers(
			organizationId,
			tx,
		);

		if (invoice.posOrderId) {
			await createTransactionWithEntries(
				organizationId,
				"REFUND",
				`INVOICE-CANCEL-${invoice.id}`,
				[
					{ ledgerAccountId: revenueLedgerId, debit: Number(invoice.totalAmount) },
					{ ledgerAccountId: cashLedgerId, credit: Number(invoice.totalAmount) },
				],
				{
					contactId: invoice.customerId ?? undefined,
					totalAmount: Number(invoice.totalAmount),
					status: "POSTED",
					tx,
				},
			);
		} else {
			await createTransactionWithEntries(
				organizationId,
				"REFUND",
				`INVOICE-CANCEL-${invoice.id}`,
				[
					{ ledgerAccountId: revenueLedgerId, debit: Number(invoice.totalAmount) },
					{ ledgerAccountId: receivableLedgerId, credit: Number(invoice.totalAmount) },
				],
				{
					contactId: invoice.customerId ?? undefined,
					totalAmount: Number(invoice.totalAmount),
					status: "POSTED",
					tx,
				},
			);
		}

		return tx.invoice.update({
			where: { id: invoice.id },
			data: {
				status: "CANCELLED",
			},
			include: {
				items: {
					include: {
						product: {
							select: { id: true, name: true, sku: true },
						},
					},
				},
			},
		});
	});
};

export const getInvoiceById = async (organizationId: string, invoiceId: string) => {
	const invoice = await prisma.invoice.findUnique({
		where: { id: invoiceId },
		include: {
			customer: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					companyName: true,
					email: true,
					phone: true,
					gstNumber: true,
					billingAddress: true,
				},
			},
			organization: {
				select: {
					id: true,
					name: true,
				},
			},
			items: {
				include: {
					product: {
						select: {
							id: true,
							name: true,
							sku: true,
						},
					},
				},
			},
		},
	});

	if (!invoice) {
		throw new InvoiceError(404, "Invoice not found");
	}

	if (invoice.organizationId !== organizationId) {
		throw new InvoiceError(403, "Invoice does not belong to this organization");
	}

	return invoice;
};

const drawInvoiceHeader = (
	doc: PDFKit.PDFDocument,
	invoice: Awaited<ReturnType<typeof getInvoiceById>>,
	template: "classic" | "minimal" | "detailed",
) => {
	if (template === "minimal") {
		doc.fontSize(20).text(invoice.invoiceNumber, { align: "left" });
		doc.fontSize(10).text(`Date ${invoice.issuedAt.toISOString().slice(0, 10)}`);
		doc.moveDown(0.8);
		return;
	}

	if (template === "detailed") {
		doc.fontSize(18).text("TAX INVOICE", { align: "center" });
		doc.moveDown(0.7);
		doc.fontSize(11).text(`Invoice Number: ${invoice.invoiceNumber}`);
		doc.text(`Issued At: ${invoice.issuedAt.toISOString()}`);
		doc.text(`Status: ${invoice.status}`);
		doc.text(`Template: Detailed`);
		doc.text(`Source: ${invoice.orderId ? "Ecommerce" : invoice.posOrderId ? "POS" : "Manual"}`);
		doc.moveDown(1);
		return;
	}

	doc.fontSize(18).text("TAX INVOICE", { align: "center" });
	doc.moveDown(1);
	doc.fontSize(11).text(`Invoice Number: ${invoice.invoiceNumber}`);
	doc.text(`Issued At: ${invoice.issuedAt.toISOString()}`);
	doc.text(`Status: ${invoice.status}`);
	doc.text(`Source: ${invoice.orderId ? "Ecommerce" : invoice.posOrderId ? "POS" : "Manual"}`);
	doc.moveDown(1);
};

export const generateInvoicePDF = async (
	organizationId: string,
	invoiceId: string,
	options?: { template?: "classic" | "minimal" | "detailed" },
) => {
	const invoice = await getInvoiceById(organizationId, invoiceId);
	const template = options?.template ?? "classic";

	const doc = new PDFDocument({ size: "A4", margin: 40 });
	const chunks: Buffer[] = [];
	doc.on("data", (chunk) => chunks.push(chunk as Buffer));

	const done = new Promise<Buffer>((resolve, reject) => {
		doc.on("end", () => resolve(Buffer.concat(chunks)));
		doc.on("error", reject);
	});

	drawInvoiceHeader(doc, invoice, template);

	doc.fontSize(12).text(`Company: ${invoice.organization.name}`);
	doc.fontSize(10).text(template === "minimal" ? "GST: -" : "GST Number: N/A");
	doc.moveDown(1);

	const customerName =
		invoice.customer?.companyName ||
		`${invoice.customer?.firstName ?? ""} ${invoice.customer?.lastName ?? ""}`.trim() ||
		"Walk-in Customer";

	doc.fontSize(12).text(`Customer: ${customerName}`);
	doc.fontSize(10).text(`Customer GST: ${invoice.customer?.gstNumber ?? "N/A"}`);
	doc.text(`Customer Email: ${invoice.customer?.email ?? "N/A"}`);
	doc.text(`Billing Address: ${invoice.customer?.billingAddress ?? "N/A"}`);
	doc.moveDown(1);

	doc.fontSize(10).text("Items", { underline: true });
	doc.moveDown(0.5);
	for (const item of invoice.items) {
		const lineSubtotal = toMoney(Number(item.price) * item.quantity);
		const lineGST = toMoney(
			Number(item.cgstAmount) + Number(item.sgstAmount) + Number(item.igstAmount),
		);
		if (template === "minimal") {
			doc.text(
				`${item.product.name}  Qty ${item.quantity}  Rate ${Number(item.price).toFixed(2)}  Line ${lineSubtotal.toFixed(2)}`,
			);
		} else {
			doc.text(
				`${item.product.name} (${item.product.sku})  Qty: ${item.quantity}  Price: ${Number(item.price).toFixed(2)}  GST%: ${Number(item.gstRate).toFixed(2)}  CGST: ${Number(item.cgstAmount).toFixed(2)}  SGST: ${Number(item.sgstAmount).toFixed(2)}  IGST: ${Number(item.igstAmount).toFixed(2)}  GST: ${lineGST.toFixed(2)}  Line: ${lineSubtotal.toFixed(2)}`,
			);
		}
	}

	doc.moveDown(1);
	doc.fontSize(11).text(`Subtotal: ${Number(invoice.subtotal).toFixed(2)}`, { align: "right" });
	doc.text(`CGST: ${Number(invoice.cgstAmount).toFixed(2)}`, { align: "right" });
	doc.text(`SGST: ${Number(invoice.sgstAmount).toFixed(2)}`, { align: "right" });
	doc.text(`IGST: ${Number(invoice.igstAmount).toFixed(2)}`, { align: "right" });
	doc.text(`Total Amount: ${Number(invoice.totalAmount).toFixed(2)}`, { align: "right" });
	if (template === "detailed") {
		doc.moveDown(0.8);
		doc.fontSize(9).text("Notes: This invoice is system generated and valid without physical signature.");
	}

	doc.moveDown(2);
	doc.text("Authorized Signature", { align: "right" });
	doc.end();

	const buffer = await done;
	return {
		invoice,
		buffer,
		fileName: `${invoice.invoiceNumber}-${template}.pdf`,
	};
};
