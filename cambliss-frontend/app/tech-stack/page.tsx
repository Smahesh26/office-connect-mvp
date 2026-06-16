"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

type PlanSummary = {
	id: string;
	name: string;
	description?: string | null;
	features?: string[];
	price: string | number;
	currency: string;
	interval: string;
	userLimit: number;
	storageLimit: number;
};

type PlanFamily = {
	name: string;
	monthly?: PlanSummary;
	yearly?: PlanSummary;
};

type AddOnOption = {
	code: string;
	label: string;
	amount: number;
};

type TechStackCategory = {
	id: string;
	label: string;
	description: string;
	options: Array<{
		code: string;
		label: string;
		amount: number;
	}>;
};

type SavedTechStackConfig = {
	stackSelections?: Record<string, string>;
	billingCycle?: "MONTHLY" | "YEARLY";
	planId?: string;
	addOns?: string[];
	status?: "draft" | "paid";
	updatedAt?: string;
};

type SubscriptionSnapshot = {
	id: string;
	planId: string;
	status: string;
};

const stepDefinitions = [
	{ id: 0, code: "01", label: "Stack" },
	{ id: 1, code: "02", label: "Add-ons" },
	{ id: 2, code: "03", label: "Pricing" },
	{ id: 3, code: "04", label: "Plan" },
	{ id: 4, code: "05", label: "Payment" },
] as const;

const fallbackCategories: TechStackCategory[] = [
	{
		id: "frontend",
		label: "Frontend",
		description: "UI Framework",
		options: [
			{ code: "react", label: "React", amount: 2000 },
			{ code: "nextjs", label: "Next.js", amount: 2500 },
			{ code: "vue3", label: "Vue 3", amount: 1800 },
			{ code: "nuxt3", label: "Nuxt 3", amount: 2200 },
			{ code: "angular", label: "Angular", amount: 2200 },
			{ code: "svelte", label: "Svelte", amount: 1600 },
			{ code: "sveltekit", label: "SvelteKit", amount: 1900 },
			{ code: "remix", label: "Remix", amount: 2400 },
		],
	},
	{
		id: "backend",
		label: "Backend",
		description: "Server Framework",
		options: [
			{ code: "nodejs", label: "Node.js", amount: 2000 },
			{ code: "nestjs", label: "NestJS", amount: 2400 },
			{ code: "fastapi", label: "FastAPI", amount: 2000 },
			{ code: "django", label: "Django", amount: 2200 },
			{ code: "gofiber", label: "Go/Fiber", amount: 2800 },
			{ code: "rails", label: "Rails", amount: 2200 },
			{ code: "spring", label: "Spring", amount: 3000 },
			{ code: "laravel", label: "Laravel", amount: 1800 },
		],
	},
	{
		id: "database",
		label: "Database",
		description: "Data Storage",
		options: [
			{ code: "postgresql", label: "PostgreSQL", amount: 800 },
			{ code: "mysql", label: "MySQL", amount: 600 },
			{ code: "mongodb", label: "MongoDB", amount: 700 },
			{ code: "supabase", label: "Supabase", amount: 900 },
			{ code: "firebase", label: "Firebase", amount: 700 },
			{ code: "planetscale", label: "PlanetScale", amount: 850 },
			{ code: "redis", label: "Redis", amount: 400 },
		],
	},
	{
		id: "hosting",
		label: "Hosting",
		description: "Infrastructure",
		options: [
			{ code: "aws", label: "AWS", amount: 1200 },
			{ code: "gcp", label: "GCP", amount: 1100 },
			{ code: "azure", label: "Azure", amount: 1200 },
			{ code: "vercel", label: "Vercel", amount: 600 },
			{ code: "digitalocean", label: "DigitalOcean", amount: 800 },
			{ code: "render", label: "Render", amount: 650 },
			{ code: "railway", label: "Railway", amount: 550 },
		],
	},
];

