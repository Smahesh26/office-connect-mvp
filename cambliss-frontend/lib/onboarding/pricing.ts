import { CURRENCY_RATES, DEFAULT_CURRENCY } from "./constants";
import type { CurrencyCode, PricingInput } from "./types";

export const calculateTotalInInr = (input: PricingInput): number => {
	const addOnTotal = input.addOns
		.filter((addOn) => input.selectedAddOnCodes.includes(addOn.code))
		.reduce((sum, addOn) => sum + addOn.amount, 0);

	const stackTotal = input.categories.reduce((sum, category) => {
		const selectedCode = input.stackSelections[category.id];
		const selectedOption = category.options.find((option) => option.code === selectedCode);
		return sum + (selectedOption?.amount ?? 0);
	}, 0);

	return input.planPrice + addOnTotal + stackTotal;
};

export const convertFromInr = (amountInInr: number, currency: string): number => {
	const code = (currency in CURRENCY_RATES ? currency : DEFAULT_CURRENCY) as CurrencyCode;
	return amountInInr * CURRENCY_RATES[code];
};

export const formatCurrency = (amountInInr: number, currency: string): string => {
	const code = (currency in CURRENCY_RATES ? currency : DEFAULT_CURRENCY) as CurrencyCode;
	const convertedAmount = convertFromInr(amountInInr, code);

	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: code,
		maximumFractionDigits: 2,
	}).format(convertedAmount);
};
