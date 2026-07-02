"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";
import { DEFAULT_CURRENCY, CURRENCY_RATES, DEFAULT_ORGANIZATION_FORM } from "@/lib/onboarding/constants";
import { OnboardingApiClient } from "@/lib/onboarding/api";
import {
	buildOnboardingPayload,
	buildOnboardingUpdateRequest,
	buildRazorpayBilling,
	extractOnboardingSelections,
	mapOrganizationToForm,
	normalizeTechStackResponse,
	resolveAccountEmail,
} from "@/lib/onboarding/mappers";
import { calculateTotalInInr, convertFromInr, formatCurrency } from "@/lib/onboarding/pricing";
import { ensureRazorpayScriptLoaded, openRazorpayCheckout } from "@/lib/onboarding/razorpay";
import type { CurrencyCode, OrgProfileResponse, OrganizationForm, PlanSummary, TechStackResponse } from "@/lib/onboarding/types";

type Step = 1 | 2 | 3;

type PersistOnboardingStateParams = {
	paymentCardOnboarded?: boolean;
	razorpay?: {
		orderId?: string;
		paymentId?: string;
	};
};

const isBusinessProfileComplete = (form: OrganizationForm): boolean =>
	Boolean(form.name.trim() && form.businessType.trim() && form.supportEmail.trim() && form.supportPhone.trim());

const isTechSelectionComplete = (techData: TechStackResponse, stackSelections: Record<string, string>): boolean => {
	if (techData.categories.length === 0) {
		return false;
	}

	return techData.categories.every((category) => Boolean(stackSelections[category.id]));
};

