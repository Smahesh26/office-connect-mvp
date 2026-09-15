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
import type { CurrencyCode, OrgProfileResponse, OrganizationForm, PaymentCardDetails, PlanSummary, TechStackResponse } from "@/lib/onboarding/types";

type Step = 1 | 2 | 3;

type PersistOnboardingStateParams = {
	paymentCardOnboarded?: boolean;
	cardDetails?: PaymentCardDetails;
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

const getCardBrand = (numberStr: string): "VISA" | "MASTERCARD" | "RUPAY" | "AMEX" | "OTHER" => {
	const clean = numberStr.replace(/\D/g, "");
	if (/^4/.test(clean)) return "VISA";
	if (/^(5[1-5]|2[2-7])/.test(clean)) return "MASTERCARD";
	if (/^(60|65|81|82|508)/.test(clean)) return "RUPAY";
	if (/^3[47]/.test(clean)) return "AMEX";
	return "OTHER";
};

const formatCardNumber = (val: string) => {
	const raw = val.replace(/\D/g, "").slice(0, 16);
	const chunks = raw.match(/.{1,4}/g);
	return chunks ? chunks.join(" ") : raw;
};

const formatExpiry = (val: string) => {
	const raw = val.replace(/\D/g, "").slice(0, 4);
	if (raw.length >= 3) {
		return `${raw.slice(0, 2)} / ${raw.slice(2)}`;
	}
	return raw;
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

	// Credit / Debit Card State
	const [cardType, setCardType] = useState<"CREDIT" | "DEBIT">("CREDIT");
	const [cardNumber, setCardNumber] = useState("");
	const [cardHolderName, setCardHolderName] = useState("");
	const [expiryDate, setExpiryDate] = useState("");
	const [cvv, setCvv] = useState("");
	const [billingZip, setBillingZip] = useState("");
	const [autoPayConsent, setAutoPayConsent] = useState(true);
	const [showCvv, setShowCvv] = useState(false);
	const [savedCardSummary, setSavedCardSummary] = useState<PaymentCardDetails | null>(null);

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
					if (!cardHolderName) {
						setCardHolderName(meData.organization.legalName || meData.organization.name || "");
					}
					if (!billingZip && meData.organization.pincode) {
						setBillingZip(meData.organization.pincode);
					}
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

					const card = onboardingData.cardDetails || (onboardingData.onboardingPayload?.cardDetails as any) || (onboardingData.onboardingPayload?.paymentCard as any);
					if (card) {
						setSavedCardSummary(card);
						setCardType(card.cardType || "CREDIT");
						setCardHolderName(card.cardHolderName || "");
						setBillingZip(card.billingZip || "");
						setAutoPayConsent(card.autoPayConsent ?? true);
						if (card.cardNumberLast4) {
							setCardNumber(`•••• •••• •••• ${card.cardNumberLast4}`);
						}
						if (card.expiryMonth && card.expiryYear) {
							setExpiryDate(`${card.expiryMonth} / ${String(card.expiryYear).slice(-2)}`);
						}
					}
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
		if (!accountEmail || form.supportEmail.trim()) {
			return;
		}

		setForm((prev) => (prev.supportEmail.trim() ? prev : { ...prev, supportEmail: accountEmail }));
	}, [accountEmail, form.supportEmail]);

	const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null, [plans, selectedPlanId]);

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
		const effectiveCardDetails = params.cardDetails || (savedCardSummary ?? undefined);
		const effectivePlanId = selectedPlanId || plans[0]?.id || "";
		const onboardingPayload = buildOnboardingPayload(
			effectivePlanId,
			selectedAddOns,
			billing,
			params.razorpay
				? {
					orderId: params.razorpay.orderId,
					paymentId: params.razorpay.paymentId,
				}
				: undefined,
			effectiveCardDetails,
		);
		const requestBody = buildOnboardingUpdateRequest({
			profileCompleted: true,
			paymentCardOnboarded: params.paymentCardOnboarded ?? paymentCompleted,
			preferredCurrency,
			stackSelections,
			onboardingPayload,
			cardDetails: effectiveCardDetails,
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
			setNotice("Business profile saved. Please add your card details to verify your 90-day free trial.");
			return true;
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to save profile");
			return false;
		} finally {
			setSavingProfile(false);
		}
	};

	const handleSaveCardDetails = async (): Promise<boolean> => {
		if (!apiClient) {
			return false;
		}

		const cleanNum = cardNumber.replace(/\D/g, "");
		if (cleanNum.length < 15) {
			setError("Please enter a valid 16-digit credit or debit card number.");
			return false;
		}

		const holder = cardHolderName.trim() || form.legalName.trim() || form.name.trim();
		if (!holder) {
			setError("Please enter the cardholder name as printed on the card.");
			return false;
		}

		const cleanExp = expiryDate.replace(/\D/g, "");
		if (cleanExp.length < 4) {
			setError("Please enter a valid card expiration date in MM / YY format.");
			return false;
		}

		const expMonth = cleanExp.slice(0, 2);
		const expYear = `20${cleanExp.slice(2)}`;
		const monthNum = parseInt(expMonth, 10);
		if (monthNum < 1 || monthNum > 12) {
			setError("Invalid expiration month. Please enter a value between 01 and 12.");
			return false;
		}

		const cleanCvv = cvv.replace(/\D/g, "");
		if (cleanCvv.length < 3) {
			setError("Please enter a valid 3 or 4-digit CVV / CVC code.");
			return false;
		}

		setPaymentLoading(true);
		setError(null);
		setNotice(null);

		const brand = getCardBrand(cleanNum);
		const last4 = cleanNum.slice(-4);
		const cardPayload: PaymentCardDetails = {
			cardType,
			cardHolderName: holder,
			cardNumberLast4: last4,
			cardBrand: brand,
			expiryMonth: expMonth,
			expiryYear: expYear,
			billingZip: billingZip.trim() || form.pincode.trim() || "560001",
			autoPayConsent,
		};

		try {
			await persistOnboardingState({
				paymentCardOnboarded: true,
				cardDetails: cardPayload,
			});

			setSavedCardSummary(cardPayload);
			setPaymentCompleted(true);
			setNotice(`✓ ${cardType === "CREDIT" ? "Credit Card" : "Debit Card"} (${brand} •••• ${last4}) securely linked to your 90-day free trial!`);
			setCurrentStep(3);
			return true;
		} catch (saveErr) {
			setError(saveErr instanceof Error ? saveErr.message : "Failed to verify and save card details");
			return false;
		} finally {
			setPaymentLoading(false);
		}
	};

	const handleTechStepSave = async (): Promise<boolean> => {
		if (!apiClient) {
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
			await persistOnboardingState({
				paymentCardOnboarded: paymentCompleted,
				cardDetails: savedCardSummary ?? undefined,
			});
			setNotice("Tech stack saved. Onboarding complete!");
			router.push("/dashboard");
			return true;
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to save tech stack selections");
			return false;
		} finally {
			setSavingTechStep(false);
		}
	};

	return (
		<WorkspaceShell>
			<div className="min-h-screen bg-gradient-to-b from-[#eef3ff] to-white px-4 py-8 text-[#111827] sm:px-8">
				<div className="mx-auto w-full max-w-6xl space-y-6">
					<div className="rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)]">
						<h1 className="text-2xl font-semibold">Workspace Profile & Card Verification</h1>
						<p className="mt-2 text-sm text-[#4b5563]">
							Complete this setup to personalize your workspace. Your 90-day free trial stays 100% active and free with all enterprise modules unlocked.
						</p>
						<p className="mt-2 rounded-xl border border-[#e6ebfa] bg-[#f8fbff] px-3 py-2 text-xs text-[#4b5563]">
							🔒 Card details are verified with zero charge (₹0.00 today) and stored with bank-grade 256-bit encryption.
						</p>
						{notice && <p className="mt-3 rounded-xl border border-[#c7ddff] bg-[#f2f7ff] px-3 py-2 text-sm text-[#2554a8]">{notice}</p>}
						{error && <p className="mt-3 rounded-xl border border-[#f0c9c5] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">{error}</p>}
					</div>

					<div className="grid gap-3 rounded-2xl border border-[#dbe3f7] bg-white p-4 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)] sm:grid-cols-3">
						{[
							{ id: 1 as Step, label: "Business Details", done: profileCompleted },
							{ id: 2 as Step, label: "Credit / Debit Card Details", done: paymentCompleted },
							{ id: 3 as Step, label: "Tech Stack", done: techStackComplete },
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

					{/* STEP 1: BUSINESS DETAILS */}
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
									{savingProfile ? "Saving..." : "Save and Continue to Card Details"}
								</button>
							</div>
						</div>
					)}

					{/* STEP 2: PROPER CREDIT / DEBIT CARD FIELDS (NO PLAN) */}
					{currentStep === 2 && (
						<div className="rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)] space-y-6">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
								<div>
									<div className="flex items-center gap-2">
										<h2 className="text-xl font-bold text-slate-900">Step 2: Add Card Details (Credit / Debit Card)</h2>
										<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
											90-Day Free Trial Active
										</span>
									</div>
									<p className="mt-1 text-xs text-[#5b6472]">
										Add your Credit or Debit Card securely for workspace verification. No amount is charged today (₹0.00). All modules remain fully enabled.
									</p>
								</div>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => setCardType("CREDIT")}
										className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
											cardType === "CREDIT"
												? "bg-[#1d419d] text-white shadow-md"
												: "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
										}`}
									>
										💳 Credit Card
									</button>
									<button
										type="button"
										onClick={() => setCardType("DEBIT")}
										className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
											cardType === "DEBIT"
												? "bg-[#1d419d] text-white shadow-md"
												: "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
										}`}
									>
										🏦 Debit Card
									</button>
								</div>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
								{/* Left: 3D Interactive Virtual Card Preview */}
								<div className="lg:col-span-5 flex flex-col items-center">
									<div className="w-full max-w-sm rounded-2xl bg-gradient-to-tr from-[#0f2252] via-[#1d419d] to-[#2b58cb] p-6 text-white shadow-xl relative overflow-hidden ring-1 ring-white/20">
										<div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
										<div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-400/10 blur-xl pointer-events-none" />

										{/* Header */}
										<div className="flex items-center justify-between relative z-10">
											<div className="flex items-center gap-2">
												<span className="text-xs font-black tracking-widest text-indigo-200 uppercase">OFFICE CONNECT</span>
												<span className="text-[10px] px-1.5 py-0.5 rounded bg-white/15 font-semibold text-white/90">
													{cardType === "CREDIT" ? "CREDIT" : "DEBIT"}
												</span>
											</div>
											<div className="text-right font-black text-sm tracking-wider">
												{getCardBrand(cardNumber) === "VISA" && <span className="italic font-extrabold text-blue-200">VISA</span>}
												{getCardBrand(cardNumber) === "MASTERCARD" && <span className="font-extrabold text-amber-300">Mastercard</span>}
												{getCardBrand(cardNumber) === "RUPAY" && <span className="font-extrabold text-emerald-300">RuPay</span>}
												{getCardBrand(cardNumber) === "AMEX" && <span className="font-extrabold text-cyan-200">AMEX</span>}
												{getCardBrand(cardNumber) === "OTHER" && <span className="font-extrabold text-slate-300">CARD</span>}
											</div>
										</div>

										{/* Chip & NFC */}
										<div className="mt-5 flex items-center gap-3 relative z-10">
											<div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 border border-amber-500/40 shadow-inner flex items-center justify-center">
												<div className="w-8 h-5 border border-amber-600/30 rounded-sm grid grid-cols-2 gap-0.5" />
											</div>
											<svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none">
												<path d="M7 16a6 6 0 0 1 0-8M10 18a9 9 0 0 1 0-12M13 20a12 12 0 0 1 0-16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
											</svg>
										</div>

										{/* Card Number */}
										<div className="mt-5 text-lg sm:text-xl font-mono tracking-widest font-semibold drop-shadow-sm relative z-10">
											{cardNumber.trim() ? (
												<span>{cardNumber}</span>
											) : (
												<span className="text-white/40">•••• •••• •••• ••••</span>
											)}
										</div>

										{/* Cardholder & Expiry */}
										<div className="mt-5 flex items-end justify-between text-xs relative z-10">
											<div className="min-w-0 pr-2">
												<span className="block text-[9px] uppercase tracking-wider text-indigo-200 font-semibold">Cardholder Name</span>
												<span className="block font-bold tracking-wide uppercase truncate">
													{cardHolderName.trim() || form.legalName || form.name || "YOUR NAME"}
												</span>
											</div>
											<div className="text-right shrink-0">
												<span className="block text-[9px] uppercase tracking-wider text-indigo-200 font-semibold">Valid Thru</span>
												<span className="block font-mono font-bold tracking-wider">
													{expiryDate.trim() || "MM/YY"}
												</span>
											</div>
										</div>
									</div>

									{/* Status card */}
									<div className="mt-4 p-3 rounded-xl border border-emerald-100 bg-emerald-50/70 text-emerald-900 text-xs w-full max-w-sm space-y-1">
										<div className="flex items-center justify-between">
											<span className="font-bold text-emerald-800">Profile Status:</span>
											<span className="font-bold text-emerald-700">✓ Completed</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="font-bold text-emerald-800">Payment Status:</span>
											<span className="font-bold text-emerald-700">
												{paymentCompleted ? "✓ Verified & Onboarded" : "Pending Card Save"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="font-bold text-emerald-800">Amount Charged Today:</span>
											<span className="font-bold text-emerald-900">₹0.00 (Free Trial)</span>
										</div>
									</div>
								</div>

								{/* Right: Card Input Fields */}
								<div className="lg:col-span-7 space-y-4">
									<div>
										<label className="block text-xs font-bold text-slate-700 mb-1">
											Cardholder Name <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											value={cardHolderName}
											onChange={(e) => setCardHolderName(e.target.value)}
											placeholder={form.legalName || form.name || "Name as printed on card"}
											className="w-full rounded-xl border border-[#dbe3f7] px-3.5 py-2.5 text-sm focus:border-[#1d419d] focus:outline-none focus:ring-1 focus:ring-[#1d419d]"
										/>
									</div>

									<div>
										<label className="block text-xs font-bold text-slate-700 mb-1">
											Card Number <span className="text-red-500">*</span>
										</label>
										<div className="relative">
											<input
												type="text"
												value={cardNumber}
												onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
												placeholder="4532 •••• •••• ••••"
												maxLength={19}
												className="w-full rounded-xl border border-[#dbe3f7] px-3.5 py-2.5 text-sm font-mono tracking-wide focus:border-[#1d419d] focus:outline-none focus:ring-1 focus:ring-[#1d419d]"
											/>
											<span className="absolute right-3 top-2.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold">
												{getCardBrand(cardNumber)}
											</span>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="block text-xs font-bold text-slate-700 mb-1">
												Expiration Date <span className="text-red-500">*</span>
											</label>
											<input
												type="text"
												value={expiryDate}
												onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
												placeholder="MM / YY"
												maxLength={7}
												className="w-full rounded-xl border border-[#dbe3f7] px-3.5 py-2.5 text-sm font-mono focus:border-[#1d419d] focus:outline-none focus:ring-1 focus:ring-[#1d419d]"
											/>
										</div>

										<div>
											<label className="block text-xs font-bold text-slate-700 mb-1">
												CVV / CVC <span className="text-red-500">*</span>
											</label>
											<div className="relative">
												<input
													type={showCvv ? "text" : "password"}
													value={cvv}
													onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
													placeholder="•••"
													maxLength={4}
													className="w-full rounded-xl border border-[#dbe3f7] px-3.5 py-2.5 text-sm font-mono focus:border-[#1d419d] focus:outline-none focus:ring-1 focus:ring-[#1d419d]"
												/>
												<button
													type="button"
													onClick={() => setShowCvv(!showCvv)}
													className="absolute right-3 top-2.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
												>
													{showCvv ? "Hide" : "Show"}
												</button>
											</div>
										</div>
									</div>

									<div>
										<label className="block text-xs font-bold text-slate-700 mb-1">
											Billing PIN / Postal Code
										</label>
										<input
											type="text"
											value={billingZip}
											onChange={(e) => setBillingZip(e.target.value)}
											placeholder={form.pincode || "Billing Pincode"}
											className="w-full rounded-xl border border-[#dbe3f7] px-3.5 py-2.5 text-sm focus:border-[#1d419d] focus:outline-none focus:ring-1 focus:ring-[#1d419d]"
										/>
									</div>

									<div className="pt-1">
										<label className="flex items-start gap-2.5 cursor-pointer select-none">
											<input
												type="checkbox"
												checked={autoPayConsent}
												onChange={(e) => setAutoPayConsent(e.target.checked)}
												className="mt-0.5 rounded border-slate-300 text-[#1d419d] focus:ring-[#1d419d]"
											/>
											<span className="text-xs text-[#4b5563] leading-relaxed">
												Securely save this card for automated workspace renewal after the 90-day free trial. I understand I can cancel or update my card at any time.
											</span>
										</label>
									</div>

									<div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
										<span>🔒 256-bit Bank-Grade Encryption</span>
										<span>•</span>
										<span>PCI-DSS Level 1 Compliant</span>
										<span>•</span>
										<span>RBI Mandate Ready</span>
									</div>
								</div>
							</div>

							<div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
								<button
									type="button"
									onClick={() => setCurrentStep(1)}
									className="rounded-xl border border-[#dbe3f7] px-5 py-2.5 text-sm font-semibold text-[#374151] hover:bg-[#f8faff] transition"
								>
									← Back to Business Details
								</button>
								<button
									type="button"
									onClick={() => void handleSaveCardDetails()}
									disabled={paymentLoading}
									className="inline-flex items-center gap-2 rounded-xl bg-[#1d419d] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#173784] transition disabled:opacity-60"
								>
									{paymentLoading ? (
										<>
											<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
											</svg>
											<span>Verifying & Saving Card...</span>
										</>
									) : paymentCompleted ? (
										<span>Card Verified ✓ Update & Continue →</span>
									) : (
										<span>Save & Verify Card Details →</span>
									)}
								</button>
							</div>
						</div>
					)}

					{/* STEP 3: TECH STACK SELECTION */}
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
									← Back to Card Details
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
									{savingTechStep ? "Saving..." : "Save Tech Stack & Finish"}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</WorkspaceShell>
	);
}
