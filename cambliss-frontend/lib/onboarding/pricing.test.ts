import { calculateTotalInInr, convertFromInr, formatCurrency } from "./pricing";
import type { PricingInput } from "./types";

describe("onboarding pricing", () => {
	it("calculates total INR for plan, addons, and stack selections", () => {
		const input: PricingInput = {
			planPrice: 1000,
			selectedAddOnCodes: ["a1"],
			addOns: [
				{ code: "a1", label: "Addon 1", amount: 100 },
				{ code: "a2", label: "Addon 2", amount: 50 },
			],
			stackSelections: { frontend: "react" },
			categories: [
				{
					id: "frontend",
					label: "Frontend",
					description: "Frontend stack",
					options: [
						{ code: "react", label: "React", amount: 300 },
						{ code: "vue", label: "Vue", amount: 250 },
					],
				},
			],
		};

		expect(calculateTotalInInr(input)).toBe(1400);
	});

	it("converts INR with fallback to INR for unknown currencies", () => {
		expect(convertFromInr(100, "USD")).toBeCloseTo(1.2);
		expect(convertFromInr(100, "XYZ")).toBe(100);
	});

	it("formats currency without throwing for supported and unsupported codes", () => {
		expect(formatCurrency(1000, "EUR")).toContain("€");
		expect(formatCurrency(1000, "INVALID")).toContain("₹");
	});
});
