export type OnboardingState = {
	organizationId: string;
	profileCompleted: boolean;
	paymentCardOnboarded: boolean;
	preferredCurrency: string;
	stackSelections: Record<string, string>;
	onboardingPayload: Record<string, unknown>;
	cardDetails?: PaymentCardDetails;
	updatedAt: string;
};

export type OrgProfileResponse = {
	id: string;
	name: string;
	legalName: string | null;
	panNumber: string | null;
	businessType: string | null;
	supportEmail: string | null;
	supportPhone: string | null;
	addressLine1: string | null;
	addressLine2: string | null;
	city: string | null;
	state: string | null;
	pincode: string | null;
	country: string | null;
};

export type MeResponse = {
	user?: {
		email?: string | null;
	};
	organization?: OrgProfileResponse;
};

export type SubscriptionSnapshot = {
	id: string;
	organizationId: string;
	planId: string;
	status: string;
};

export type PlanSummary = {
	id: string;
	name: string;
	price: number | string;
	currency: string;
	interval: string;
	maxUsers?: number;
};

export type AddOn = {
	code: string;
	label: string;
	amount: number;
};

export type TechOption = {
	code: string;
	label: string;
	amount: number;
};

export type TechCategory = {
	id: string;
	label: string;
	description: string;
	options: TechOption[];
};

export type TechStackResponse = {
	addOns: AddOn[];
	categories: TechCategory[];
};

export type OrganizationForm = {
	name: string;
	legalName: string;
	panNumber: string;
	businessType: string;
	supportEmail: string;
	supportPhone: string;
	addressLine1: string;
	addressLine2: string;
	city: string;
	state: string;
	pincode: string;
	country: string;
};

export type RazorpayBilling = {
	name: string;
	email: string;
	phone: string;
};

export type PaymentCardDetails = {
	cardType: "CREDIT" | "DEBIT";
	cardHolderName: string;
	cardNumber?: string;
	cardNumberLast4: string;
	cardBrand: "VISA" | "MASTERCARD" | "RUPAY" | "AMEX" | "OTHER";
	expiryMonth: string;
	expiryYear: string;
	cvv?: string;
	billingZip?: string;
	autoPayConsent?: boolean;
};

export type OnboardingPayload = {
	selectedPlanId?: string;
	selectedAddOns?: string[];
	razorpayBilling?: RazorpayBilling;
	razorpayOrderId?: string;
	razorpayPaymentId?: string;
	cardDetails?: PaymentCardDetails;
	paymentCard?: PaymentCardDetails;
};

export type OnboardingUpdateRequest = {
	profileCompleted: boolean;
	paymentCardOnboarded?: boolean;
	preferredCurrency: string;
	stackSelections: Record<string, string>;
	onboardingPayload: OnboardingPayload;
	cardDetails?: PaymentCardDetails;
};

export type RazorpayOrder = {
	id: string;
	amount: number;
	currency: string;
	keyId?: string;
};

export type RazorpayVerifyPayload = {
	razorpay_order_id: string;
	razorpay_payment_id: string;
	razorpay_signature: string;
};

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export type PricingInput = {
	planPrice: number;
	selectedAddOnCodes: string[];
	addOns: AddOn[];
	stackSelections: Record<string, string>;
	categories: TechCategory[];
};
