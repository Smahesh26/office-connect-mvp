import prisma from "../../config/prisma";
import { GSTError, getGSTConfig } from "./gst.service";

const toMoney = (value: number) => Number(value.toFixed(2));

const formatDateDDMMYYYY = (date: Date) => {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
};

const getContactDisplayName = (
	customer: {
		companyName: string | null;
		firstName: string | null;
		lastName: string | null;
	} | null,
) => {
	if (!customer) {
		return "Unknown Buyer";
	}
	if (customer.companyName?.trim()) {
		return customer.companyName.trim();
	}
	const fullName = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
	return fullName || "Unknown Buyer";
};

export interface NICItem {
	SlNo: string;
	PrdDesc: string;
	IsServc: "N" | "Y";
	HsnCd: string;
	Qty: number;
	Unit: string;
	UnitPrice: number;
	TotAmt: number;
	AssAmt: number;
	GstRt: number;
	IgstAmt: number;
	CgstAmt: number;
	SgstAmt: number;
	TotItemVal: number;
}

export interface NICEInvoiceJSON {
	Version: "1.1";
	TranDtls: {
		TaxSch: "GST";
		SupTyp: "B2B" | "B2C";
	};
	DocDtls: {
		Typ: "INV";
		No: string;
		Dt: string;
	};
	SellerDtls: {
		Gstin: string;
		LglNm: string;
		TrdNm?: string;
		Stcd: string;
	};
	BuyerDtls: {
		Gstin: string;
		LglNm: string;
		Pos: string;
	};
	ItemList: NICItem[];
	ValDtls: {
		AssVal: number;
		CgstVal: number;
		SgstVal: number;
		IgstVal: number;
		TotInvVal: number;
	};
	PreviewQrData: string;
}

export const generateEInvoiceJSON = async (
	invoiceId: string,
	organizationId: string,
): Promise<NICEInvoiceJSON> => {
	if (!invoiceId?.trim()) {
		throw new GSTError(400, "invoiceId is required");
	}
	if (!organizationId?.trim()) {
		throw new GSTError(400, "organizationId is required");
	}

	const [invoice, gstConfig] = await Promise.all([
		prisma.invoice.findUnique({
			where: { id: invoiceId.trim() },
			include: {
				organization: {
					select: {
						id: true,
						name: true,
					},
				},
				customer: {
					select: {
						gstNumber: true,
						companyName: true,
						firstName: true,
						lastName: true,
						stateCode: true,
					},
				},
				items: {
					include: {
						product: {
							select: {
								name: true,
								hsnCode: true,
							},
						},
					},
					orderBy: { id: "asc" },
				},
			},
		}),
		getGSTConfig(organizationId.trim()),
	]);

	if (!invoice) {
		throw new GSTError(404, "Invoice not found");
	}

	if (invoice.organizationId !== organizationId.trim()) {
		throw new GSTError(403, "Invoice does not belong to this organization");
	}

	if (!invoice.customer?.gstNumber?.trim()) {
		throw new GSTError(400, "Buyer GSTIN is required for NIC e-invoice JSON");
	}

	const buyerStateCode = invoice.customer.stateCode || invoice.placeOfSupply;
	if (!buyerStateCode?.trim()) {
		throw new GSTError(400, "Buyer state code/place of supply is required for NIC e-invoice JSON");
	}

	if (invoice.items.length === 0) {
		throw new GSTError(400, "Invoice must have at least one item");
	}

	const itemList: NICItem[] = invoice.items.map((item, index) => {
		if (!item.product.hsnCode?.trim()) {
			throw new GSTError(
				400,
				`HSN code missing for product '${item.product.name}'. Update product before e-invoice export.`,
			);
		}

		const qty = item.quantity;
		const unitPrice = toMoney(Number(item.price));
		const taxableAmount = toMoney(unitPrice * qty);
		const igstAmt = toMoney(Number(item.igstAmount));
		const cgstAmt = toMoney(Number(item.cgstAmount));
		const sgstAmt = toMoney(Number(item.sgstAmount));
		const totalItemValue = toMoney(taxableAmount + igstAmt + cgstAmt + sgstAmt);

		return {
			SlNo: String(index + 1),
			PrdDesc: item.product.name,
			IsServc: "N",
			HsnCd: item.product.hsnCode,
			Qty: qty,
			Unit: "NOS",
			UnitPrice: unitPrice,
			TotAmt: taxableAmount,
			AssAmt: taxableAmount,
			GstRt: toMoney(Number(item.gstRate)),
			IgstAmt: igstAmt,
			CgstAmt: cgstAmt,
			SgstAmt: sgstAmt,
			TotItemVal: totalItemValue,
		};
	});

	const assVal = toMoney(Number(invoice.subtotal));
	const cgstVal = toMoney(Number(invoice.cgstAmount));
	const sgstVal = toMoney(Number(invoice.sgstAmount));
	const igstVal = toMoney(Number(invoice.igstAmount));
	const totalInvoiceValue = toMoney(Number(invoice.totalAmount));

	const buyerName = getContactDisplayName(invoice.customer);
	const isB2B = Boolean(invoice.customer?.gstNumber?.trim());

	return {
		Version: "1.1",
		TranDtls: {
			TaxSch: "GST",
			SupTyp: isB2B ? "B2B" : "B2C",
		},
		DocDtls: {
			Typ: "INV",
			No: invoice.invoiceNumber,
			Dt: formatDateDDMMYYYY(invoice.issuedAt),
		},
		SellerDtls: {
			Gstin: gstConfig.gstNumber,
			LglNm: gstConfig.legalName,
			TrdNm: gstConfig.tradeName || undefined,
			Stcd: gstConfig.stateCode,
		},
		BuyerDtls: {
			Gstin: invoice.customer.gstNumber,
			LglNm: buyerName,
			Pos: buyerStateCode,
		},
		ItemList: itemList,
		ValDtls: {
			AssVal: assVal,
			CgstVal: cgstVal,
			SgstVal: sgstVal,
			IgstVal: igstVal,
			TotInvVal: totalInvoiceValue,
		},
		PreviewQrData: `${invoice.invoiceNumber}|${gstConfig.gstNumber}|${totalInvoiceValue.toFixed(2)}`,
	};
};
