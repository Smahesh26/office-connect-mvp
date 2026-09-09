import {
  SellerProfile,
  RazorpayVirtualAccountInfo,
  SellerSettlement,
} from "../ecommerce/financial-ledger.types";

export interface CreateVirtualAccountParams {
  sellerId: string;
  sellerCode: string;
  businessName: string;
  email: string;
  phone: string;
}

export interface InitiatePayoutParams {
  settlementId: string;
  sellerCode: string;
  sellerName: string;
  virtualAccountId: string;
  bankAccountNo: string;
  bankIfsc: string;
  amount: number;
  currency: string;
  narration?: string;
}

export interface PayoutResult {
  success: boolean;
  providerReference: string;
  status: "PENDING" | "PROCESSED" | "FAILED";
  processedAt?: string;
  failureReason?: string;
}

export interface CustomerRefundParams {
  paymentId: string;
  amount: number;             // Amount in rupees
  currency?: string;
  speed?: "normal" | "optimum";
  notes?: Record<string, string>;
  idempotencyKey?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: "PENDING" | "PROCESSED" | "FAILED";
  providerReference?: string;
  failureReason?: string;
}

export interface ISettlementProvider {
  createSellerVirtualAccount(
    params: CreateVirtualAccountParams
  ): Promise<RazorpayVirtualAccountInfo>;

  initiateSellerPayout(
    params: InitiatePayoutParams
  ): Promise<PayoutResult>;

  initiateCustomerRefund(
    params: CustomerRefundParams
  ): Promise<RefundResult>;

  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    webhookSecret?: string
  ): boolean;
}
