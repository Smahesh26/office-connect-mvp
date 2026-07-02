"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEInvoiceJSON = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const gst_service_1 = require("./gst.service");
const toMoney = (value) => Number(value.toFixed(2));
const formatDateDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};
const getContactDisplayName = (customer) => {
    var _a, _b, _c;
    if (!customer) {
        return "Unknown Buyer";
    }
    if ((_a = customer.companyName) === null || _a === void 0 ? void 0 : _a.trim()) {
        return customer.companyName.trim();
    }
    const fullName = `${(_b = customer.firstName) !== null && _b !== void 0 ? _b : ""} ${(_c = customer.lastName) !== null && _c !== void 0 ? _c : ""}`.trim();
    return fullName || "Unknown Buyer";
};
const generateEInvoiceJSON = (invoiceId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (!(invoiceId === null || invoiceId === void 0 ? void 0 : invoiceId.trim())) {
        throw new gst_service_1.GSTError(400, "invoiceId is required");
    }
    if (!(organizationId === null || organizationId === void 0 ? void 0 : organizationId.trim())) {
        throw new gst_service_1.GSTError(400, "organizationId is required");
    }
    const [invoice, gstConfig] = yield Promise.all([
        prisma_1.default.invoice.findUnique({
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
        (0, gst_service_1.getGSTConfig)(organizationId.trim()),
    ]);
    if (!invoice) {
        throw new gst_service_1.GSTError(404, "Invoice not found");
    }
    if (invoice.organizationId !== organizationId.trim()) {
        throw new gst_service_1.GSTError(403, "Invoice does not belong to this organization");
    }
    if (!((_b = (_a = invoice.customer) === null || _a === void 0 ? void 0 : _a.gstNumber) === null || _b === void 0 ? void 0 : _b.trim())) {
        throw new gst_service_1.GSTError(400, "Buyer GSTIN is required for NIC e-invoice JSON");
    }
    const buyerStateCode = invoice.customer.stateCode || invoice.placeOfSupply;
    if (!(buyerStateCode === null || buyerStateCode === void 0 ? void 0 : buyerStateCode.trim())) {
        throw new gst_service_1.GSTError(400, "Buyer state code/place of supply is required for NIC e-invoice JSON");
    }
    if (invoice.items.length === 0) {
        throw new gst_service_1.GSTError(400, "Invoice must have at least one item");
    }
    const itemList = invoice.items.map((item, index) => {
        var _a;
        if (!((_a = item.product.hsnCode) === null || _a === void 0 ? void 0 : _a.trim())) {
            throw new gst_service_1.GSTError(400, `HSN code missing for product '${item.product.name}'. Update product before e-invoice export.`);
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
    const isB2B = Boolean((_d = (_c = invoice.customer) === null || _c === void 0 ? void 0 : _c.gstNumber) === null || _d === void 0 ? void 0 : _d.trim());
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
});
exports.generateEInvoiceJSON = generateEInvoiceJSON;