const fallbackAddOns: AddOnOption[] = [
	{ code: "AI_AUTOMATION", label: "AI Automation", amount: 1499 },
	{ code: "ADV_ANALYTICS", label: "Advanced Analytics", amount: 999 },
	{ code: "WHATSAPP_API", label: "WhatsApp API", amount: 699 },
	{ code: "DEDICATED_PM", label: "Dedicated PM", amount: 2499 },
	{ code: "PRIORITY_SUPPORT", label: "Priority Support", amount: 799 },
];

const normalizeInterval = (interval?: string): "MONTHLY" | "YEARLY" => {
	const normalized = (interval || "").toLowerCase();
	return normalized.includes("year") ? "YEARLY" : "MONTHLY";
};

const parseAmount = (value: string | number): number => {
	const amount = Number(value);
	return Number.isFinite(amount) ? amount : 0;
};

const formatMoney = (amount: number, currency: string) => {
	try {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency,
			maximumFractionDigits: 0,
		}).format(amount);
	} catch {
		return `${currency} ${amount.toFixed(0)}`;
	}
};

const ensureRazorpayLoaded = async (): Promise<boolean> => {
	if ((window as typeof window & { Razorpay?: unknown }).Razorpay) {
		return true;
	}

	return new Promise((resolve) => {
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.async = true;
		script.onload = () => resolve(true);
		script.onerror = () => resolve(false);
		document.body.appendChild(script);
	});
};

