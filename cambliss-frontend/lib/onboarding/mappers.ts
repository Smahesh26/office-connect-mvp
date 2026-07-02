import { DEFAULT_ORGANIZATION_FORM } from "./constants";
import type {
	MeResponse,
	OnboardingPayload,
	OnboardingState,
	OnboardingUpdateRequest,
	OrgProfileResponse,
	OrganizationForm,
	RazorpayBilling,
	TechStackResponse,
} from "./types";

export const toText = (value: unknown): string => (typeof value === "string" ? value : "");

export const toRecord = (value: unknown): Record<string, string> => {
	if (!value || typeof value !== "object") {
		return {};
	}

	const record: Record<string, string> = {};
	for (const [key, item] of Object.entries(value)) {
		if (typeof item === "string") {
			record[key] = item;
		}
	}

	return record;
};

export const toStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((item): item is string => typeof item === "string");
};

export const mapOrganizationToForm = (organization: OrgProfileResponse | undefined, fallbackEmail: string): OrganizationForm => {
	if (!organization) {
		return {
			...DEFAULT_ORGANIZATION_FORM,
			supportEmail: fallbackEmail,
		};
	}

	return {
		name: toText(organization.name),
		legalName: toText(organization.legalName),
		panNumber: toText(organization.panNumber),
		businessType: toText(organization.businessType),
		supportEmail: toText(organization.supportEmail) || fallbackEmail,
		supportPhone: toText(organization.supportPhone),
		addressLine1: toText(organization.addressLine1),
		addressLine2: toText(organization.addressLine2),
		city: toText(organization.city),
		state: toText(organization.state),
		pincode: toText(organization.pincode),
		country: toText(organization.country) || "India",
	};
};

export const normalizeTechStackResponse = (response: TechStackResponse): TechStackResponse => ({
	addOns: Array.isArray(response.addOns) ? response.addOns : [],
	categories: Array.isArray(response.categories) ? response.categories : [],
});

export const extractOnboardingSelections = (onboarding: OnboardingState): {
	selectedPlanId: string;
	selectedAddOns: string[];
	stackSelections: Record<string, string>;
} => {
	const payload = onboarding.onboardingPayload || {};
	const payloadRecord = payload as Record<string, unknown>;

	return {
		selectedPlanId: toText(payloadRecord.selectedPlanId),
		selectedAddOns: toStringArray(payloadRecord.selectedAddOns),
		stackSelections: toRecord(onboarding.stackSelections),
	};
};

export const buildRazorpayBilling = (form: OrganizationForm, organizationName: string, accountEmail: string): RazorpayBilling => ({
	name: form.name || organizationName,
	email: form.supportEmail || accountEmail,
	phone: form.supportPhone,
});

export const buildOnboardingPayload = (
	selectedPlanId: string,
	selectedAddOns: string[],
	razorpayBilling: RazorpayBilling,
	razorpayIds?: { orderId?: string; paymentId?: string },
): OnboardingPayload => ({
	selectedPlanId,
	selectedAddOns,
	razorpayBilling,
	...(razorpayIds?.orderId ? { razorpayOrderId: razorpayIds.orderId } : {}),
	...(razorpayIds?.paymentId ? { razorpayPaymentId: razorpayIds.paymentId } : {}),
});

export const buildOnboardingUpdateRequest = (params: {
	profileCompleted: boolean;
	paymentCardOnboarded?: boolean;
	preferredCurrency: string;
	stackSelections: Record<string, string>;
	onboardingPayload: OnboardingPayload;
}): OnboardingUpdateRequest => ({
	profileCompleted: params.profileCompleted,
	...(typeof params.paymentCardOnboarded === "boolean" ? { paymentCardOnboarded: params.paymentCardOnboarded } : {}),
	preferredCurrency: params.preferredCurrency,
	stackSelections: params.stackSelections,
	onboardingPayload: params.onboardingPayload,
});

export const resolveAccountEmail = (me: MeResponse): string => toText(me.user?.email);
