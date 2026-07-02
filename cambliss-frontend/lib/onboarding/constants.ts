import type { CurrencyCode, OrganizationForm } from "./types";

export const CURRENCY_RATES: Record<CurrencyCode, number> = {
	INR: 1,
	USD: 0.012,
	EUR: 0.011,
	GBP: 0.0095,
};

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

export const DEFAULT_ORGANIZATION_FORM: OrganizationForm = {
	name: "",
	legalName: "",
	panNumber: "",
	businessType: "",
	supportEmail: "",
	supportPhone: "",
	addressLine1: "",
	addressLine2: "",
	city: "",
	state: "",
	pincode: "",
	country: "India",
};