export default function TechStackPage() {
	const router = useRouter();
	const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
	const [activeStep, setActiveStep] = useState(0);
	const [plans, setPlans] = useState<PlanSummary[]>([]);
	const [categories, setCategories] = useState<TechStackCategory[]>(fallbackCategories);
	const [addOns, setAddOns] = useState<AddOnOption[]>(fallbackAddOns);
	const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
	const [selectedPlanId, setSelectedPlanId] = useState("");
	const [selectedAddOnCodes, setSelectedAddOnCodes] = useState<string[]>([]);
	const [stackSelections, setStackSelections] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		const storedConfigRaw = localStorage.getItem("selectedTechStackConfig");
		if (!storedConfigRaw) {
			return;
		}

		try {
			const parsed = JSON.parse(storedConfigRaw) as SavedTechStackConfig;
			if (parsed.stackSelections && typeof parsed.stackSelections === "object") {
				setStackSelections(parsed.stackSelections);
			}
			if (parsed.billingCycle) {
				setBillingCycle(parsed.billingCycle);
			}
			if (parsed.planId) {
				setSelectedPlanId(parsed.planId);
			}
			if (Array.isArray(parsed.addOns)) {
				setSelectedAddOnCodes(parsed.addOns);
			}
		} catch {
			// ignore invalid local data
		}
	}, []);

	useEffect(() => {
		const loadData = async () => {
			const token = localStorage.getItem("authToken");
			if (!token) {
				setMessage("Please login first to configure your tech stack.");
				return;
			}

			try {
				const [plansResponse, stackResponse] = await Promise.all([
					fetch("/api/plans"),
					fetch("/api/subscription/tech-stack-addons", {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}),
				]);

				if (plansResponse.ok) {
					const planData = (await plansResponse.json()) as PlanSummary[];
					setPlans(Array.isArray(planData) ? planData : []);
				}

				if (stackResponse.ok) {
					const stackData = (await stackResponse.json()) as {
						addOns?: AddOnOption[];
						categories?: TechStackCategory[];
					};

					if (Array.isArray(stackData.addOns) && stackData.addOns.length > 0) {
						setAddOns(stackData.addOns);
					}

					if (Array.isArray(stackData.categories) && stackData.categories.length > 0) {
						setCategories(stackData.categories);
					}
				}
			} catch {
				setMessage("Unable to load tech stack pricing right now.");
			}
		};

		void loadData();
	}, []);

	const plansForCycle = useMemo(() => {
		return plans.filter((plan) => normalizeInterval(plan.interval) === billingCycle);
	}, [plans, billingCycle]);

	const planFamilies = useMemo(() => {
		const familyMap = new Map<string, PlanFamily>();

		for (const plan of plans) {
			const key = plan.name.trim().toLowerCase();
			const existing = familyMap.get(key) ?? { name: plan.name };
			if (normalizeInterval(plan.interval) === "MONTHLY") {
				existing.monthly = plan;
			} else {
				existing.yearly = plan;
			}
			familyMap.set(key, existing);
		}

		return Array.from(familyMap.values());
	}, [plans]);

	useEffect(() => {
		if (plansForCycle.length === 0) {
			setSelectedPlanId("");
			return;
		}

		if (!plansForCycle.some((plan) => plan.id === selectedPlanId)) {
			setSelectedPlanId(plansForCycle[0].id);
		}
	}, [plansForCycle, selectedPlanId]);

	const selectedPlan = useMemo(() => {
		return plans.find((plan) => plan.id === selectedPlanId) ?? null;
	}, [plans, selectedPlanId]);

	const selectedPlanFamily = useMemo(() => {
		if (!selectedPlan) {
			return null;
		}

		return (
			planFamilies.find(
				(family) => family.monthly?.id === selectedPlan.id || family.yearly?.id === selectedPlan.id,
			) ?? null
		);
	}, [planFamilies, selectedPlan]);

	const selectedAddOns = useMemo(() => {
		return addOns.filter((addOn) => selectedAddOnCodes.includes(addOn.code));
	}, [addOns, selectedAddOnCodes]);

	const selectedCategoryOptions = useMemo(() => {
		return categories
			.map((category) => {
				const optionCode = stackSelections[category.id];
				if (!optionCode) {
					return null;
				}

				const option = category.options.find((item) => item.code === optionCode);
				if (!option) {
					return null;
				}

				return {
					categoryId: category.id,
					categoryLabel: category.label,
					option,
				};
			})
			.filter((item): item is NonNullable<typeof item> => Boolean(item));
	}, [categories, stackSelections]);

	const stackSubtotal = useMemo(() => {
		return selectedCategoryOptions.reduce((sum, item) => sum + item.option.amount, 0);
	}, [selectedCategoryOptions]);

	const addOnTotal = useMemo(() => {
		return selectedAddOns.reduce((sum, item) => sum + item.amount, 0);
	}, [selectedAddOns]);

	const planAmount = selectedPlan ? parseAmount(selectedPlan.price) : 0;
	const finalAmount = stackSubtotal + addOnTotal + planAmount;
	const displayCurrency = selectedPlan?.currency || "INR";

	const isStackComplete = categories.length > 0 && categories.every((category) => Boolean(stackSelections[category.id]));
	const canAdvanceToPricing = isStackComplete;
	const canAdvanceToPlan = canAdvanceToPricing;
	const canAdvanceToPayment = canAdvanceToPlan && Boolean(selectedPlanId);

	const maxReachableStep = canAdvanceToPayment
		? 4
		: canAdvanceToPlan
			? 3
			: canAdvanceToPricing
				? 2
				: 1;

	const saveSelection = (status: "draft" | "paid") => {
		const payload: SavedTechStackConfig = {
			stackSelections,
			billingCycle,
			planId: selectedPlanId,
			addOns: selectedAddOnCodes,
			status,
			updatedAt: new Date().toISOString(),
		};

		localStorage.setItem("selectedTechStackConfig", JSON.stringify(payload));
	};

	const selectOption = (categoryId: string, optionCode: string) => {
		setStackSelections((prev) => ({
			...prev,
			[categoryId]: optionCode,
		}));
	};

	const toggleAddOn = (code: string) => {
		setSelectedAddOnCodes((prev) =>
			prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
		);
	};

	const goToNextStep = () => {
		setMessage(null);
		setActiveStep((prev) => Math.min(prev + 1, 4));
	};

	const goToPreviousStep = () => {
		setMessage(null);
		setActiveStep((prev) => Math.max(prev - 1, 0));
	};

	const handleSaveDraft = () => {
		if (!isStackComplete) {
			setMessage("Select one item in each tech category before saving.");
			return;
		}

		if (!selectedPlanId) {
			setMessage("Choose a billing plan before saving.");
			return;
		}

		saveSelection("draft");
		setMessage("Tech stack selection saved. You can return later to complete payment.");
	};

	const handleCheckout = async () => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			setMessage("Please login first.");
			return;
		}

		if (!isStackComplete) {
			setMessage("Select frontend, backend, database, and hosting before payment.");
			setActiveStep(0);
			return;
		}

		if (!selectedPlanId) {
			setMessage("Choose a billing plan before payment.");
			setActiveStep(3);
			return;
		}

		setIsLoading(true);
		setMessage(null);

		try {
			let subscriptionId: string | null = null;

			const existingResponse = await fetch("/api/subscription/my-subscription", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (existingResponse.ok) {
				const existing = (await existingResponse.json()) as SubscriptionSnapshot;
				const existingStatus = String(existing.status || "").toUpperCase();
				const hasLiveStatus = ["ACTIVE", "TRIALING", "PAST_DUE"].includes(existingStatus);

				if (existing?.id && existing.planId === selectedPlanId && hasLiveStatus) {
					subscriptionId = existing.id;
					setMessage("Using your existing subscription for checkout.");
				}
			}

			if (!subscriptionId) {
				const subscribeResponse = await fetch("/api/subscription/subscribe", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ planId: selectedPlanId }),
				});

				const subscribeRaw = await subscribeResponse.text();
				const subscribeData = subscribeRaw
					? (JSON.parse(subscribeRaw) as { id?: string; message?: string })
					: null;

				if (subscribeResponse.ok && subscribeData?.id) {
					subscriptionId = subscribeData.id;
				} else if (subscribeResponse.status === 409) {
					const fallbackExistingResponse = await fetch("/api/subscription/my-subscription", {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});

					if (!fallbackExistingResponse.ok) {
						setMessage(subscribeData?.message || "Unable to start subscription.");
						return;
					}

					const existing = (await fallbackExistingResponse.json()) as SubscriptionSnapshot;
					if (!existing?.id) {
						setMessage("Unable to resolve existing subscription for checkout.");
						return;
					}

					subscriptionId = existing.id;
					setMessage("Using your existing subscription for checkout.");
				} else {
					setMessage(subscribeData?.message || "Unable to start subscription.");
					return;
				}
			}

			const techStackLabel = selectedCategoryOptions
				.map((item) => `${item.categoryLabel}:${item.option.label}`)
				.join(" | ");

			const orderResponse = await fetch("/api/subscription/create-order", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					subscriptionId,
					techStack: techStackLabel,
					addOns: selectedAddOnCodes,
					stackSelections,
				}),
			});

			const orderRaw = await orderResponse.text();
			const orderData = orderRaw
				? (JSON.parse(orderRaw) as { id?: string; amount?: number; currency?: string; message?: string })
				: null;

			if (!orderResponse.ok || !orderData?.id) {
				setMessage(orderData?.message || "Unable to create payment order.");
				return;
			}

			if (!razorpayKeyId) {
				saveSelection("draft");
				setMessage("Selection saved. Configure NEXT_PUBLIC_RAZORPAY_KEY_ID to open Razorpay.");
				return;
			}

			const loaded = await ensureRazorpayLoaded();
			if (!loaded || !(window as typeof window & { Razorpay?: unknown }).Razorpay) {
				setMessage("Razorpay SDK failed to load. Please retry.");
				return;
			}

			const Razorpay = (window as typeof window & { Razorpay: new (options: any) => { open: () => void } }).Razorpay;
			const razorpay = new Razorpay({
				key: razorpayKeyId,
				amount: orderData.amount,
				currency: orderData.currency,
				name: "Office Connect",
				description: "Tech Stack Billing",
				order_id: orderData.id,
				handler: async (response: {
					razorpay_order_id: string;
					razorpay_payment_id: string;
					razorpay_signature: string;
				}) => {
					const verifyResponse = await fetch("/api/subscription/verify-payment", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify(response),
					});

					const verifyRaw = await verifyResponse.text();
					const verifyData = verifyRaw
						? (
							JSON.parse(verifyRaw) as {
								message?: string;
								invoiceStored?: boolean;
							}
						)
						: null;

					if (!verifyResponse.ok) {
						setMessage(verifyData?.message || "Payment verification failed.");
						return;
					}

					saveSelection("paid");
					setMessage(
						verifyData?.invoiceStored
							? "Payment complete. Invoice stored successfully. Tech stack activated."
							: "Payment complete. Tech stack activated.",
					);
					router.push("/dashboard");
				},
			});

			razorpay.open();
		} catch {
			setMessage("Unable to complete checkout right now.");
		} finally {
			setIsLoading(false);
		}
	};

	const renderStepContent = () => {
		if (activeStep === 0) {
			return (
				<div className="space-y-6">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Step 01</p>
						<h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
							Configure Your <span className="text-zinc-500">Tech Stack</span>
						</h1>
						<p className="mt-3 text-sm text-zinc-600">
							Select one option per category. Your live estimate updates on the right immediately.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
						{categories.map((category) => {
							const selectedCode = stackSelections[category.id];
							return (
								<div key={category.id} className="rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-[0_20px_44px_-28px_rgba(0,0,0,0.45)] ring-1 ring-white/80 sm:p-5">
									<div className="mb-4 flex items-start gap-3">
										<div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-900 text-sm font-bold text-white shadow-sm">
											{category.label.slice(0, 1)}
										</div>
										<div>
											<p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-900">{category.label}</p>
											<p className="text-sm text-zinc-500">{category.description}</p>
										</div>
									</div>
									<div className="flex flex-wrap gap-2.5">
										{category.options.map((option) => {
											const isSelected = selectedCode === option.code;
											return (
												<button
													key={option.code}
													type="button"
													onClick={() => selectOption(category.id, option.code)}
													className={`min-w-[128px] flex-1 rounded-lg border px-3 py-2.5 text-left transition sm:flex-none sm:px-4 sm:py-3 ${
														isSelected
															? "border-zinc-900 bg-zinc-900 text-white shadow-[0_12px_26px_-18px_rgba(0,0,0,0.9)]"
															: "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white"
													}`}
												>
													<div className="flex items-center justify-between gap-3">
														<span className="text-sm font-semibold">{option.label}</span>
														<span className={`text-sm ${isSelected ? "text-white/80" : "text-zinc-500"}`}>
															{formatMoney(option.amount, displayCurrency)}
														</span>
													</div>
												</button>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			);
		}

		if (activeStep === 1) {
			return (
				<div className="space-y-6">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Step 02</p>
						<h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Choose Add-ons</h2>
						<p className="mt-3 text-sm text-zinc-600">
							Add optional capabilities on top of your core stack. Skip anything you do not need.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
						{addOns.map((addOn) => {
							const checked = selectedAddOnCodes.includes(addOn.code);
							return (
								<label
									key={addOn.code}
									className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-4 transition ${
										checked
											? "border-zinc-900 bg-zinc-900 text-white shadow-[0_12px_26px_-18px_rgba(0,0,0,0.9)]"
											: "border-zinc-200 bg-white hover:border-zinc-300"
									}`}
								>
									<div className="flex items-center gap-3">
										<input
											type="checkbox"
											checked={checked}
											onChange={() => toggleAddOn(addOn.code)}
											className="h-4 w-4"
										/>
										<div>
											<p className={`text-sm font-semibold ${checked ? "text-white" : "text-zinc-900"}`}>{addOn.label}</p>
											<p className="text-xs text-zinc-500">Optional capability</p>
										</div>
									</div>
									<span className={`text-sm font-semibold ${checked ? "text-white" : "text-zinc-700"}`}>+{formatMoney(addOn.amount, displayCurrency)}</span>
								</label>
							);
						})}
					</div>
				</div>
			);
		}

		if (activeStep === 2) {
			return (
				<div className="space-y-6">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Step 03</p>
						<h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Review Pricing</h2>
						<p className="mt-3 text-sm text-zinc-600">
							Your stack build cost and add-on charges are locked in here before you select the billing plan.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Stack Build</p>
							<p className="mt-3 text-2xl font-bold text-zinc-900">{formatMoney(stackSubtotal, displayCurrency)}</p>
							<p className="mt-2 text-xs text-zinc-500">Frontend, backend, database, and hosting selections.</p>
						</div>
						<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Add-ons</p>
							<p className="mt-3 text-2xl font-bold text-zinc-900">{formatMoney(addOnTotal, displayCurrency)}</p>
							<p className="mt-2 text-xs text-zinc-500">Selected optional modules and service upgrades.</p>
						</div>
						<div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5 text-white shadow-[0_20px_44px_-28px_rgba(0,0,0,0.85)]">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Current Subtotal</p>
							<p className="mt-3 text-2xl font-bold text-white">{formatMoney(stackSubtotal + addOnTotal, displayCurrency)}</p>
							<p className="mt-2 text-xs text-zinc-400">Recurring billing plan will be added in the next step.</p>
						</div>
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Estimated Full Billing</p>
						<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
								<p className="text-xs text-zinc-500">Selected Plan</p>
								<p className="mt-1 text-sm font-semibold text-zinc-900">
									{selectedPlan ? `${selectedPlan.name} (${billingCycle.toLowerCase()})` : "Not selected yet"}
								</p>
							</div>
							<div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-right sm:text-left">
								<p className="text-xs text-zinc-500">Plan Amount</p>
								<p className="mt-1 text-sm font-semibold text-zinc-900">
									{selectedPlan ? formatMoney(planAmount, displayCurrency) : "Select a plan in Step 04"}
								</p>
							</div>
						</div>
						<div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-4 text-white">
							<div>
								<p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Grand Total</p>
								<p className="mt-1 text-2xl font-bold text-white">{formatMoney(finalAmount, displayCurrency)}</p>
							</div>
							<p className="text-xs text-zinc-300">Includes stack + add-ons + plan billing</p>
						</div>
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Selected Components</p>
						<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
							{selectedCategoryOptions.map((item) => (
								<div key={item.categoryId} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
									<div>
										<p className="font-semibold text-zinc-900">{item.categoryLabel}</p>
										<p className="text-xs text-zinc-500">{item.option.label}</p>
									</div>
									<span className="font-semibold text-zinc-900">{formatMoney(item.option.amount, displayCurrency)}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			);
		}

		if (activeStep === 3) {
			return (
				<div className="space-y-6">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Step 04</p>
						<h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Choose Your Plan</h2>
						<p className="mt-3 text-sm text-zinc-600">
							Select the recurring plan that should be billed together with your selected stack and add-ons.
						</p>
					</div>

					<div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
						<button
							type="button"
							onClick={() => setBillingCycle("MONTHLY")}
							className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
								billingCycle === "MONTHLY" ? "bg-zinc-900 text-white" : "text-zinc-600"
							}`}
						>
							Monthly
						</button>
						<button
							type="button"
							onClick={() => setBillingCycle("YEARLY")}
							className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
								billingCycle === "YEARLY" ? "bg-zinc-900 text-white" : "text-zinc-600"
							}`}
						>
							Yearly
						</button>
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Checkout Amount</p>
						<p className="mt-2 text-lg font-bold text-zinc-900">
							{selectedPlanFamily
								? `${selectedPlanFamily.name} • ${billingCycle.toLowerCase()}`
								: "Select monthly or yearly amount"}
						</p>
						<p className="mt-1 text-sm text-zinc-600">
							Razorpay will charge {formatMoney(finalAmount, displayCurrency)} (stack + add-ons + selected plan).
						</p>
					</div>

					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
						{planFamilies.map((family) => {
							const monthlySelected = selectedPlanId === family.monthly?.id;
							const yearlySelected = selectedPlanId === family.yearly?.id;
							const cardSelected = monthlySelected || yearlySelected;
							const cardCurrency = family.monthly?.currency || family.yearly?.currency || displayCurrency;
							return (
								<div
									key={family.name}
									className={`rounded-2xl border p-5 text-left transition ${
										cardSelected
											? "border-zinc-900 bg-zinc-900 text-white shadow-[0_20px_44px_-28px_rgba(0,0,0,0.85)]"
											: "border-zinc-200 bg-white"
									}`}
								>
									<p className={`text-lg font-bold ${cardSelected ? "text-white" : "text-zinc-900"}`}>{family.name}</p>
									<p className={`mt-3 text-sm ${cardSelected ? "text-zinc-300" : "text-zinc-600"}`}>
										{family.monthly?.description || family.yearly?.description || "Recurring platform plan."}
									</p>
									<p className={`mt-2 text-xs ${cardSelected ? "text-zinc-400" : "text-zinc-500"}`}>
										Users: {family.monthly?.userLimit ?? family.yearly?.userLimit ?? 0} | Storage: {family.monthly?.storageLimit ?? family.yearly?.storageLimit ?? 0}GB
									</p>

									<div className="mt-4 grid grid-cols-1 gap-2">
										<button
											type="button"
											disabled={!family.monthly}
											onClick={() => {
												if (!family.monthly) return;
												setBillingCycle("MONTHLY");
												setSelectedPlanId(family.monthly.id);
											}}
											className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
												monthlySelected
													? "border-white/30 bg-white/10 text-white"
													: cardSelected
														? "border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-zinc-500"
														: "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300"
											}`}
										>
											Monthly: {family.monthly ? formatMoney(parseAmount(family.monthly.price), cardCurrency) : "Not available"}
										</button>
										<button
											type="button"
											disabled={!family.yearly}
											onClick={() => {
												if (!family.yearly) return;
												setBillingCycle("YEARLY");
												setSelectedPlanId(family.yearly.id);
											}}
											className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
												yearlySelected
													? "border-white/30 bg-white/10 text-white"
													: cardSelected
														? "border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-zinc-500"
														: "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300"
											}`}
										>
											Yearly: {family.yearly ? formatMoney(parseAmount(family.yearly.price), cardCurrency) : "Not available"}
										</button>
									</div>
								</div>
							);
						})}
						{planFamilies.length === 0 && (
							<div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500 lg:col-span-2 xl:col-span-3">
								No plans are available right now.
							</div>
						)}
					</div>
				</div>
			);
		}

		return (
			<div className="space-y-6">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Step 05</p>
					<h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Payment</h2>
					<p className="mt-3 text-sm text-zinc-600">
						You are paying for the configured stack, selected add-ons, and the chosen billing plan in one Razorpay order.
					</p>
				</div>

				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Build + Add-ons</p>
							<p className="mt-3 text-2xl font-black text-zinc-900">{formatMoney(stackSubtotal + addOnTotal, displayCurrency)}</p>
						</div>
						<div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Plan Billing</p>
							<p className="mt-3 text-2xl font-black text-zinc-900">{formatMoney(planAmount, displayCurrency)}</p>
						</div>
					</div>

					<div className="mt-4 rounded-2xl border border-zinc-900 bg-zinc-900 px-4 py-5 text-white shadow-[0_20px_44px_-28px_rgba(0,0,0,0.85)]">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Total Due Now</p>
								<p className="mt-2 text-3xl font-bold text-white sm:text-4xl">{formatMoney(finalAmount, displayCurrency)}</p>
							</div>
							<div className="text-right text-sm text-zinc-300">
								<p>{selectedPlan?.name || "No plan selected"}</p>
								<p>{billingCycle.toLowerCase()} billing</p>
							</div>
						</div>
					</div>

					<div className="mt-5 flex flex-col gap-3 sm:flex-row">
						<button
							type="button"
							onClick={handleCheckout}
							disabled={isLoading || !canAdvanceToPayment}
							className="w-full rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 sm:w-auto"
						>
							{isLoading ? "Opening Razorpay..." : "Pay with Razorpay"}
						</button>
						<button
							type="button"
							onClick={handleSaveDraft}
							disabled={isLoading}
							className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 disabled:opacity-60 sm:w-auto"
						>
							Save Selection
						</button>
					</div>
				</div>
			</div>
		);
	};

	return (
		<WorkspaceShell>
			<div className="mt-5 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 text-zinc-900 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)] ring-1 ring-white/80">
				<div className="border-b border-zinc-200 bg-white/85 px-5 py-4 backdrop-blur sm:px-8">
					<div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.28em] text-zinc-500">
						{stepDefinitions.map((step) => {
							const isActive = activeStep === step.id;
							const isEnabled = step.id <= maxReachableStep;
							return (
								<button
									key={step.id}
									type="button"
									onClick={() => {
										if (isEnabled) {
											setActiveStep(step.id);
										}
									}}
									disabled={!isEnabled}
									className={`inline-flex items-center gap-3 transition ${
										isActive ? "text-zinc-900" : isEnabled ? "text-zinc-500 hover:text-zinc-700" : "text-zinc-300"
									}`}
								>
									<span className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-[11px] font-bold tracking-normal ${
										isActive ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white"
									}`}>
										{step.code}
									</span>
									<span>{step.label}</span>
									{step.id < stepDefinitions.length - 1 && <span className="text-zinc-300">-</span>}
								</button>
							);
						})}
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-10 xl:px-8">
					<div>
						{message && (
								<div className="mb-5 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 shadow-sm">
								{message}
							</div>
						)}

						{renderStepContent()}

						<div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5">
							<button
								type="button"
								onClick={goToPreviousStep}
								disabled={activeStep === 0}
								className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 disabled:opacity-40"
							>
								Back
							</button>

							{activeStep < 4 ? (
								<button
									type="button"
									onClick={() => {
										if (activeStep === 0 && !isStackComplete) {
											setMessage("Select one option in all four stack categories to continue.");
											return;
										}

										if (activeStep === 2 && !canAdvanceToPlan) {
											setMessage("Complete your stack selection before continuing.");
											return;
										}

										if (activeStep === 3 && !selectedPlanId) {
											setMessage("Choose a plan to continue.");
											return;
										}

										goToNextStep();
									}}
									className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
								>
									Continue
								</button>
							) : (
								<div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Final step reached</div>
							)}
						</div>
					</div>

					<aside className="h-fit rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_50px_-34px_rgba(0,0,0,0.3)] xl:sticky xl:top-6">
						<div className="border-b border-zinc-200 px-6 py-5">
							<p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-500">Live Estimate</p>
						</div>
						<div className="divide-y divide-zinc-200">
							{selectedCategoryOptions.map((item) => (
								<div key={item.categoryId} className="flex items-center justify-between gap-3 px-6 py-5 text-sm text-zinc-700">
									<div>
										<p>{item.categoryLabel}</p>
										<p className="mt-1 text-xs text-zinc-500">{item.option.label}</p>
									</div>
									<span className="font-semibold text-zinc-900">{formatMoney(item.option.amount, displayCurrency)}</span>
								</div>
							))}

							{selectedCategoryOptions.length === 0 && (
								<div className="px-6 py-5 text-sm text-zinc-500">Start selecting your stack to see the estimate here.</div>
							)}

							<div className="px-6 py-5 text-sm text-zinc-700">
								<div className="flex items-center justify-between">
									<span>Add-ons</span>
									<span className="font-semibold text-zinc-900">{formatMoney(addOnTotal, displayCurrency)}</span>
								</div>
								<p className="mt-1 text-xs text-zinc-500">{selectedAddOns.length} optional item(s) selected</p>
							</div>

							<div className="px-6 py-5 text-sm text-zinc-700">
								<div className="flex items-center justify-between">
									<span>Plan</span>
									<span className="font-semibold text-zinc-900">{selectedPlan ? formatMoney(planAmount, displayCurrency) : "-"}</span>
								</div>
								<p className="mt-1 text-xs text-zinc-500">{selectedPlan ? `${selectedPlan.name} | ${billingCycle.toLowerCase()}` : "Choose a plan in Step 04"}</p>
							</div>
						</div>

						<div className="border-t border-zinc-200 px-6 py-7">
							<p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-500">Total Due</p>
							<p className="mt-4 text-right text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
								{formatMoney(finalAmount, displayCurrency)}
							</p>
							<p className="mt-2 text-right text-xs text-zinc-500">
								{selectedPlan ? `${selectedPlan.name} | ${billingCycle.toLowerCase()} plan` : "Plan not selected"}
							</p>
						</div>
					</aside>
				</div>
			</div>
		</WorkspaceShell>
	);
}