export default function ProfileCompletionPage() {
	const router = useRouter();
	const [token, setToken] = useState<string | null>(null);
	const [organization, setOrganization] = useState<OrgProfileResponse | null>(null);
	const [accountEmail, setAccountEmail] = useState("");
	const [plans, setPlans] = useState<PlanSummary[]>([]);
	const [selectedPlanId, setSelectedPlanId] = useState("");
	const [techData, setTechData] = useState<TechStackResponse>({ addOns: [], categories: [] });
	const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
	const [stackSelections, setStackSelections] = useState<Record<string, string>>({});
	const [preferredCurrency, setPreferredCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
	const [profileCompleted, setProfileCompleted] = useState(false);
	const [paymentCompleted, setPaymentCompleted] = useState(false);
	const [savingProfile, setSavingProfile] = useState(false);
	const [savingTechStep, setSavingTechStep] = useState(false);
	const [paymentLoading, setPaymentLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState<Step>(1);
	const [notice, setNotice] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [form, setForm] = useState<OrganizationForm>(DEFAULT_ORGANIZATION_FORM);

	const apiClient = useMemo(() => (token ? new OnboardingApiClient(token) : null), [token]);

	useEffect(() => {
		const authToken = localStorage.getItem("authToken");
		if (!authToken) {
			router.replace("/login");
			return;
		}

		setToken(authToken);
	}, [router]);

	useEffect(() => {
		if (!apiClient) {
			return;
		}

		const loadBootstrapData = async () => {
			try {
				setError(null);

				const [meData, onboardingData, planRows, techRows] = await Promise.all([
					apiClient.getMe(),
					apiClient.getOnboarding(),
					apiClient.getPlans(),
					apiClient.getTechStackAddOns(),
				]);

				const email = resolveAccountEmail(meData);
				setAccountEmail(email);

				if (meData.organization) {
					setOrganization(meData.organization);
					setForm(mapOrganizationToForm(meData.organization, email));
				} else if (email) {
					setForm((prev) => (prev.supportEmail.trim() ? prev : { ...prev, supportEmail: email }));
				}

				if (onboardingData) {
					const selections = extractOnboardingSelections(onboardingData);
					setProfileCompleted(Boolean(onboardingData.profileCompleted));
					setPaymentCompleted(Boolean(onboardingData.paymentCardOnboarded));
					setPreferredCurrency((onboardingData.preferredCurrency as CurrencyCode) || DEFAULT_CURRENCY);
					setStackSelections(selections.stackSelections);
					setSelectedAddOns(selections.selectedAddOns);
					setSelectedPlanId((prev) => prev || selections.selectedPlanId);
				}

				setPlans(planRows);
				setSelectedPlanId((prev) => prev || planRows[0]?.id || "");

				if (techRows) {
					setTechData(normalizeTechStackResponse(techRows));
				}
			} catch (loadError) {
				setError(loadError instanceof Error ? loadError.message : "Unable to load onboarding");
			}
		};

		void loadBootstrapData();
	}, [apiClient]);

	useEffect(() => {
		if (profileCompleted && paymentCompleted) {
			router.replace("/dashboard");
		}
	}, [paymentCompleted, profileCompleted, router]);

	useEffect(() => {
		if (!accountEmail || form.supportEmail.trim()) {
			return;
		}

		setForm((prev) => (prev.supportEmail.trim() ? prev : { ...prev, supportEmail: accountEmail }));
	}, [accountEmail, form.supportEmail]);

	useEffect(() => {
		if (paymentCompleted) {
			setCurrentStep(3);
			return;
		}

		if (profileCompleted) {
			setCurrentStep(2);
		}
	}, [paymentCompleted, profileCompleted]);

	const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? null, [plans, selectedPlanId]);

	const totalInInr = useMemo(() => {
		return calculateTotalInInr({
			planPrice: selectedPlan ? Number(selectedPlan.price) || 0 : 0,
			selectedAddOnCodes: selectedAddOns,
			addOns: techData.addOns,
			stackSelections,
			categories: techData.categories,
		});
	}, [selectedPlan, selectedAddOns, stackSelections, techData.addOns, techData.categories]);

	const totalConverted = useMemo(() => convertFromInr(totalInInr, preferredCurrency), [preferredCurrency, totalInInr]);

	const businessStepComplete = useMemo(() => isBusinessProfileComplete(form), [form]);
	const techStackComplete = useMemo(() => isTechSelectionComplete(techData, stackSelections), [techData, stackSelections]);

	const updateForm = (key: keyof OrganizationForm, value: string) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const persistOnboardingState = async (params: PersistOnboardingStateParams = {}): Promise<void> => {
		if (!apiClient) {
			throw new Error("Not authenticated");
		}

		const billing = buildRazorpayBilling(form, organization?.name || "", accountEmail);
		const onboardingPayload = buildOnboardingPayload(
			selectedPlanId,
			selectedAddOns,
			billing,
			params.razorpay
				? {
					orderId: params.razorpay.orderId,
					paymentId: params.razorpay.paymentId,
				}
				: undefined,
		);
		const requestBody = buildOnboardingUpdateRequest({
			profileCompleted: true,
			paymentCardOnboarded: params.paymentCardOnboarded,
			preferredCurrency,
			stackSelections,
			onboardingPayload,
		});

		await apiClient.updateOnboarding(requestBody);
	};

	const handleProfileSave = async (): Promise<boolean> => {
		if (!apiClient) {
			return false;
		}

		if (!businessStepComplete) {
			setError("Please complete business name, type, support email, and support phone before continuing.");
			return false;
		}

		setSavingProfile(true);
		setError(null);
		setNotice(null);

		try {
			await apiClient.updateOrganization(form);
			await persistOnboardingState();
			setProfileCompleted(true);
			setNotice("Business profile saved. Continue to tech stack selection.");
			return true;
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to save profile");
			return false;
		} finally {
			setSavingProfile(false);
		}
	};

	const handleTechStepSave = async (): Promise<boolean> => {
		if (!apiClient) {
			return false;
		}

		if (!selectedPlanId) {
			setError("Select a plan before continuing to payment onboarding.");
			return false;
		}

		if (!techStackComplete) {
			setError("Please select one option in each tech stack category before continuing.");
			return false;
		}

		setSavingTechStep(true);
		setError(null);
		setNotice(null);

		try {
			await persistOnboardingState();
			setNotice("Tech stack saved. Continue to Razorpay onboarding.");
			return true;
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to save tech stack selections");
			return false;
		} finally {
			setSavingTechStep(false);
		}
	};

	const handlePayment = async () => {
		if (!apiClient) {
			return;
		}

		if (!profileCompleted) {
			setError("Complete the business profile step before payment onboarding.");
			return;
		}

		if (!selectedPlanId) {
			setError("Select a plan before payment onboarding.");
			return;
		}

		setPaymentLoading(true);
		setError(null);
		setNotice(null);

		try {
			const scriptLoaded = await ensureRazorpayScriptLoaded();
			if (!scriptLoaded) {
				throw new Error("Razorpay checkout failed to load");
			}

			const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
			if (!razorpayKey) {
				throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID is missing");
			}

			const subscription = await apiClient.getOrCreateSubscription(selectedPlanId);
			const order = await apiClient.createOrder({
				subscriptionId: subscription.id,
				addOns: selectedAddOns,
				techStack: "CUSTOM_STACK",
				stackSelections: techStackComplete ? stackSelections : {},
			});

			const verificationPayload = await openRazorpayCheckout({
				key: razorpayKey,
				order,
				name: form.name || organization?.name || "Office Connect",
				description: "Trial activation card onboarding",
				prefill: {
					name: form.legalName || form.name,
					email: form.supportEmail,
					contact: form.supportPhone,
				},
			});

			await apiClient.verifyPayment(verificationPayload);
			await persistOnboardingState({
				paymentCardOnboarded: true,
				razorpay: {
					orderId: verificationPayload.razorpay_order_id,
					paymentId: verificationPayload.razorpay_payment_id,
				},
			});

			setPaymentCompleted(true);
			setNotice("Payment onboarding complete. Continue to tech stack selection.");
			setCurrentStep(3);
		} catch (paymentError) {
			setError(paymentError instanceof Error ? paymentError.message : "Unable to complete payment onboarding");
		} finally {
			setPaymentLoading(false);
		}
	};

	return (
		<WorkspaceShell>
			<div className="min-h-screen bg-gradient-to-b from-[#eef3ff] to-white px-4 py-8 text-[#111827] sm:px-8">
				<div className="mx-auto w-full max-w-6xl space-y-6">
					<div className="rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)]">
						<h1 className="text-2xl font-semibold">Business Onboarding</h1>
						<p className="mt-2 text-sm text-[#4b5563]">Complete this setup when you are ready. Your 90-day free trial stays fully active, and all modules remain enabled until the trial ends.</p>
						<p className="mt-2 rounded-xl border border-[#e6ebfa] bg-[#f8fbff] px-3 py-2 text-sm text-[#4b5563]">Razorpay billing details are saved before tech-stack selection so your payment profile is ready when you continue.</p>
						{notice && <p className="mt-3 rounded-xl border border-[#c7ddff] bg-[#f2f7ff] px-3 py-2 text-sm text-[#2554a8]">{notice}</p>}
						{error && <p className="mt-3 rounded-xl border border-[#f0c9c5] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">{error}</p>}
					</div>

					<div className="grid gap-3 rounded-2xl border border-[#dbe3f7] bg-white p-4 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)] sm:grid-cols-3">
						{[
							{ id: 1 as Step, label: "Business Details", done: profileCompleted },
							{ id: 2 as Step, label: "Add Card Details", done: paymentCompleted },
							{ id: 3 as Step, label: "Tech Stack", done: techStackComplete && Boolean(selectedPlanId) },
						].map((step) => {
							const isCurrent = currentStep === step.id;
							return (
								<div
									key={step.id}
									className={`rounded-xl border px-3 py-2 text-sm ${isCurrent ? "border-[#1d419d] bg-[#edf3ff] text-[#1d419d]" : step.done ? "border-[#b6dfc4] bg-[#f0fff4] text-[#157347]" : "border-[#e2e8f0] bg-white text-[#4b5563]"}`}
								>
									<p className="font-semibold">Step {step.id}</p>
									<p>{step.label}</p>
								</div>
							);
						})}
					</div>

					{currentStep === 1 && (
						<div className="rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)]">
							<h2 className="text-lg font-semibold">Step 1: Organization Profile</h2>
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								<input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Organization name" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
								<input value={form.legalName} onChange={(event) => updateForm("legalName", event.target.value)} placeholder="Legal name" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
								<input value={form.panNumber} onChange={(event) => updateForm("panNumber", event.target.value)} placeholder="PAN" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
								<input value={form.businessType} onChange={(event) => updateForm("businessType", event.target.value)} placeholder="Business type" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
								<div className="rounded-xl border border-dashed border-[#c9d4ef] bg-[#f8fbff] px-3 py-2 text-sm text-[#4b5563]">
									<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">Autofetched email</p>
									<p className="mt-1 break-all text-[#111827]">{accountEmail || "Loading from your account..."}</p>
								</div>
								<input value={form.supportEmail} onChange={(event) => updateForm("supportEmail", event.target.value)} placeholder="Support email" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
								<input value={form.supportPhone} onChange={(event) => updateForm("supportPhone", event.target.value)} placeholder="Support phone" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
								<input value={form.addressLine1} onChange={(event) => updateForm("addressLine1", event.target.value)} placeholder="Address line 1" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
								<input value={form.addressLine2} onChange={(event) => updateForm("addressLine2", event.target.value)} placeholder="Address line 2" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
								<input value={form.city} onChange={(event) => updateForm("city", event.target.value)} placeholder="City" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
								<input value={form.state} onChange={(event) => updateForm("state", event.target.value)} placeholder="State" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
								<input value={form.pincode} onChange={(event) => updateForm("pincode", event.target.value)} placeholder="Pincode" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
								<input value={form.country} onChange={(event) => updateForm("country", event.target.value)} placeholder="Country" className="rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm" />
							</div>
							<div className="mt-4 flex justify-end">
								<button
									type="button"
									onClick={() =>
										void (async () => {
											const ok = await handleProfileSave();
											if (ok) {
												setCurrentStep(2);
											}
										})()
									}
									disabled={savingProfile}
									className="rounded-xl bg-[#1d419d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173784] disabled:opacity-60"
								>
									{savingProfile ? "Saving..." : "Save and Continue"}
								</button>
							</div>
						</div>
					)}

					{currentStep === 2 && (
						<div className="rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)]">
							<h2 className="text-lg font-semibold">Step 2: Add Card Details (Razorpay)</h2>
							<p className="mt-1 text-sm text-[#4b5563]">Add your card details securely in Razorpay right after business details. Tech stack can be finalized next.</p>

							<h3 className="mt-5 text-sm font-semibold">Plan</h3>
							<select value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dbe3f7] px-3 py-2 text-sm">
								{plans.map((plan) => (
									<option key={plan.id} value={plan.id}>{plan.name} - {plan.currency} {plan.price}/{plan.interval.toLowerCase()}</option>
								))}
							</select>

							<div className="mt-4 grid gap-2 text-sm text-[#4b5563] sm:grid-cols-2">
								<p><span className="font-semibold text-[#111827]">Profile status:</span> {profileCompleted ? "Completed" : "Pending"}</p>
								<p><span className="font-semibold text-[#111827]">Payment status:</span> {paymentCompleted ? "Completed" : "Pending"}</p>
								<p><span className="font-semibold text-[#111827]">Desired currency:</span> {preferredCurrency}</p>
								<p><span className="font-semibold text-[#111827]">Estimated total:</span> {new Intl.NumberFormat(undefined, { style: "currency", currency: preferredCurrency, maximumFractionDigits: 2 }).format(totalConverted)}</p>
							</div>

							<div className="mt-4 flex items-center justify-between gap-2">
								<button type="button" onClick={() => setCurrentStep(1)} className="rounded-xl border border-[#dbe3f7] px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f8faff]">
									Back
								</button>
								<button type="button" onClick={() => void handlePayment()} disabled={paymentLoading || paymentCompleted} className="rounded-xl bg-[#1d419d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173784] disabled:opacity-60">
									{paymentCompleted ? "Card details completed" : paymentLoading ? "Opening Razorpay..." : "Add card details"}
								</button>
							</div>
						</div>
					)}

					{currentStep === 3 && (
						<div className="rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)]">
							<h2 className="text-lg font-semibold">Step 3: Tech Stack Selection</h2>
							<p className="mt-1 text-sm text-[#4b5563]">Choose one option per category and save your workspace stack preferences.</p>

							<div className="mt-3 flex flex-wrap gap-2">
								{Object.keys(CURRENCY_RATES).map((currency) => (
									<button key={currency} type="button" onClick={() => setPreferredCurrency(currency as CurrencyCode)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${preferredCurrency === currency ? "border-[#1d419d] bg-[#edf3ff] text-[#1d419d]" : "border-[#dbe3f7] text-[#4b5563]"}`}>
										{currency}
									</button>
								))}
							</div>

							<div className="mt-4 space-y-4">
								{techData.categories.map((category) => (
									<div key={category.id} className="rounded-xl border border-[#dbe3f7] p-3">
										<p className="text-sm font-semibold text-[#111827]">{category.label}</p>
										<p className="text-xs text-[#6b7280]">{category.description}</p>
										<div className="mt-2 grid gap-2">
											{category.options.map((option) => (
												<label key={option.code} className="flex items-center justify-between rounded-lg border border-[#e6ebfa] px-2 py-1.5 text-xs">
													<span>
														<input type="radio" name={category.id} checked={stackSelections[category.id] === option.code} onChange={() => setStackSelections((prev) => ({ ...prev, [category.id]: option.code }))} className="mr-2" />
														{option.label}
													</span>
													<span>{formatCurrency(option.amount, preferredCurrency)}</span>
												</label>
											))}
										</div>
									</div>
								))}
							</div>

							<h3 className="mt-5 text-sm font-semibold">Add-ons</h3>
							<div className="mt-2 space-y-2">
								{techData.addOns.map((addon) => (
									<label key={addon.code} className="flex items-center justify-between rounded-lg border border-[#e6ebfa] px-2 py-1.5 text-xs">
										<span>
											<input type="checkbox" checked={selectedAddOns.includes(addon.code)} onChange={(event) => setSelectedAddOns((prev) => event.target.checked ? [...prev, addon.code] : prev.filter((item) => item !== addon.code))} className="mr-2" />
											{addon.label}
										</span>
										<span>{formatCurrency(addon.amount, preferredCurrency)}</span>
									</label>
								))}
							</div>

							<div className="mt-4 grid gap-2 text-sm text-[#4b5563] sm:grid-cols-2">
								<p><span className="font-semibold text-[#111827]">Desired currency:</span> {preferredCurrency}</p>
								<p><span className="font-semibold text-[#111827]">Estimated total:</span> {new Intl.NumberFormat(undefined, { style: "currency", currency: preferredCurrency, maximumFractionDigits: 2 }).format(totalConverted)}</p>
							</div>

							<div className="mt-4 flex items-center justify-between gap-2">
								<button type="button" onClick={() => setCurrentStep(2)} className="rounded-xl border border-[#dbe3f7] px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f8faff]">
									Back
								</button>
								<button
									type="button"
									onClick={() =>
										void (async () => {
											const ok = await handleTechStepSave();
											if (ok) {
												setCurrentStep(3);
											}
										})()
									}
									disabled={savingTechStep}
									className="rounded-xl bg-[#1d419d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173784] disabled:opacity-60"
								>
									{savingTechStep ? "Saving..." : "Save Tech Stack"}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</WorkspaceShell>
	);
}
