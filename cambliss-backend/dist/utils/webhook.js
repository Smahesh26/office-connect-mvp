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
exports.syncContactToAccountech = void 0;
const axios_1 = __importDefault(require("axios"));
// In production, this should be in an environment variable
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "OfficeConnectWebhookSecret123!";
const ACCOUNTECH_WEBHOOK_URL = process.env.ACCOUNTECH_WEBHOOK_URL || "http://localhost:4001/api/webhooks";
/**
 * Sends contact details to Accountech via Webhook
 */
const syncContactToAccountech = (contact) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only sync CUSTOMER type contacts
        if (contact.type !== "CUSTOMER") {
            return;
        }
        console.log(`[Webhook] Syncing contact ${contact.id} to Accountech...`);
        yield axios_1.default.post(`${ACCOUNTECH_WEBHOOK_URL}/officeconnect/customer`, {
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            companyName: contact.companyName,
        }, {
            headers: {
                "x-webhook-secret": WEBHOOK_SECRET,
            },
            timeout: 5000 // Don't hang forever
        });
        console.log(`[Webhook] Successfully synced contact ${contact.id} to Accountech.`);
    }
    catch (error) {
        console.error(`[Webhook Error] Failed to sync contact to Accountech:`, error.message);
    }
});
exports.syncContactToAccountech = syncContactToAccountech;
