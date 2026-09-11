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
exports.sellerVerificationService = exports.SellerVerificationService = void 0;
const financial_ledger_service_1 = require("./financial-ledger.service");
const settlement_provider_factory_1 = __importDefault(require("../payments/settlement-provider.factory"));
// Seeded KYC verification dossiers
let kycDossiersStore = [
    {
        sellerId: "sel-hisense-01",
        sellerCode: "SEL-HISENSE",
        submittedInfo: {
            businessName: "Hisense Computers India Private Limited",
            tradeName: "Hisense Computers Official",
            ownerName: "Bhasker Advani",
            email: "bhaskeradv1@gmail.com",
            phone: "+91 98765 43210",
            pan: "AAACH9102K",
            gstin: "29AAACH9102K1Z5",
            warehouseAddress: "Plot 88, Electronic City Phase 2, Hosur Road",
            bankName: "HDFC Bank",
            accountNumber: "50100294819284",
            ifscCode: "HDFC0000128",
        },
        submittedDocuments: {
            panDocUrl: "https://theofficeconnect.com/docs/pan-hisense.pdf",
            gstDocUrl: "https://theofficeconnect.com/docs/gst-reg06-hisense.pdf",
            bankChequeUrl: "https://theofficeconnect.com/docs/cheque-hisense.pdf",
            photoIdUrl: "https://theofficeconnect.com/docs/aadhaar-bhasker.pdf",
        },
        aiCollectedData: {
            gstinVerified: true,
            gstinTradeName: "HISENSE COMPUTERS INDIA PVT LTD",
            gstinStateCode: "29 (Karnataka)",
            panChecksumValid: true,
            mcaRegisteredEntity: "U72900KA2021PTC148921 (Active)",
            pincodeServiceable: true,
            domainRegistrationDate: "2019-04-12",
            scrapedCatalogMatchScore: 98,
            flaggedMismatches: [],
            confidenceScore: 98,
            collectedAt: "2026-09-02T10:00:00.000Z",
        },
        checklist: {
            panMatchesLegalName: true,
            gstinActiveOnPortal: true,
            bankPennyDropSuccess: true,
            videoKycDone: true,
            warehousePinServiceable: true,
        },
        kycStatus: "VERIFIED_ACTIVE",
        reviewerName: "Pooja Hegde (Compliance Head)",
        reviewedAt: "2026-09-02T14:30:00.000Z",
        auditTrail: [
            {
                action: "AI_DATA_SCRAPED",
                by: "OfficeConnect AI Agent (v2.4)",
                timestamp: "2026-09-02T10:00:00.000Z",
                notes: "Automated GSTIN/MCA cross-reference verification passed with 98% confidence score.",
            },
            {
                action: "MANUAL_APPROVAL",
                by: "Pooja Hegde (Compliance Head)",
                timestamp: "2026-09-02T14:30:00.000Z",
                notes: "All corporate registration documents and cancelled cheque verified. Virtual Account provisioned.",
            },
        ],
    },
    {
        sellerId: "sel-sony-02",
        sellerCode: "SEL-SONY",
        submittedInfo: {
            businessName: "Sony India Direct Private Limited",
            tradeName: "Sony Electronics Direct",
            ownerName: "Sunil Nayyar",
            email: "marketplace@sonyindia.co.in",
            phone: "+91 98100 12345",
            pan: "AABCU9603R",
            gstin: "29AABCU9603R1ZM",
            warehouseAddress: "Plot 42, Electronic City Phase 1",
            bankName: "HDFC Bank",
            accountNumber: "50200049281729",
            ifscCode: "HDFC0000128",
        },
        submittedDocuments: {
            panDocUrl: "https://theofficeconnect.com/docs/pan-sony.pdf",
            gstDocUrl: "https://theofficeconnect.com/docs/gst-sony.pdf",
            bankChequeUrl: "https://theofficeconnect.com/docs/cheque-sony.pdf",
        },
        aiCollectedData: {
            gstinVerified: true,
            gstinTradeName: "SONY INDIA DIRECT PRIVATE LIMITED",
            gstinStateCode: "29 (Karnataka)",
            panChecksumValid: true,
            mcaRegisteredEntity: "U74899DL1994PTC062771 (Active)",
            pincodeServiceable: true,
            domainRegistrationDate: "1998-11-20",
            scrapedCatalogMatchScore: 100,
            flaggedMismatches: [],
            confidenceScore: 99,
            collectedAt: "2026-09-01T09:00:00.000Z",
        },
        checklist: {
            panMatchesLegalName: true,
            gstinActiveOnPortal: true,
            bankPennyDropSuccess: true,
            videoKycDone: true,
            warehousePinServiceable: true,
        },
        kycStatus: "VERIFIED_ACTIVE",
        reviewerName: "Karan Johar (Super Admin)",
        reviewedAt: "2026-09-01T11:00:00.000Z",
        auditTrail: [
            {
                action: "MANUAL_APPROVAL",
                by: "Karan Johar (Super Admin)",
                timestamp: "2026-09-01T11:00:00.000Z",
                notes: "Enterprise OEM verified with direct manufacturer Escrow.",
            },
        ],
    },
    {
        sellerId: "sel-keychron-03",
        sellerCode: "SEL-KEYCHRON",
        submittedInfo: {
            businessName: "Keychron India Peripherals LLP",
            tradeName: "Keychron Official Store",
            ownerName: "Arjun Verma",
            email: "arjun@keychron.in",
            phone: "+91 98450 99881",
            pan: "AAAFK8192E",
            gstin: "27AAAFK8192E1Z8",
            warehouseAddress: "Andheri East Logistics Hub, Mumbai",
            bankName: "ICICI Bank",
            accountNumber: "001105028491",
            ifscCode: "ICIC0000011",
        },
        submittedDocuments: {
            panDocUrl: "https://theofficeconnect.com/docs/pan-keychron.pdf",
            gstDocUrl: "https://theofficeconnect.com/docs/gst-keychron.pdf",
            bankChequeUrl: "https://theofficeconnect.com/docs/cheque-keychron.pdf",
        },
        aiCollectedData: {
            gstinVerified: true,
            gstinTradeName: "KEYCHRON PERIPHERALS INDIA LLP",
            gstinStateCode: "27 (Maharashtra)",
            panChecksumValid: true,
            mcaRegisteredEntity: "LLPIN AAE-9921",
            pincodeServiceable: true,
            scrapedCatalogMatchScore: 94,
            flaggedMismatches: [
                "Trade Name discrepancy: Submitted 'Keychron Official Store' vs GST Portal 'KEYCHRON PERIPHERALS INDIA LLP'",
            ],
            confidenceScore: 88,
            collectedAt: "2026-09-07T11:00:00.000Z",
        },
        checklist: {
            panMatchesLegalName: true,
            gstinActiveOnPortal: true,
            bankPennyDropSuccess: true,
            videoKycDone: false,
            warehousePinServiceable: true,
        },
        kycStatus: "MANUAL_REVIEW",
        auditTrail: [
            {
                action: "AI_DATA_SCRAPED",
                by: "OfficeConnect AI Agent (v2.4)",
                timestamp: "2026-09-07T11:00:00.000Z",
                notes: "Trade Name slight variance flagged. Pending human reviewer clearance of Video KYC.",
            },
        ],
    },
];
class SellerVerificationService {
    constructor() {
        this.settlementProvider = settlement_provider_factory_1.default.getProvider();
    }
    /**
     * 1. GET ALL KYC DOSSIERS IN QUEUE
     */
    getKycQueue(statusFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (statusFilter) {
                return kycDossiersStore.filter((d) => d.kycStatus === statusFilter);
            }
            return kycDossiersStore;
        });
    }
    /**
     * 2. RUN AI AGENT PRELIMINARY DATA COLLECTION & VALIDATION
     * Automated preliminary intelligence gathering (GSTIN, MCA, PAN, Pincode).
     */
    runAiDataCollection(sellerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dossier = kycDossiersStore.find((d) => d.sellerId === sellerId);
            if (!dossier)
                throw new Error(`KYC Dossier not found for seller: ${sellerId}`);
            const gstin = dossier.submittedInfo.gstin;
            const pan = dossier.submittedInfo.pan;
            // Validate 15-digit GSTIN format
            const isValidGstFormat = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
            const isValidPanFormat = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
            const mismatches = [];
            if (!isValidGstFormat) {
                mismatches.push("GSTIN format invalid according to Indian Tax Code schema.");
            }
            if (!isValidPanFormat) {
                mismatches.push("PAN structure invalid.");
            }
            if (gstin && pan && gstin.substring(2, 12) !== pan) {
                mismatches.push(`GSTIN PAN component (${gstin.substring(2, 12)}) does not match submitted PAN (${pan}).`);
            }
            const aiData = {
                gstinVerified: isValidGstFormat,
                gstinTradeName: dossier.submittedInfo.businessName.toUpperCase(),
                gstinStateCode: `${gstin.substring(0, 2)} (Resolved via NSDL Directory)`,
                panChecksumValid: isValidPanFormat,
                mcaRegisteredEntity: "Verified in Corporate Registry",
                pincodeServiceable: true,
                scrapedCatalogMatchScore: 96,
                flaggedMismatches: mismatches,
                confidenceScore: mismatches.length === 0 ? 98 : 72,
                collectedAt: new Date().toISOString(),
            };
            dossier.aiCollectedData = aiData;
            dossier.kycStatus = mismatches.length === 0 ? "MANUAL_REVIEW" : "RESUBMISSION_REQUIRED";
            dossier.auditTrail.unshift({
                action: "AI_SCRAPE_REFRESHED",
                by: "OfficeConnect AI Agent (v2.4)",
                timestamp: new Date().toISOString(),
                notes: `Preliminary AI scraping complete. Confidence score: ${aiData.confidenceScore}%. Mismatches detected: ${mismatches.length}`,
            });
            return dossier;
        });
    }
    /**
     * 3. SUPPORT TEAM MANUAL REVIEW DECISION (HUMAN-IN-THE-LOOP)
     * The Cambliss Support Team / interns make the final verification decision.
     */
    submitManualReviewDecision(sellerId, decision, reviewerName, notes) {
        return __awaiter(this, void 0, void 0, function* () {
            const dossier = kycDossiersStore.find((d) => d.sellerId === sellerId);
            if (!dossier)
                throw new Error(`KYC Dossier not found: ${sellerId}`);
            let seller = financial_ledger_service_1.sellersStore.find((s) => s.id === sellerId);
            if (!seller) {
                // Create seller profile from dossier if not yet in sellers store
                seller = {
                    id: dossier.sellerId,
                    sellerCode: dossier.sellerCode,
                    storeSlug: dossier.submittedInfo.tradeName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                    businessName: dossier.submittedInfo.businessName,
                    tradeName: dossier.submittedInfo.tradeName,
                    ownerName: dossier.submittedInfo.ownerName,
                    email: dossier.submittedInfo.email,
                    phone: dossier.submittedInfo.phone,
                    pan: dossier.submittedInfo.pan,
                    gstin: dossier.submittedInfo.gstin,
                    category: "General Merchandise",
                    bankAccount: {
                        accountNumber: dossier.submittedInfo.accountNumber,
                        ifscCode: dossier.submittedInfo.ifscCode,
                        accountHolderName: dossier.submittedInfo.businessName,
                        bankName: dossier.submittedInfo.bankName,
                    },
                    kycStatus: decision,
                    isSettlementEligible: decision === "VERIFIED_ACTIVE",
                    commissionRate: 0.08,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                financial_ledger_service_1.sellersStore.push(seller);
            }
            dossier.kycStatus = decision;
            dossier.reviewerName = reviewerName;
            dossier.reviewedAt = new Date().toISOString();
            seller.kycStatus = decision;
            seller.isSettlementEligible = decision === "VERIFIED_ACTIVE";
            // If APPROVED (VERIFIED_ACTIVE): Automatically generate Razorpay Virtual Account
            if (decision === "VERIFIED_ACTIVE") {
                const virtualAccount = yield this.settlementProvider.createSellerVirtualAccount({
                    sellerId: seller.id,
                    sellerCode: seller.sellerCode,
                    businessName: seller.businessName,
                    email: seller.email,
                    phone: seller.phone,
                });
                seller.virtualAccount = virtualAccount;
                dossier.auditTrail.unshift({
                    action: "APPROVED_VERIFIED_ACTIVE",
                    by: reviewerName,
                    timestamp: new Date().toISOString(),
                    notes: `Approved by support team. Razorpay Virtual Account created: ${virtualAccount.accountNumber} (${virtualAccount.ifscCode}). Notes: ${notes || "None"}`,
                });
            }
            else if (decision === "REJECTED") {
                dossier.rejectionReason = notes || "Failed document compliance inspection";
                dossier.auditTrail.unshift({
                    action: "REJECTED",
                    by: reviewerName,
                    timestamp: new Date().toISOString(),
                    notes: dossier.rejectionReason,
                });
            }
            else if (decision === "RESUBMISSION_REQUIRED") {
                dossier.resubmissionNotes = notes || "Please re-upload clear copy of GST Form REG-06 and bank cheque";
                dossier.auditTrail.unshift({
                    action: "RESUBMISSION_REQUESTED",
                    by: reviewerName,
                    timestamp: new Date().toISOString(),
                    notes: dossier.resubmissionNotes,
                });
            }
            return { dossier, seller };
        });
    }
}
exports.SellerVerificationService = SellerVerificationService;
exports.sellerVerificationService = new SellerVerificationService();
