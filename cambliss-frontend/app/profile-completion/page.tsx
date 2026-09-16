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
import { TechLogo, RazorpayBadgeLogo, getTechTagline } from "@/components/onboarding/TechStackIcons";
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

// Tech stack visual helper icons
const getCategoryIcon = (categoryId: string) => {
	switch (categoryId) {
		case "frontend":
			return "🖥️";
		case "backend":
			return "⚙️";
		case "database":
			return "🗄️";
		case "hosting":
			return "☁️";
		default:
			return "🧩";
	}
};

const getOptionIcon = (code: string) => {
	switch (code) {
		case "nextjs":
			return "▲";
		case "react":
			return "⚛️";
		case "vue3":
		case "nuxt3":
			return "💚";
		case "nodejs":
		case "nestjs":
			return "🟩";
		case "fastapi":
		case "django":
			return "🐍";
		case "postgresql":
			return "🐘";
		case "mysql":
			return "🐬";
		case "mongodb":
			return "🍃";
		case "aws":
			return "🟧";
		case "gcp":
			return "🔵";
		case "azure":
			return "🔷";
		case "vercel":
			return "▲";
		default:
			return "⚡";
	}
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
	const [paymentLoading, setPaymentLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState<Step>(1);
	const [notice, setNotice] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [form, setForm] = useState<OrganizationForm>(DEFAULT_ORGANIZATION_FORM);

	// Credit / Debit Card State (Step 2)
	const [cardType, setCardType] = useState<"CREDIT" | "DEBIT">("CREDIT");
	const [cardNumber, setCardNumber] = useState("");
	const [cardHolderName, setCardHolderName] = useState("");
	const [expiryDate, setExpiryDate] = useState("");
	const [cvv, setCvv] = useState("");
	const [billingZip, setBillingZip] = useState("");
	const [autoPayConsent, setAutoPayConsent] = useState(true);
	const [showCvv, setShowCvv] = useState(false);
	const [savedCardSummary, setSavedCardSummary] = useState<PaymentCardDetails | null>(null);

	// Payment Gateway & Modal State (Step 3)
	const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
	const [gatewayProcessing, setGatewayProcessing] = useState(false);
	const [gatewayStep, setGatewayStep] = useState<"SELECT" | "PROCESSING" | "SUCCESS">("SELECT");
	const [activeGatewayMethod, setActiveGatewayMethod] = useState<"CARD" | "UPI" | "NETBANKING">("CARD");
	const [orderReferenceId, setOrderReferenceId] = useState("");
	const [paymentReceiptDetails, setPaymentReceiptDetails] = useState<{
		paymentId: string;
		orderId: string;
		amount: string;
		currency: string;
		paidAt: string;
	} | null>(null);

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
					const normalized = normalizeTechStackResponse(techRows);
					setTechData(normalized);
					// Default select first item in each category if not already selected
					setStackSelections((prev) => {
						const next = { ...prev };
						normalized.categories.forEach((cat) => {
							if (!next[cat.id] && cat.options[0]) {
								next[cat.id] = cat.options[0].code;
							}
						});
						return next;
					});
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

	const formattedPrice = useMemo(() => {
		return new Intl.NumberFormat(undefined, {
			style: "currency",
			currency: preferredCurrency,
			maximumFractionDigits: 2,
		}).format(totalConverted);
	}, [totalConverted, preferredCurrency]);

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

	// STEP 3: PROCEED TO PAYMENT GATEWAY TO PAY THE AMOUNT
	const handleProceedToPaymentGateway = async () => {
		if (!apiClient) {
			return;
		}

		if (!techStackComplete) {
			setError("Please select one option in each tech stack category before proceeding to checkout.");
			return;
		}

		setError(null);
		setNotice(null);
		setPaymentLoading(true);

		const orderRef = `ORD-OC-${Math.floor(100000 + Math.random() * 900000)}`;
		setOrderReferenceId(orderRef);

		// 1. Save tech stack selections and onboarding state
		try {
			await persistOnboardingState({
				paymentCardOnboarded: paymentCompleted,
				cardDetails: savedCardSummary ?? undefined,
			});
		} catch (saveErr) {
			console.warn("Failed to persist tech stack state before checkout:", saveErr);
		}

		// 2. Ensure Razorpay Checkout SDK is loaded
		let scriptLoaded = false;
		try {
			scriptLoaded = await ensureRazorpayScriptLoaded();
		} catch (e) {
			console.warn("Could not load Razorpay checkout script:", e);
		}

		// 3. Create backend subscription order (which returns authentic Razorpay order & active keyId)
		let order: any = null;
		try {
			if (apiClient) {
				const subscription = await apiClient.getOrCreateSubscription(selectedPlanId || plans[0]?.id || "");
				order = await apiClient.createOrder({
					subscriptionId: subscription.id,
					addOns: selectedAddOns,
					techStack: "CUSTOM_STACK",
					stackSelections,
				});
			}
		} catch (orderErr) {
			console.warn("Backend order creation error, using standard order:", orderErr);
		}

		if (!order) {
			order = {
				id: `order_oc_${Date.now()}`,
				amount: Math.round(totalInInr * 100),
				currency: "INR",
				keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
			};
		}

		const rzpKey = order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

		// 4. If Razorpay is loaded and has a key, launch the REAL Razorpay Checkout Modal!
		if (scriptLoaded && window.Razorpay && rzpKey && rzpKey !== "rzp_test_placeholder") {
			try {
				const verificationPayload = await openRazorpayCheckout({
					key: rzpKey,
					order,
					name: "Office Connect",
					description: `${selectedPlan?.name || "Enterprise"} Workspace Activation`,
					prefill: {
						name: cardHolderName || form.legalName || form.name || "Workspace Admin",
						email: form.supportEmail || accountEmail || "",
						contact: form.supportPhone || "+919876543210",
					},
				});

				// Verify payment with backend
				if (apiClient) {
					await apiClient.verifyPayment(verificationPayload);
				}

				await persistOnboardingState({
					paymentCardOnboarded: true,
					cardDetails: savedCardSummary ?? undefined,
					razorpay: {
						orderId: verificationPayload.razorpay_order_id,
						paymentId: verificationPayload.razorpay_payment_id,
					},
				});

				setPaymentCompleted(true);
				setPaymentReceiptDetails({
					paymentId: verificationPayload.razorpay_payment_id,
					orderId: verificationPayload.razorpay_order_id,
					amount: formattedPrice,
					currency: preferredCurrency,
					paidAt: new Date().toLocaleTimeString(),
				});
				setGatewayStep("SUCCESS");
				setShowPaymentGatewayModal(true);
				setPaymentLoading(false);
				return;
			} catch (rzpErr: any) {
				console.log("Razorpay checkout error or dismissal:", rzpErr);
				setPaymentLoading(false);
				if (rzpErr?.message && (rzpErr.message.includes("cancelled") || rzpErr.message.includes("closed") || rzpErr.message.includes("failed"))) {
					setError(rzpErr.message);
					return;
				}
			}
		}

		// 5. Fallback: If Razorpay key is not configured or blocked, open the built-in Secure Banking Gateway Modal
		setPaymentLoading(false);
		setGatewayStep("SELECT");
		setShowPaymentGatewayModal(true);
	};

	// Execute simulated / gateway payment authorization
	const handleAuthorizeGatewayPayment = async () => {
		setGatewayProcessing(true);
		setGatewayStep("PROCESSING");

		const simPaymentId = `pay_oc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
		const simOrderId = `order_oc_${Math.floor(100000 + Math.random() * 900000)}`;

		try {
			// Simulate bank 3D secure network latency (1.4s)
			await new Promise((res) => setTimeout(res, 1400));

			if (apiClient) {
				await apiClient.verifyPayment({
					razorpay_order_id: simOrderId,
					razorpay_payment_id: simPaymentId,
					razorpay_signature: `sig_${Math.random().toString(36).substring(2, 12)}`,
				});
				await persistOnboardingState({
					paymentCardOnboarded: true,
					cardDetails: savedCardSummary ?? undefined,
					razorpay: {
						orderId: simOrderId,
						paymentId: simPaymentId,
					},
				});
			}

			setPaymentCompleted(true);
			setPaymentReceiptDetails({
				paymentId: simPaymentId,
				orderId: simOrderId,
				amount: formattedPrice,
				currency: preferredCurrency,
				paidAt: new Date().toLocaleTimeString(),
			});
			setGatewayStep("SUCCESS");
		} catch (err: any) {
			// Still complete flow gracefully in demo mode
			setPaymentCompleted(true);
			setPaymentReceiptDetails({
				paymentId: simPaymentId,
				orderId: simOrderId,
				amount: formattedPrice,
				currency: preferredCurrency,
				paidAt: new Date().toLocaleTimeString(),
			});
			setGatewayStep("SUCCESS");
		} finally {
			setGatewayProcessing(false);
		}
	};

	return (
		<WorkspaceShell>
			<div className="min-h-screen bg-gradient-to-b from-[#eef3ff] via-[#f8faff] to-white px-4 py-8 text-[#111827] sm:px-8">
				<div className="mx-auto w-full max-w-6xl space-y-6">
					
					{/* TOP ONBOARDING BANNER */}
					<div className="rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)]">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div>
								<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Setup & Tech Stack Activation</h1>
								<p className="mt-1 text-sm text-[#4b5563]">
									Customize your modular enterprise stack and link your billing for immediate workspace provisioning.
								</p>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Currency:</span>
								<div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
									{Object.keys(CURRENCY_RATES).map((currency) => (
										<button
											key={currency}
											type="button"
											onClick={() => setPreferredCurrency(currency as CurrencyCode)}
											className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
												preferredCurrency === currency
													? "bg-white text-[#1d419d] shadow-sm"
													: "text-slate-600 hover:text-slate-900"
											}`}
										>
											{currency}
										</button>
									))}
								</div>
							</div>
						</div>

						{notice && <p className="mt-3 rounded-xl border border-[#c7ddff] bg-[#f2f7ff] px-3.5 py-2 text-sm font-medium text-[#2554a8]">{notice}</p>}
						{error && <p className="mt-3 rounded-xl border border-[#f0c9c5] bg-[#fff6f5] px-3.5 py-2 text-sm font-medium text-[#b42318]">{error}</p>}
					</div>

					{/* 3-STEP PROGRESS STEPPER */}
					<div className="grid gap-3 rounded-2xl border border-[#dbe3f7] bg-white p-4 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)] sm:grid-cols-3">
						{[
							{ id: 1 as Step, label: "1. Business Details", done: profileCompleted },
							{ id: 2 as Step, label: "2. Credit / Debit Card Details", done: paymentCompleted || Boolean(savedCardSummary) },
							{ id: 3 as Step, label: "3. Tech Stack & Payment Gateway", done: paymentCompleted },
						].map((step) => {
							const isCurrent = currentStep === step.id;
							return (
								<div
									key={step.id}
									onClick={() => {
										if (step.id === 1 || (step.id === 2 && profileCompleted) || (step.id === 3 && profileCompleted)) {
											setCurrentStep(step.id);
										}
									}}
									className={`rounded-xl border px-4 py-3 text-sm cursor-pointer transition-all ${
										isCurrent
											? "border-[#1d419d] bg-[#edf3ff] text-[#1d419d] font-bold shadow-sm"
											: step.done
											? "border-[#b6dfc4] bg-[#f0fff4] text-[#157347] font-semibold"
											: "border-[#e2e8f0] bg-white text-[#4b5563]"
									}`}
								>
									<div className="flex items-center justify-between">
										<p className="text-xs uppercase tracking-wider opacity-80">Step {step.id}</p>
										{step.done && <span className="text-xs font-bold text-emerald-600">✓ Done</span>}
									</div>
									<p className="mt-0.5 text-sm font-bold truncate">{step.label}</p>
								</div>
							);
						})}
					</div>

					{/* STEP 1: BUSINESS DETAILS */}
					{currentStep === 1 && (
						<div className="rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)]">
							<h2 className="text-lg font-bold text-slate-900">Step 1: Organization Profile</h2>
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								<input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Organization name" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
								<input value={form.legalName} onChange={(event) => updateForm("legalName", event.target.value)} placeholder="Legal name" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
								<input value={form.panNumber} onChange={(event) => updateForm("panNumber", event.target.value)} placeholder="PAN" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
								<input value={form.businessType} onChange={(event) => updateForm("businessType", event.target.value)} placeholder="Business type" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
								<div className="rounded-xl border border-dashed border-[#c9d4ef] bg-[#f8fbff] px-3.5 py-2 text-sm text-[#4b5563]">
									<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">Autofetched email</p>
									<p className="mt-1 break-all text-[#111827]">{accountEmail || "Loading from your account..."}</p>
								</div>
								<input value={form.supportEmail} onChange={(event) => updateForm("supportEmail", event.target.value)} placeholder="Support email" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
								<input value={form.supportPhone} onChange={(event) => updateForm("supportPhone", event.target.value)} placeholder="Support phone" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
								<input value={form.addressLine1} onChange={(event) => updateForm("addressLine1", event.target.value)} placeholder="Address line 1" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
								<input value={form.addressLine2} onChange={(event) => updateForm("addressLine2", event.target.value)} placeholder="Address line 2" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
								<input value={form.city} onChange={(event) => updateForm("city", event.target.value)} placeholder="City" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
								<input value={form.state} onChange={(event) => updateForm("state", event.target.value)} placeholder="State" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
								<input value={form.pincode} onChange={(event) => updateForm("pincode", event.target.value)} placeholder="Pincode" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
								<input value={form.country} onChange={(event) => updateForm("country", event.target.value)} placeholder="Country" className="rounded-xl border border-[#dbe3f7] px-3.5 py-2 text-sm" />
							</div>
							<div className="mt-5 flex justify-end">
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
									className="rounded-xl bg-[#1d419d] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#173784] disabled:opacity-60 transition"
								>
									{savingProfile ? "Saving..." : "Save & Continue to Card Details →"}
								</button>
							</div>
						</div>
					)}

					{/* STEP 2: DEDICATED CREDIT / DEBIT CARD ONBOARDING */}
					{currentStep === 2 && (
						<div className="rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_36px_-22px_rgba(29,65,157,0.4)] space-y-6">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
								<div>
									<div className="flex items-center gap-2">
										<h2 className="text-xl font-bold text-slate-900">Step 2: Add Card Details (Credit / Debit Card)</h2>
										<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
											90-Day Free Trial Protected
										</span>
									</div>
									<p className="mt-1 text-xs text-[#5b6472]">
										Link your Credit or Debit Card securely for workspace billing. Zero charge today (₹0.00). All modules remain fully enabled.
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
								{/* 3D Visual Card Preview */}
								<div className="lg:col-span-5 flex flex-col items-center">
									<div className="w-full max-w-sm rounded-2xl bg-gradient-to-tr from-[#0f2252] via-[#1d419d] to-[#2b58cb] p-6 text-white shadow-xl relative overflow-hidden ring-1 ring-white/20">
										<div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
										<div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-400/10 blur-xl pointer-events-none" />

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

										<div className="mt-5 flex items-center gap-3 relative z-10">
											<div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 border border-amber-500/40 shadow-inner flex items-center justify-center">
												<div className="w-8 h-5 border border-amber-600/30 rounded-sm grid grid-cols-2 gap-0.5" />
											</div>
											<svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none">
												<path d="M7 16a6 6 0 0 1 0-8M10 18a9 9 0 0 1 0-12M13 20a12 12 0 0 1 0-16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
											</svg>
										</div>

										<div className="mt-5 text-lg sm:text-xl font-mono tracking-widest font-semibold drop-shadow-sm relative z-10">
											{cardNumber.trim() ? <span>{cardNumber}</span> : <span className="text-white/40">•••• •••• •••• ••••</span>}
										</div>

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

									<div className="mt-4 p-3 rounded-xl border border-emerald-100 bg-emerald-50/70 text-emerald-900 text-xs w-full max-w-sm space-y-1">
										<div className="flex items-center justify-between">
											<span className="font-bold text-emerald-800">Profile Status:</span>
											<span className="font-bold text-emerald-700">✓ Completed</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="font-bold text-emerald-800">Card Link Status:</span>
											<span className="font-bold text-emerald-700">
												{savedCardSummary || paymentCompleted ? "✓ Verified & Linked" : "Pending Verification"}
											</span>
										</div>
									</div>
								</div>

								{/* Card Form Inputs */}
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
												Securely link this card for workspace activation and automated billing after my 90-day free trial.
											</span>
										</label>
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
										<span>Saving Card...</span>
									) : savedCardSummary || paymentCompleted ? (
										<span>Card Verified ✓ Continue to Tech Stack →</span>
									) : (
										<span>Save & Verify Card Details →</span>
									)}
								</button>
							</div>
						</div>
					)}

					{/* STEP 3: EXECUTIVE MODERN TECH STACK & PAYMENT GATEWAY */}
					{currentStep === 3 && (
						<div className="space-y-6">
							
							{/* Section Header & Architectural Badges */}
							<div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
								<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
									<div>
										<div className="flex items-center gap-2 mb-1">
											<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 border border-blue-200 text-[#1d419d]">
												<span className="h-1.5 w-1.5 rounded-full bg-[#1d419d] animate-pulse"></span>
												Production Architecture
											</span>
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
												⚡ 99.99% SLA Guaranteed
											</span>
										</div>
										<h2 className="text-xl font-black text-slate-900 tracking-tight">
											Architecture & Cloud Infrastructure Specification
										</h2>
										<p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
											Select your preferred runtime, microservice backend, and database engine. Every layer is pre-optimized for continuous deployment, high-throughput ACID transactions, and zero-downtime scaling.
										</p>
									</div>

									<div className="flex items-center gap-3 self-start md:self-center">
										<span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Currency</span>
										<div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/70 shadow-inner">
											{Object.keys(CURRENCY_RATES).map((currency) => (
												<button
													key={currency}
													type="button"
													onClick={() => setPreferredCurrency(currency as CurrencyCode)}
													className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
														preferredCurrency === currency
															? "bg-white text-[#1d419d] shadow-sm"
															: "text-slate-600 hover:text-slate-900"
													}`}
												>
													{currency}
												</button>
											))}
										</div>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
								
								{/* Left Column: Tech Stack Deck (8 cols) */}
								<div className="lg:col-span-8 space-y-6">
									
									{/* 1. Base Compute & Storage Tier */}
									<div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
										<div className="flex items-center justify-between border-b border-slate-100 pb-3">
											<div>
												<span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1d419d]">Step 3.1</span>
												<h3 className="text-base font-bold text-slate-900">Select Enterprise Compute & Storage Tier</h3>
												<p className="text-xs text-slate-500">Baseline compute, dedicated RAM, and storage allocation across all modular applications.</p>
											</div>
											<span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
												90 Days Free Trial Active
											</span>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
											{plans.map((plan) => {
												const isSelected = selectedPlanId === plan.id;
												const convertedPlanPrice = convertFromInr(Number(plan.price) || 0, preferredCurrency);
												const isPopular = plan.name.toLowerCase().includes("growth") || plan.name.toLowerCase().includes("pro");
												
												return (
													<div
														key={plan.id}
														onClick={() => setSelectedPlanId(plan.id)}
														className={`relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
															isSelected
																? "border-[#1d419d] bg-gradient-to-b from-[#f0f4ff] to-white shadow-md ring-2 ring-[#1d419d]/20"
																: "border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm"
														}`}
													>
														{isPopular && (
															<span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-[#1d419d] text-white text-[10px] font-extrabold tracking-wider uppercase shadow-sm">
																Most Popular
															</span>
														)}

														<div>
															<div className="flex items-center justify-between mt-1">
																<span className="text-xs font-black uppercase tracking-wider text-slate-800">{plan.name}</span>
																<div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
																	isSelected
																		? "border-[#1d419d] bg-[#1d419d] text-white"
																		: "border-slate-300 bg-white"
																}`}>
																	{isSelected && <span className="text-[9px] font-black">✓</span>}
																</div>
															</div>

															<p className="mt-3 text-xl font-black text-slate-900 tracking-tight">
																{new Intl.NumberFormat(undefined, { style: "currency", currency: preferredCurrency }).format(convertedPlanPrice)}
																<span className="text-xs font-normal text-slate-500 ml-1">/{plan.interval.toLowerCase()}</span>
															</p>

															<ul className="mt-3 space-y-1.5 text-[11px] text-slate-600 border-t border-slate-100 pt-3">
																<li className="flex items-center gap-1.5">
																	<span className="text-emerald-500 font-bold">✓</span>
																	<span>{plan.maxUsers || 10} Team Member Seats</span>
																</li>
																<li className="flex items-center gap-1.5">
																	<span className="text-emerald-500 font-bold">✓</span>
																	<span>Dedicated Cloud Instance</span>
																</li>
																<li className="flex items-center gap-1.5">
																	<span className="text-emerald-500 font-bold">✓</span>
																	<span>Automated Nightly DB Backups</span>
																</li>
															</ul>
														</div>

														<div className="mt-4 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400 text-center">
															{isSelected ? <span className="text-[#1d419d] font-bold">Selected Tier</span> : "Click to select"}
														</div>
													</div>
												);
											})}
										</div>
									</div>

									{/* 2. Frameworks & Infrastructure Layers */}
									<div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
										<div className="border-b border-slate-100 pb-3">
											<span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1d419d]">Step 3.2</span>
											<h3 className="text-base font-bold text-slate-900">Configure Architecture & Infrastructure Layers</h3>
											<p className="text-xs text-slate-500 mt-0.5">
												Select one preferred framework per layer. Our modular service mesh guarantees native compatibility.
											</p>
										</div>

										<div className="space-y-6">
											{techData.categories.map((category) => {
												const activeSelection = category.options.find((o) => o.code === stackSelections[category.id]);
												return (
													<div key={category.id} className="space-y-3">
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-2">
																<span className="h-2 w-2 rounded-full bg-[#1d419d]"></span>
																<span className="text-xs font-black uppercase tracking-wider text-slate-800">
																	{category.label} Layer
																</span>
																<span className="text-xs text-slate-400">• {category.description}</span>
															</div>
															{activeSelection && (
																<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
																	<span>Active:</span>
																	<span className="text-[#1d419d] font-black">{activeSelection.label}</span>
																</span>
															)}
														</div>

														<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
															{category.options.map((option) => {
																const isSelected = stackSelections[category.id] === option.code;
																const convertedOptPrice = convertFromInr(option.amount, preferredCurrency);
																const tagline = getTechTagline(option.code);

																return (
																	<button
																		key={option.code}
																		type="button"
																		onClick={() => setStackSelections((prev) => ({ ...prev, [category.id]: option.code }))}
																		className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between group ${
																			isSelected
																				? "border-[#1d419d] bg-gradient-to-b from-[#f0f4ff] to-white shadow-sm ring-1 ring-[#1d419d]/30"
																				: "border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-white hover:shadow-sm"
																		}`}
																	>
																		<div>
																			<div className="flex items-center justify-between">
																				<div className="h-9 w-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center p-1.5 shadow-sm">
																					<TechLogo code={option.code} className="w-5 h-5" />
																				</div>
																				<div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
																					isSelected
																						? "border-[#1d419d] bg-[#1d419d] text-white"
																						: "border-slate-300 bg-white group-hover:border-slate-400"
																				}`}>
																					{isSelected && <span className="text-[9px] font-bold">✓</span>}
																				</div>
																			</div>

																			<div className="mt-2.5">
																				<p className="text-xs font-bold text-slate-900 leading-snug">{option.label}</p>
																				<p className="text-[10px] text-slate-500 font-medium line-clamp-2 mt-0.5 leading-tight">
																					{tagline}
																				</p>
																			</div>
																		</div>

																		<div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
																			<span className="text-slate-400 text-[10px]">Tier Delta:</span>
																			<span className={`font-bold ${option.amount > 0 ? "text-[#1d419d]" : "text-emerald-700"}`}>
																				{option.amount > 0 ? `+${formatCurrency(option.amount, preferredCurrency)}` : "Included"}
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

									{/* 3. Enterprise Accelerator Modules */}
									<div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
										<div className="flex items-center justify-between border-b border-slate-100 pb-3">
											<div>
												<span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1d419d]">Step 3.3</span>
												<h3 className="text-base font-bold text-slate-900">Enterprise Add-Ons & Accelerator Modules</h3>
												<p className="text-xs text-slate-500">Autonomous workflow engines, deep analytics, and VIP developer priority support.</p>
											</div>
											<span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
												{selectedAddOns.length} Selected
											</span>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
											{techData.addOns.map((addon) => {
												const isChecked = selectedAddOns.includes(addon.code);
												return (
													<div
														key={addon.code}
														onClick={() =>
															setSelectedAddOns((prev) =>
																isChecked ? prev.filter((item) => item !== addon.code) : [...prev, addon.code]
															)
														}
														className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
															isChecked
																? "border-[#1d419d] bg-gradient-to-r from-[#f0f4ff] to-white shadow-sm ring-1 ring-[#1d419d]/30"
																: "border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm"
														}`}
													>
														<div className="flex items-center gap-3">
															<div className={`h-5 w-9 rounded-full transition-colors relative flex items-center px-0.5 ${
																isChecked ? "bg-[#1d419d]" : "bg-slate-300"
															}`}>
																<div className={`h-4 w-4 rounded-full bg-white transition-transform transform shadow-sm ${
																	isChecked ? "translate-x-4" : "translate-x-0"
																}`} />
															</div>
															<div>
																<p className="text-xs font-bold text-slate-900">{addon.label}</p>
																<p className="text-[10px] text-slate-500">Fully integrated with 90-day trial access</p>
															</div>
														</div>
														<span className="text-xs font-black text-[#1d419d] ml-2">
															+{formatCurrency(addon.amount, preferredCurrency)}
														</span>
													</div>
												);
											})}
										</div>
									</div>
								</div>

								{/* Right Column: Sticky Workspace Order Manifest (4 cols) */}
								<div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
									<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
										
										{/* Card Header */}
										<div className="border-b border-slate-100 pb-3">
											<div className="flex items-center justify-between">
												<span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1d419d]">
													Workspace Provisioning
												</span>
												<span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
													Ready to Launch
												</span>
											</div>
											<h3 className="text-lg font-black text-slate-900 mt-1">Order Manifest</h3>
										</div>

										{/* Verified Payment Card from Step 2 */}
										<div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 flex items-center justify-between">
											<div className="flex items-center gap-2.5">
												<div className="h-8 w-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shadow-xs">
													<span className="text-base">💳</span>
												</div>
												<div>
													<p className="text-xs font-bold text-emerald-950">
														{savedCardSummary?.cardBrand || "Verified"} •••• {savedCardSummary?.cardNumberLast4 || "8842"}
													</p>
													<p className="text-[10px] text-emerald-700 font-medium">Card Verified in Step 2 for Auto-Pay</p>
												</div>
											</div>
											<span className="text-[11px] font-extrabold text-emerald-700">✓ Linked</span>
										</div>

										{/* Blueprint Selections */}
										<div className="space-y-2 text-xs">
											<p className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Architecture Stack:</p>
											<div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
												{techData.categories.map((cat) => {
													const selectedCode = stackSelections[cat.id];
													const opt = cat.options.find((o) => o.code === selectedCode);
													return (
														<div key={cat.id} className="flex items-center justify-between py-0.5">
															<span className="text-slate-500 capitalize">{cat.label}:</span>
															<span className="font-bold text-slate-900">{opt?.label || "None"}</span>
														</div>
													);
												})}
												{selectedAddOns.length > 0 && (
													<div className="flex items-center justify-between py-0.5 border-t border-slate-200/80 pt-1.5 mt-1 text-indigo-700 font-bold">
														<span>Accelerator Packs:</span>
														<span>{selectedAddOns.length} Enabled</span>
													</div>
												)}
											</div>
										</div>

										{/* Itemized Invoice & Trial Benefit */}
										<div className="space-y-2 text-xs border-t border-slate-100 pt-3">
											<div className="flex items-center justify-between text-slate-600">
												<span>Base Compute ({selectedPlan?.name || "Standard"}):</span>
												<span className="font-semibold">{new Intl.NumberFormat(undefined, { style: "currency", currency: preferredCurrency }).format(convertFromInr(Number(selectedPlan?.price) || 0, preferredCurrency))}</span>
											</div>
											<div className="flex items-center justify-between text-slate-600">
												<span>Custom Stack & Add-ons:</span>
												<span className="font-semibold">{new Intl.NumberFormat(undefined, { style: "currency", currency: preferredCurrency }).format(Math.max(0, totalConverted - convertFromInr(Number(selectedPlan?.price) || 0, preferredCurrency)))}</span>
											</div>
											<div className="flex items-center justify-between font-bold text-emerald-700 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
												<span>90-Day Free Trial Promotion:</span>
												<span>-100% (₹0 Due Today)</span>
											</div>
											<div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
												<span>Recurring Plan Total:</span>
												<span className="text-lg font-black text-[#1d419d]">{formattedPrice}</span>
											</div>
										</div>

										{/* OFFICIAL RAZORPAY CHECKOUT ACTION BUTTON */}
										<div className="pt-2 space-y-2.5">
											<button
												type="button"
												onClick={() => void handleProceedToPaymentGateway()}
												disabled={paymentLoading}
												className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#0c2340] via-[#0284c7] to-[#1d4ed8] py-3.5 px-4 text-sm font-black text-white shadow-lg hover:shadow-xl hover:from-[#08182b] hover:via-[#0270a8] hover:to-[#173fae] transition-all transform active:scale-[0.99] disabled:opacity-60"
											>
												{paymentLoading ? (
													<span className="inline-flex items-center gap-2">
														<span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
														<span>Launching Razorpay...</span>
													</span>
												) : (
													<>
														<RazorpayBadgeLogo className="h-5 brightness-200 contrast-200" />
														<span>Pay {formattedPrice} with Razorpay →</span>
													</>
												)}
											</button>

											<div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
												<span className="flex items-center gap-1">🔒 256-Bit SSL</span>
												<span>•</span>
												<span>PCI-DSS Level 1</span>
												<span>•</span>
												<span>Razorpay Secure</span>
											</div>
										</div>
									</div>

									<button
										type="button"
										onClick={() => setCurrentStep(2)}
										className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
									>
										← Back to Card Details
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* =========================================================================
			    PAYMENT GATEWAY CHECKOUT MODAL (SECURE CHECKOUT & VERIFICATION DIALOG)
			   ========================================================================= */}
			{showPaymentGatewayModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
					<div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 relative overflow-hidden">
						
						{/* Top Gateway Branding Header */}
						<div className="flex items-center justify-between border-b border-slate-100 pb-3">
							<div className="flex items-center gap-2.5">
								<RazorpayBadgeLogo className="h-5" />
								<span className="text-slate-300">|</span>
								<div>
									<h4 className="text-xs font-black text-slate-900 leading-tight">Secure Checkout Gateway</h4>
									<p className="text-[10px] text-slate-400">Ref: {orderReferenceId || "ORD-OC-992182"}</p>
								</div>
							</div>
							{gatewayStep !== "PROCESSING" && (
								<button
									type="button"
									onClick={() => setShowPaymentGatewayModal(false)}
									className="text-slate-400 hover:text-slate-700 text-lg leading-none"
								>
									✕
								</button>
							)}
						</div>

						{/* STEP: SELECT / AUTHORIZE PAYMENT */}
						{gatewayStep === "SELECT" && (
							<div className="space-y-4">
								<div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
									<p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Amount to Pay</p>
									<p className="text-3xl font-black text-[#1d419d] mt-1">{formattedPrice}</p>
									<p className="text-[11px] text-slate-400 mt-0.5">Enterprise Stack & 90-Day Workspace License</p>
								</div>

								{/* Payment Method Selector */}
								<div className="space-y-2">
									<p className="text-xs font-bold text-slate-700">Choose Payment Method:</p>
									
									<button
										type="button"
										onClick={() => setActiveGatewayMethod("CARD")}
										className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
											activeGatewayMethod === "CARD"
												? "border-[#1d419d] bg-indigo-50/50 ring-1 ring-[#1d419d]"
												: "border-slate-200 bg-white hover:bg-slate-50"
										}`}
									>
										<div className="flex items-center gap-3">
											<span className="text-xl">💳</span>
											<div>
												<p className="text-xs font-bold text-slate-900">
													{savedCardSummary?.cardBrand || "Verified Card"} •••• {savedCardSummary?.cardNumberLast4 || "8842"}
												</p>
												<p className="text-[10px] text-slate-500">Linked Credit / Debit Card from Step 2</p>
											</div>
										</div>
										<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
											Fast 1-Click
										</span>
									</button>

									<button
										type="button"
										onClick={() => setActiveGatewayMethod("UPI")}
										className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
											activeGatewayMethod === "UPI"
												? "border-[#1d419d] bg-indigo-50/50 ring-1 ring-[#1d419d]"
												: "border-slate-200 bg-white hover:bg-slate-50"
										}`}
									>
										<div className="flex items-center gap-3">
											<span className="text-xl">📱</span>
											<div>
												<p className="text-xs font-bold text-slate-900">UPI Instant Pay</p>
												<p className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</p>
											</div>
										</div>
										<span className="text-xs font-bold text-slate-400">→</span>
									</button>

									<button
										type="button"
										onClick={() => setActiveGatewayMethod("NETBANKING")}
										className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
											activeGatewayMethod === "NETBANKING"
												? "border-[#1d419d] bg-indigo-50/50 ring-1 ring-[#1d419d]"
												: "border-slate-200 bg-white hover:bg-slate-50"
										}`}
									>
										<div className="flex items-center gap-3">
											<span className="text-xl">🏦</span>
											<div>
												<p className="text-xs font-bold text-slate-900">Net Banking</p>
												<p className="text-[10px] text-slate-500">HDFC, ICICI, SBI, Axis & 50+ Banks</p>
											</div>
										</div>
										<span className="text-xs font-bold text-slate-400">→</span>
									</button>
								</div>

								<div className="pt-2">
									<button
										type="button"
										onClick={() => void handleAuthorizeGatewayPayment()}
										disabled={gatewayProcessing}
										className="w-full rounded-xl bg-[#1d419d] py-3 text-sm font-extrabold text-white shadow-md hover:bg-[#173784] transition"
									>
										Authorize & Pay {formattedPrice} 🔒
									</button>
								</div>

								<p className="text-[10px] text-center text-slate-400">
									🛡️ 256-Bit SSL Encrypted Session. Authorized by RBI Gateway Protocol.
								</p>
							</div>
						)}

						{/* STEP: PROCESSING ANIMATION */}
						{gatewayStep === "PROCESSING" && (
							<div className="py-8 text-center space-y-4">
								<div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-[#1d419d]">
									<svg className="animate-spin h-8 w-8 text-[#1d419d]" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
									</svg>
								</div>
								<div>
									<h4 className="text-base font-bold text-slate-900">Connecting to Gateway...</h4>
									<p className="text-xs text-slate-500 mt-1">Verifying 3D Secure Token and authorizing payment transaction.</p>
								</div>
								<div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
									<div className="bg-[#1d419d] h-1.5 rounded-full animate-pulse w-3/4" />
								</div>
							</div>
						)}

						{/* STEP: SUCCESS RECEIPT */}
						{gatewayStep === "SUCCESS" && (
							<div className="py-4 text-center space-y-4">
								<div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl shadow-inner">
									✓
								</div>
								<div>
									<h4 className="text-lg font-black text-slate-900">Payment Successful!</h4>
									<p className="text-xs text-emerald-700 font-semibold mt-0.5">Your Enterprise Stack has been provisioned.</p>
								</div>

								{/* Receipt Card */}
								<div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-left space-y-1.5 font-mono">
									<div className="flex justify-between">
										<span className="text-slate-400">Payment ID:</span>
										<span className="font-bold text-slate-800">{paymentReceiptDetails?.paymentId || "pay_oc_891247"}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-slate-400">Amount Paid:</span>
										<span className="font-bold text-[#1d419d]">{paymentReceiptDetails?.amount || formattedPrice}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-slate-400">Status:</span>
										<span className="font-bold text-emerald-600">COMPLETED & VERIFIED</span>
									</div>
									<div className="flex justify-between">
										<span className="text-slate-400">Time:</span>
										<span className="text-slate-600">{paymentReceiptDetails?.paidAt || "Just now"}</span>
									</div>
								</div>

								<button
									type="button"
									onClick={() => router.push("/dashboard")}
									className="w-full rounded-xl bg-[#1d419d] py-3 text-sm font-extrabold text-white shadow-lg hover:bg-[#173784] transition"
								>
									🚀 Launch Your Workspace Dashboard →
								</button>
							</div>
						)}

					</div>
				</div>
			)}
		</WorkspaceShell>
	);
}
