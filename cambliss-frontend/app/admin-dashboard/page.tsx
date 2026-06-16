"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

const getRoleFromToken = (token?: string | null): string | null => {
	if (!token) {
		return null;
	}

	try {
		const payloadPart = token.split(".")[1];
		if (!payloadPart) {
			return null;
		}

		const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
		const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
		const payload = JSON.parse(atob(padded)) as { role?: string };
		return payload.role ?? null;
	} catch {
		return null;
	}
};

type Plan = {
	id: string;
	name: string;
	description: string | null;
	features: string[];
	price: string | number;
	currency: string;
	interval: string;
	userLimit: number;
	storageLimit: number;
	isActive: boolean;
	createdAt?: string;
};

type PlanForm = {
	name: string;
	description: string;
	featuresText: string;
	price: string;
	currency: string;
	interval: string;
	userLimit: string;
	storageLimit: string;
};

const initialForm: PlanForm = {
	name: "",
	description: "",
	featuresText: "",
	price: "",
	currency: "USD",
	interval: "monthly",
	userLimit: "5",
	storageLimit: "5",
};

export default function AdminDashboardPage() {
	const router = useRouter();
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
	const [form, setForm] = useState<PlanForm>(initialForm);

	const authContext = useMemo(() => {
		if (typeof window === "undefined") {
			return { token: null as string | null, role: null as string | null };
		}

		const token = localStorage.getItem("authToken");
		const raw = localStorage.getItem("authUser");
		if (!raw) {
			return { token, role: getRoleFromToken(token) };
		}

		try {
			const parsed = JSON.parse(raw) as { role?: string };
			return { token, role: parsed.role ?? getRoleFromToken(token) };
		} catch {
			return { token, role: getRoleFromToken(token) };
		}
	}, []);

	const canAccessAdmin = authContext.role === "SUPER_ADMIN" || authContext.role === "ADMIN";

	const fetchPlans = async () => {
		if (!authContext.token) {
			setLoading(false);
			setError("Please login to access admin dashboard.");
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const response = await fetch("/api/admin/plans", {
				headers: {
					Authorization: `Bearer ${authContext.token}`,
				},
			});

			const raw = await response.text();
			const data = raw ? (JSON.parse(raw) as Plan[] | { message?: string }) : [];

			if (!response.ok) {
				setPlans([]);
				setError((data as { message?: string })?.message || "Unable to fetch plans.");
				return;
			}

			setPlans(Array.isArray(data) ? data : []);
		} catch {
			setPlans([]);
			setError("Unable to fetch plans.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!authContext.token) {
			router.replace("/login");
			return;
		}

		if (!canAccessAdmin) {
			router.replace("/dashboard");
			return;
		}

		void fetchPlans();
	}, [authContext.token, canAccessAdmin, router]);

	const resetForm = () => {
		setForm(initialForm);
		setEditingPlanId(null);
	};

	const startEdit = (plan: Plan) => {
		setEditingPlanId(plan.id);
		setForm({
			name: plan.name,
			description: plan.description ?? "",
			featuresText: (plan.features ?? []).join("\n"),
			price: String(plan.price),
			currency: plan.currency,
			interval: plan.interval,
			userLimit: String(plan.userLimit),
			storageLimit: String(plan.storageLimit),
		});
		setMessage(null);
		setError(null);
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!authContext.token) {
			setError("Unauthorized.");
			return;
		}

		setSubmitting(true);
		setError(null);
		setMessage(null);

		try {
			const features = form.featuresText
				.split(/\n|,/)
				.map((feature) => feature.trim())
				.filter((feature) => feature.length > 0);

			const payload = {
				name: form.name.trim(),
				description: form.description.trim() || undefined,
				features,
				price: Number(form.price),
				currency: form.currency.trim().toUpperCase(),
				interval: form.interval.trim().toLowerCase(),
				userLimit: Number(form.userLimit),
				storageLimit: Number(form.storageLimit),
			};

			const response = await fetch(editingPlanId ? `/api/admin/plans/${editingPlanId}` : "/api/admin/plans", {
				method: editingPlanId ? "PUT" : "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authContext.token}`,
				},
				body: JSON.stringify(payload),
			});

			const raw = await response.text();
			const data = raw ? (JSON.parse(raw) as { message?: string }) : null;

			if (!response.ok) {
				setError(data?.message || "Unable to save plan.");
				return;
			}

			setMessage(editingPlanId ? "Plan updated successfully." : "Plan created successfully.");
			resetForm();
			await fetchPlans();
		} catch {
			setError("Unable to save plan.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (planId: string) => {
		if (!authContext.token) {
			setError("Unauthorized.");
			return;
		}

		const confirmed = window.confirm("Delete this plan? This action cannot be undone.");
		if (!confirmed) {
			return;
		}

		setError(null);
		setMessage(null);

		try {
			const response = await fetch(`/api/admin/plans/${planId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${authContext.token}`,
				},
			});

			const raw = await response.text();
			const data = raw ? (JSON.parse(raw) as { message?: string }) : null;

			if (!response.ok) {
				setError(data?.message || "Unable to delete plan.");
				return;
			}

			setMessage("Plan deleted successfully.");
			if (editingPlanId === planId) {
				resetForm();
			}
			await fetchPlans();
		} catch {
			setError("Unable to delete plan.");
		}
	};

	return (
		<WorkspaceShell>
			<div className="mt-5 space-y-5">
				<div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
					<h1 className="text-2xl font-semibold">Admin Dashboard</h1>
					<p className="mt-1 text-sm text-zinc-600">Manage subscription plans and publish pricing updates for client dashboards.</p>
					<div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3">
						<p className="text-xs font-semibold text-zinc-900">CRM Usage Steps (Share with Client)</p>
						<ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-zinc-600">
							<li>Client creates lead in Sales Execution.</li>
							<li>Client clicks Use in Deal from Lead List.</li>
							<li>Client selects contact, pipeline, stage and creates deal.</li>
							<li>Client updates deal stage and checks history.</li>
							<li>Client uses Service, Marketing and Integrations tabs.</li>
						</ol>
					</div>
				</div>

				{!canAccessAdmin ? (
					<div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
						You don&apos;t have admin privileges to manage plans.
					</div>
				) : (
					<>
						<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
							<div className="flex items-center justify-between gap-3">
								<h2 className="text-lg font-semibold">{editingPlanId ? "Edit Plan" : "Create Plan"}</h2>
								{editingPlanId && (
									<button
										onClick={resetForm}
										className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
									>
										Cancel Edit
									</button>
								)}
							</div>

							<form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
								<input
									required
									value={form.name}
									onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
									placeholder="Plan Name"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
								/>
								<input
									required
									type="number"
									step="0.01"
									min="0.01"
									value={form.price}
									onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
									placeholder="Price"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
								/>
								<input
									value={form.description}
									onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
									placeholder="Description"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 md:col-span-2"
								/>
								<textarea
									value={form.featuresText}
									onChange={(event) => setForm((prev) => ({ ...prev, featuresText: event.target.value }))}
									placeholder={"Feature pointers (one per line)\nExample:\nGST filing automation\nUnlimited invoices\nPriority support"}
									rows={5}
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 md:col-span-2"
								/>
								<input
									required
									maxLength={3}
									value={form.currency}
									onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
									placeholder="Currency (USD)"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase outline-none focus:border-zinc-900"
								/>
								<select
									required
									value={form.interval}
									onChange={(event) => setForm((prev) => ({ ...prev, interval: event.target.value }))}
									className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
								>
									<option value="monthly">Monthly</option>
									<option value="yearly">Yearly</option>
								</select>
								<input
									required
									type="number"
									min="1"
									value={form.userLimit}
									onChange={(event) => setForm((prev) => ({ ...prev, userLimit: event.target.value }))}
									placeholder="Team User Limit"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
								/>
								<input
									required
									type="number"
									min="1"
									value={form.storageLimit}
									onChange={(event) => setForm((prev) => ({ ...prev, storageLimit: event.target.value }))}
									placeholder="Cloud Storage Limit (GB)"
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
								/>

								<p className="text-xs text-zinc-500 md:col-span-2">
									Example: if values are 5 and 5, it means max 5 users and 5 GB storage for that plan.
								</p>

								<div className="md:col-span-2">
									<button
										type="submit"
										disabled={submitting}
										className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-500"
									>
										{submitting ? "Saving..." : editingPlanId ? "Update Plan" : "Create Plan"}
									</button>
								</div>
							</form>

							{message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
							{error && <p className="mt-3 text-sm text-red-600">{error}</p>}
						</div>

						<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
							<div className="mb-4 flex items-center justify-between gap-3">
								<h2 className="text-lg font-semibold">Subscription Plans</h2>
								<button
									onClick={() => void fetchPlans()}
									className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
								>
									Refresh
								</button>
							</div>

							{loading ? (
								<p className="text-sm text-zinc-500">Loading plans...</p>
							) : plans.length === 0 ? (
								<p className="text-sm text-zinc-500">No plans found. Create your first plan above.</p>
							) : (
								<div className="space-y-3">
									{plans.map((plan) => (
										<div key={plan.id} className="rounded-xl border border-zinc-200 p-4">
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div>
													<p className="text-base font-semibold text-zinc-900">{plan.name}</p>
													<p className="text-sm text-zinc-600">{plan.description || "No description"}</p>
												</div>
												<div className="text-right">
													<p className="text-sm font-semibold text-zinc-900">{plan.currency} {plan.price}/{plan.interval}</p>
													<p className="text-xs text-zinc-500">Users: {plan.userLimit} · Storage: {plan.storageLimit}GB · {plan.features?.length ?? 0} pointers</p>
												</div>
											</div>
											{plan.features?.length > 0 && (
												<ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-zinc-600">
													{plan.features.slice(0, 6).map((feature) => (
														<li key={`${plan.id}-${feature}`}>{feature}</li>
													))}
													{plan.features.length > 6 && <li>+{plan.features.length - 6} more</li>}
												</ul>
											)}
											<div className="mt-3 flex gap-2">
												<button
													onClick={() => startEdit(plan)}
													className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
												>
													Edit
												</button>
												<button
													onClick={() => void handleDelete(plan.id)}
													className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
												>
													Delete
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</WorkspaceShell>
	);
}
