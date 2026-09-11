"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const razorpay_virtual_account_provider_1 = require("./razorpay-virtual-account.provider");
class SettlementProviderFactory {
    static getProvider() {
        if (!this.instance) {
            this.instance = new razorpay_virtual_account_provider_1.RazorpayVirtualAccountProvider();
        }
        return this.instance;
    }
    static setProvider(provider) {
        this.instance = provider;
    }
}
SettlementProviderFactory.instance = null;
exports.default = SettlementProviderFactory;
