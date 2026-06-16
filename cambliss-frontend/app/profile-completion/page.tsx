"use client";

import { useEffect, useMemo, useState } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";

type AuthUser = {
	id: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	organizationId: string;
	role: string;
};

type OrganizationProfile = {
	id: string;
	name: string;
	legalName?: string | null;
	panNumber?: string | null;
	businessType?: string | null;
	supportEmail?: string | null;
	supportPhone?: string | null;
	addressLine1?: string | null;
	addressLine2?: string | null;
	city?: string | null;
	state?: string | null;
	pincode?: string | null;
	country?: string | null;
	settlementAccountHolderName?: string | null;
	settlementAccountNumber?: string | null;
	settlementIFSC?: string | null;
};

type GSTConfig = {
	gstNumber: string;
	legalName: string;
	tradeName?: string | null;
	stateCode: string;
	isComposition: boolean;
};

type SubscriptionSnapshot = {
	status: string;
	currentPeriodEnd: string;
	plan?: {
		name?: string;
		currency?: string;
		interval?: string;
	};
};

type MeResponse = {
	user: AuthUser;
	organization: OrganizationProfile | null;
};

type OrganizationForm = {
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
	settlementAccountHolderName: string;
	settlementAccountNumber: string;
	settlementIFSC: string;
};

type GSTForm = {
	gstNumber: string;
	legalName: string;
	tradeName: string;
	stateCode: string;
	isComposition: boolean;
};

type StepStatus = "complete" | "in-progress" | "pending";

type OnboardingStep = {
	title: string;
	description: string;
	status: StepStatus;
	completedChecks: number;
	totalChecks: number;
};

const statusStyles: Record<StepStatus, string> = {
	complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
	"in-progress": "bg-amber-50 text-amber-700 border-amber-200",
	pending: "bg-zinc-100 text-zinc-700 border-zinc-300",
};

export default function ProfileCompletionPage() {
	const [authUser, setAuthUser] = useState<AuthUser | null>(null);
	const [organization, setOrganization] = useState<OrganizationProfile | null>(null);
	const [gstConfig, setGstConfig] = useState<GSTConfig | null>(null);
	const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
	const [saveMessage, setSaveMessage] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [gstSaveMessage, setGstSaveMessage] = useState<string | null>(null);
	const [gstSaving, setGstSaving] = useState(false);
	const [businessEditMode, setBusinessEditMode] = useState(false);
	const [gstEditMode, setGstEditMode] = useState(false);
	const [organizationForm, setOrganizationForm] = useState<OrganizationForm>({
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
		country: "",
		settlementAccountHolderName: "",
		settlementAccountNumber: "",
		settlementIFSC: "",
	});
	const [gstForm, setGstForm] = useState<GSTForm>({
		gstNumber: "",
		legalName: "",
		tradeName: "",
		stateCode: "",
		isComposition: false,
	});

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			return;
		}

		const fetchMe = async () => {
			try {
				const response = await fetch("/api/auth/me", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					return;
				}

				const data = (await response.json()) as MeResponse;
				setAuthUser(data.user || null);
				setOrganization(data.organization || null);
				if (data.user) {
					localStorage.setItem("authUser", JSON.stringify(data.user));
				}
			} catch {
				setAuthUser(null);
				setOrganization(null);
			}
		};

		void fetchMe();
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token || !authUser?.organizationId) {
			return;
		}

		const fetchSubscription = async () => {
			try {
				const response = await fetch("/api/subscription/my-subscription", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					return;
				}

				const data = (await response.json()) as SubscriptionSnapshot;
				setSubscription(data);
			} catch {
				setSubscription(null);
			}
		};

		const fetchGSTConfig = async () => {
			try {
				const response = await fetch(`/api/gst/config/${authUser.organizationId}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					return;
				}

				const data = (await response.json()) as GSTConfig;
				setGstConfig(data);
			} catch {
				setGstConfig(null);
			}
		};

		void fetchSubscription();
		void fetchGSTConfig();
	}, [authUser]);

	useEffect(() => {
		if (!gstConfig) {
			return;
		}

		setGstForm({
			gstNumber: gstConfig.gstNumber || "",
			legalName: gstConfig.legalName || "",
			tradeName: gstConfig.tradeName || "",
			stateCode: gstConfig.stateCode || "",
			isComposition: Boolean(gstConfig.isComposition),
		});
	}, [gstConfig]);

	useEffect(() => {
		if (!organization) {
			return;
		}

		setOrganizationForm({
			name: organization.name || "",
			legalName: organization.legalName || "",
			panNumber: organization.panNumber || "",
			businessType: organization.businessType || "",
			supportEmail: organization.supportEmail || "",
			supportPhone: organization.supportPhone || "",
			addressLine1: organization.addressLine1 || "",
			addressLine2: organization.addressLine2 || "",
			city: organization.city || "",
			state: organization.state || "",
			pincode: organization.pincode || "",
			country: organization.country || "",
			settlementAccountHolderName: organization.settlementAccountHolderName || "",
			settlementAccountNumber: organization.settlementAccountNumber || "",
			settlementIFSC: organization.settlementIFSC || "",
		});
	}, [organization]);

	const updateField = (key: keyof OrganizationForm, value: string) => {
		setOrganizationForm((prev) => ({ ...prev, [key]: value }));
	};

	const updateGSTField = (key: keyof GSTForm, value: string | boolean) => {
		setGstForm((prev) => ({ ...prev, [key]: value }));
	};

	const saveOrganizationProfile = async () => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			setSaveMessage("Please login again.");
			return;
		}

		setSaving(true);
		setSaveMessage(null);

		try {
			const response = await fetch("/api/auth/me/organization", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(organizationForm),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.message || "Failed to update organization profile");
			}

			setOrganization(data as OrganizationProfile);
			setSaveMessage("Organization profile updated.");
			setBusinessEditMode(false);
		} catch (error: any) {
			setSaveMessage(error?.message || "Unable to save profile now.");
		} finally {
			setSaving(false);
		}
	};

	const deleteOrganizationProfile = async () => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			setSaveMessage("Please login again.");
			return;
		}

		setSaving(true);
		setSaveMessage(null);

		try {
			const response = await fetch("/api/auth/me/organization", {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.message || "Failed to delete organization profile details");
			}

			setOrganization(data as OrganizationProfile);
			setSaveMessage("Organization onboarding details cleared.");
		} catch (error: any) {
			setSaveMessage(error?.message || "Unable to delete profile details now.");
		} finally {
			setSaving(false);
		}
	};

	const saveGSTProfile = async () => {
		const token = localStorage.getItem("authToken");
		if (!token || !authUser?.organizationId) {
			setGstSaveMessage("Please login again.");
			return;
		}

		setGstSaving(true);
		setGstSaveMessage(null);

		const payload = {
			gstNumber: gstForm.gstNumber.trim().toUpperCase(),
			legalName: gstForm.legalName.trim(),
			tradeName: gstForm.tradeName.trim() || undefined,
			stateCode: gstForm.stateCode.trim(),
			isComposition: gstForm.isComposition,
		};

		try {
			let response = await fetch(`/api/gst/config/${authUser.organizationId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});

			if (response.status === 404) {
				response = await fetch(`/api/gst/config/${authUser.organizationId}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(payload),
				});
			}

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || data?.message || "Failed to update GST profile");
			}

			setGstConfig(data as GSTConfig);
			setGstSaveMessage("GST compliance profile updated.");
			setGstEditMode(false);
		} catch (error: any) {
			setGstSaveMessage(error?.message || "Unable to save GST profile now.");
		} finally {
			setGstSaving(false);
		}
	};

	const deleteGSTProfile = async () => {
		const token = localStorage.getItem("authToken");
		if (!token || !authUser?.organizationId) {
			setGstSaveMessage("Please login again.");
			return;
		}

		setGstSaving(true);
		setGstSaveMessage(null);

		try {
			const response = await fetch(`/api/gst/config/${authUser.organizationId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || data?.message || "Failed to delete GST profile");
			}

			setGstConfig(null);
			setGstForm({
				gstNumber: "",
				legalName: "",
				tradeName: "",
				stateCode: "",
				isComposition: false,
			});
			setGstSaveMessage("GST compliance profile deleted.");
		} catch (error: any) {
			setGstSaveMessage(error?.message || "Unable to delete GST profile now.");
		} finally {
			setGstSaving(false);
		}
	};

	const onboardingSteps = useMemo<OnboardingStep[]>(() => {
		const ownerChecks = [Boolean(authUser?.email), Boolean(authUser?.firstName), Boolean(authUser?.lastName), Boolean(authUser?.organizationId)];
		const businessChecks = [Boolean(organization?.name), Boolean(organization?.legalName), Boolean(organization?.businessType)];
		const taxChecks = [Boolean(organization?.panNumber), Boolean(gstConfig?.gstNumber), Boolean(gstConfig?.stateCode), Boolean(gstConfig?.legalName)];
		const settlementChecks = [
			Boolean(organization?.settlementAccountHolderName),
			Boolean(organization?.settlementAccountNumber),
			Boolean(organization?.settlementIFSC),
		];

		const ownerCompleted = ownerChecks.filter(Boolean).length;
		const businessCompleted = businessChecks.filter(Boolean).length;
		const taxCompleted = taxChecks.filter(Boolean).length;
		const settlementCompleted = settlementChecks.filter(Boolean).length;

		const hasOwner = ownerCompleted === ownerChecks.length;
		const hasBusinessIdentity = businessCompleted === businessChecks.length;
		const hasTaxProfile = taxCompleted === taxChecks.length;
		const subscriptionStatus = subscription?.status?.toUpperCase();
		const hasSubscription = Boolean(subscriptionStatus);
		const hasActiveSubscription = subscriptionStatus === "ACTIVE";
		const hasSettlementAccount = settlementCompleted === settlementChecks.length;

		return [
			{
				title: "1) Account Owner Verification",
				description: "Primary admin identity used for account ownership and dashboard access.",
				status: hasOwner ? "complete" : "pending",
				completedChecks: ownerCompleted,
				totalChecks: ownerChecks.length,
			},
			{
				title: "2) Business Identity Setup",
				description: "Legal and business profile details used for merchant onboarding.",
				status: hasBusinessIdentity ? "complete" : businessCompleted > 0 ? "in-progress" : "pending",
				completedChecks: businessCompleted,
				totalChecks: businessChecks.length,
			},
			{
				title: "3) Tax/KYC Profile",
				description: "GST details mapped for compliance-grade invoicing and filing.",
				status: hasTaxProfile ? "complete" : taxCompleted > 0 ? "in-progress" : "pending",
				completedChecks: taxCompleted,
				totalChecks: taxChecks.length,
			},
			{
				title: "4) Plan & Billing Activation",
				description: "Subscription lifecycle aligned with plan assignment and payment verification.",
				status: hasActiveSubscription ? "complete" : hasSubscription ? "in-progress" : "pending",
				completedChecks: hasActiveSubscription ? 4 : hasSubscription ? 2 : 0,
				totalChecks: 4,
			},
			{
				title: "5) Settlement Bank Account",
				description: "Payment onboarding requires account holder, account number, and IFSC.",
				status: hasSettlementAccount ? "complete" : settlementCompleted > 0 ? "in-progress" : "pending",
				completedChecks: settlementCompleted,
				totalChecks: settlementChecks.length,
			},
		];
	}, [authUser, organization, gstConfig, subscription]);

	const completionScore = useMemo(() => {
		const completed = onboardingSteps.filter((step) => step.status === "complete").length;
		return Math.round((completed / onboardingSteps.length) * 100);
	}, [onboardingSteps]);

	return (
		<WorkspaceShell>
			<div className="mt-5 space-y-5">
				<div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-5 shadow-[0_26px_60px_-30px_rgba(0,0,0,0.95)] ring-1 ring-white/10">
					<div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
					<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Onboarding</p>
					<h1 className="mt-1 text-2xl font-semibold text-white">Profile Completion</h1>
					<p className="mt-1 text-sm text-zinc-300">Completion score: {completionScore}% fetched from your current account data.</p>
					<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/20">
						<div className="h-full rounded-full bg-white" style={{ width: `${completionScore}%` }} />
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70 lg:col-span-2">
						<div className="flex items-center justify-between gap-3">
							<h2 className="text-lg font-semibold">Business Onboarding Profile</h2>
							<button
								onClick={() => setBusinessEditMode((prev) => !prev)}
								className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
							>
								✎ {businessEditMode ? "Cancel Edit" : "Edit"}
							</button>
						</div>
						<p className="mt-1 text-sm text-zinc-600">Business profile inputs for merchant onboarding readiness.</p>
						<p className="mt-1 text-xs font-medium text-zinc-500">{businessEditMode ? "Edit mode is ON" : "Click Edit to modify details"}</p>

						<fieldset disabled={!businessEditMode} className="mt-4 grid grid-cols-1 gap-3 disabled:opacity-70 md:grid-cols-2">
							<input value={organizationForm.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Organization Name" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.legalName} onChange={(event) => updateField("legalName", event.target.value)} placeholder="Legal Name" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.panNumber} onChange={(event) => updateField("panNumber", event.target.value.toUpperCase())} placeholder="PAN Number" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase outline-none focus:border-zinc-900" />
							<input value={organizationForm.businessType} onChange={(event) => updateField("businessType", event.target.value)} placeholder="Business Type" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.supportEmail} onChange={(event) => updateField("supportEmail", event.target.value)} placeholder="Support Email" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.supportPhone} onChange={(event) => updateField("supportPhone", event.target.value)} placeholder="Support Phone" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.addressLine1} onChange={(event) => updateField("addressLine1", event.target.value)} placeholder="Address Line 1" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.addressLine2} onChange={(event) => updateField("addressLine2", event.target.value)} placeholder="Address Line 2" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.city} onChange={(event) => updateField("city", event.target.value)} placeholder="City" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.state} onChange={(event) => updateField("state", event.target.value)} placeholder="State" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.pincode} onChange={(event) => updateField("pincode", event.target.value)} placeholder="Pincode" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.country} onChange={(event) => updateField("country", event.target.value)} placeholder="Country" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.settlementAccountHolderName} onChange={(event) => updateField("settlementAccountHolderName", event.target.value)} placeholder="Settlement Account Holder Name" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.settlementAccountNumber} onChange={(event) => updateField("settlementAccountNumber", event.target.value)} placeholder="Settlement Account Number" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={organizationForm.settlementIFSC} onChange={(event) => updateField("settlementIFSC", event.target.value.toUpperCase())} placeholder="Settlement IFSC" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase outline-none focus:border-zinc-900" />
						</fieldset>

						<div className="mt-4 flex items-center gap-3">
							<button onClick={saveOrganizationProfile} disabled={saving || !businessEditMode} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-500">
								{saving ? "Saving..." : "Save Organization Profile"}
							</button>
							<button onClick={deleteOrganizationProfile} disabled={saving || !businessEditMode} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60">
								Delete Details
							</button>
							{saveMessage && <p className="text-sm text-zinc-600">{saveMessage}</p>}
						</div>
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70 lg:col-span-2">
						<div className="flex items-center justify-between gap-3">
							<h2 className="text-lg font-semibold">Tax & Compliance (GST)</h2>
							<button
								onClick={() => setGstEditMode((prev) => !prev)}
								className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
							>
								✎ {gstEditMode ? "Cancel Edit" : "Edit"}
							</button>
						</div>
						<p className="mt-1 text-sm text-zinc-600">Configure GST profile used for invoicing, returns, and compliance workflows.</p>
						<p className="mt-1 text-xs font-medium text-zinc-500">{gstEditMode ? "Edit mode is ON" : "Click Edit to modify GST details"}</p>

						<fieldset disabled={!gstEditMode} className="mt-4 grid grid-cols-1 gap-3 disabled:opacity-70 md:grid-cols-2">
							<input value={gstForm.gstNumber} onChange={(event) => updateGSTField("gstNumber", event.target.value.toUpperCase())} placeholder="GSTIN" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase outline-none focus:border-zinc-900" />
							<input value={gstForm.legalName} onChange={(event) => updateGSTField("legalName", event.target.value)} placeholder="GST Legal Name" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={gstForm.tradeName} onChange={(event) => updateGSTField("tradeName", event.target.value)} placeholder="Trade Name" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<input value={gstForm.stateCode} onChange={(event) => updateGSTField("stateCode", event.target.value)} placeholder="State Code (e.g. 36)" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<label className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 md:col-span-2">
								<input type="checkbox" checked={gstForm.isComposition} onChange={(event) => updateGSTField("isComposition", event.target.checked)} />
								Composition scheme enabled
							</label>
						</fieldset>

						<div className="mt-4 flex items-center gap-3">
							<button onClick={saveGSTProfile} disabled={gstSaving || !gstEditMode} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-500">
								{gstSaving ? "Saving..." : "Save GST Profile"}
							</button>
							<button onClick={deleteGSTProfile} disabled={gstSaving || !gstEditMode} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60">
								Delete GST
							</button>
							{gstSaveMessage && <p className="text-sm text-zinc-600">{gstSaveMessage}</p>}
						</div>
					</div>

					{onboardingSteps.map((step) => {
						const ratio = Math.round((step.completedChecks / step.totalChecks) * 100);
						return (
						<div
							key={step.title}
							className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-5 shadow-[0_18px_42px_-24px_rgba(0,0,0,0.5)] ring-1 ring-white/80"
						>
							<div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-zinc-200/55 blur-2xl" />
							<div className="flex items-start justify-between gap-3">
								<h2 className="text-base font-semibold tracking-tight text-zinc-900">{step.title}</h2>
								<span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[step.status]}`}>
									{step.status.replace("-", " ")}
								</span>
							</div>
							<p className="mt-2 text-sm text-zinc-600">{step.description}</p>
							<div className="mt-3 rounded-xl border border-zinc-200/80 bg-white/90 p-3 shadow-inner">
								<div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-500">
									<span>Fetched status</span>
									<span>{step.completedChecks}/{step.totalChecks} checks</span>
								</div>
								<div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200/80">
									<div className="h-full rounded-full bg-zinc-900" style={{ width: `${ratio}%` }} />
								</div>
							</div>
						</div>
						);
					})}
					
				</div>
			</div>
		</WorkspaceShell>
	);
}
