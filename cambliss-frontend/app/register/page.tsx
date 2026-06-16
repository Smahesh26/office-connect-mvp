"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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

function SparkIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#35558e]">
			<path d="M12 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M3 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M18 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M5.64 5.64l2.12 2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M16.24 16.24l2.12 2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M18.36 5.64l-2.12 2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M7.76 16.24l-2.12 2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	);
}

const setupFlow = [
	"Create organization workspace",
	"Complete business onboarding",
	"Activate subscription plan",
	"Access available modules",
];

const launchModules = ["Finance Dashboard", "CEO Report", "Accounting", "Inventory", "GST"];

type PlanSummary = {
	id: string;
	name: string;
	price: string | number;
	currency: string;
	interval: string;
};

export default function RegisterPage() {
	const searchParams = useSearchParams();
	const [organizationName, setOrganizationName] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [plans, setPlans] = useState<PlanSummary[]>([]);

	const nextPath = useMemo(() => {
		const raw = searchParams.get("next") || "";
		if (!raw.startsWith("/") || raw.startsWith("//")) {
			return "";
		}
		return raw;
	}, [searchParams]);

	useEffect(() => {
		const fetchPlans = async () => {
			try {
				const response = await fetch("/api/plans");
				if (!response.ok) {
					return;
				}

				const data = (await response.json()) as PlanSummary[];
				setPlans(Array.isArray(data) ? data.slice(0, 3) : []);
			} catch {
				setPlans([]);
			}
		};

		void fetchPlans();
	}, []);

	const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					organizationName,
					firstName,
					lastName,
					email,
					password,
				}),
			});

			const rawResponse = await response.text();
			let data: any = null;

			try {
				data = rawResponse ? JSON.parse(rawResponse) : null;
			} catch {
				data = null;
			}

			if (!response.ok) {
				if (!data && rawResponse.startsWith("<!DOCTYPE")) {
					throw new Error("Backend API is not reachable. Please run backend and try again.");
				}

				throw new Error(data?.message || "Registration failed");
			}

			if (!data?.token) {
				throw new Error("Token missing in response");
			}

			localStorage.setItem("authToken", data.token);
			if (data.user) {
				localStorage.setItem("authUser", JSON.stringify(data.user));
			} else {
				localStorage.removeItem("authUser");
			}

			if (nextPath) {
				window.location.href = nextPath;
				return;
			}

			const role = (data?.user?.role as string | undefined) ?? getRoleFromToken(data.token) ?? undefined;
			window.location.href = role === "SUPER_ADMIN" || role === "ADMIN" ? "/admin-dashboard" : "/dashboard";
		} catch (err: any) {
			setError(err.message || "Unable to register");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#edf2ff] via-[#dfe9ff] to-[#edf2ff] px-4 py-8 lg:px-8">
			<div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
				<div className="w-full rounded-[34px] border border-white/70 bg-white/55 p-3 shadow-[0_20px_80px_rgba(29,65,157,0.18)] backdrop-blur-sm">
					<div className="grid grid-cols-1 gap-3 rounded-[28px] border border-[#d7e0f7] bg-white p-3 lg:grid-cols-[360px_1fr]">
						<div className="rounded-[20px] bg-white p-8 lg:p-10">
							<div className="mb-8">
								<Image src="/officeconnectlogo.png" alt="Office Connect" width={400} height={108} priority className="h-28 w-auto object-contain" />
								<h1 className="mt-8 text-3xl font-semibold tracking-tight text-[#1d419d]">Welcome</h1>
								<p className="mt-2 text-sm text-[#6f84ad]">Create your account</p>
							</div>

							<form onSubmit={handleRegister} className="space-y-4">
								<div>
									<label className="mb-2 block text-sm font-medium text-[#5b74a4]">Organization</label>
									<input
										type="text"
										required
										value={organizationName}
										onChange={(event) => setOrganizationName(event.target.value)}
										placeholder="Your Company Pvt Ltd"
										className="w-full rounded-xl border border-[#d7e0f7] bg-white px-4 py-2.5 text-sm text-[#35558e] outline-none ring-0 transition focus:border-[#1d419d]"
									/>
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label className="mb-2 block text-sm font-medium text-[#5b74a4]">First name</label>
										<input
											type="text"
											value={firstName}
											onChange={(event) => setFirstName(event.target.value)}
											placeholder="Jane"
											className="w-full rounded-xl border border-[#d7e0f7] bg-white px-4 py-2.5 text-sm text-[#35558e] outline-none ring-0 transition focus:border-[#1d419d]"
										/>
									</div>
									<div>
										<label className="mb-2 block text-sm font-medium text-[#5b74a4]">Last name</label>
										<input
											type="text"
											value={lastName}
											onChange={(event) => setLastName(event.target.value)}
											placeholder="Doe"
											className="w-full rounded-xl border border-[#d7e0f7] bg-white px-4 py-2.5 text-sm text-[#35558e] outline-none ring-0 transition focus:border-[#1d419d]"
										/>
									</div>
								</div>

								<div>
									<label className="mb-2 block text-sm font-medium text-[#5b74a4]">Email</label>
									<input
										type="email"
										required
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										placeholder="you@company.com"
										className="w-full rounded-xl border border-[#d7e0f7] bg-white px-4 py-2.5 text-sm text-[#35558e] outline-none ring-0 transition focus:border-[#1d419d]"
									/>
								</div>

								<div>
									<label className="mb-2 block text-sm font-medium text-[#5b74a4]">Password</label>
									<input
										type="password"
										required
										minLength={6}
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										placeholder="At least 6 characters"
										className="w-full rounded-xl border border-[#d7e0f7] bg-white px-4 py-2.5 text-sm text-[#35558e] outline-none ring-0 transition focus:border-[#1d419d]"
									/>
								</div>

								{error && <p className="text-sm text-red-600">{error}</p>}

								<button
									type="submit"
									disabled={loading}
									className="w-full rounded-xl bg-[#1d419d] py-3 text-sm font-semibold text-white transition hover:bg-[#173784] disabled:cursor-not-allowed disabled:bg-[#90a5cf]"
								>
									{loading ? "Creating account..." : "Sign up"}
								</button>
							</form>

							<p className="mt-6 text-center text-sm text-[#6f84ad]">
								Already have an account?{" "}
								<a href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"} className="font-semibold text-[#1d419d] hover:underline">Log in</a>
							</p>
						</div>

						<div className="relative hidden overflow-hidden rounded-[20px] border border-[#d7e0f7] bg-gradient-to-br from-[#edf2ff] to-[#dfe9ff] p-8 lg:block">
							<div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/70 blur-2xl" />
							<div className="absolute -bottom-16 -right-14 h-80 w-80 rounded-full bg-white/65 blur-3xl" />
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.7),transparent_60%)]" />
							<div className="relative z-10 flex h-full flex-col">
								<div className="ml-auto">
									<a
										href="/"
										className="inline-flex items-center rounded-xl border border-[#d7e0f7] bg-white/80 px-4 py-2 text-xs font-semibold text-[#35558e] backdrop-blur hover:bg-white"
									>
										Setup Flow
									</a>
								</div>
								<div className="mt-auto max-w-xl pb-8">
									<div className="mb-5 flex items-center gap-2">
										<SparkIcon />
									</div>
									<h2 className="text-4xl font-semibold leading-tight tracking-tight text-[#1d419d]">
										Start your workspace with onboarding and subscription from day one.
									</h2>
									<div className="mt-6 space-y-3 border-l-2 border-[#8ea5d1] pl-4 text-base leading-relaxed text-[#5b74a4]">
										{setupFlow.map((step) => (
											<p key={step}>• {step}</p>
										))}
									</div>
									<div className="mt-6 rounded-xl border border-[#d7e0f7] bg-white/80 p-4">
										<p className="text-xs font-semibold uppercase tracking-wide text-[#6f84ad]">Available plans</p>
										{plans.length > 0 ? (
											<div className="mt-2 space-y-1.5">
												{plans.map((plan) => (
													<p key={plan.id} className="text-sm text-[#5b74a4]">
														{plan.name} · {plan.currency} {plan.price}/{plan.interval.toLowerCase()}
													</p>
												))}
											</div>
										) : (
											<p className="mt-2 text-sm text-[#6f84ad]">Plans will appear once configured by admin.</p>
										)}
									</div>
									<div className="mt-6 flex flex-wrap gap-2">
										{launchModules.map((module) => (
											<span
												key={module}
												className="rounded-full border border-[#d7e0f7] bg-white/75 px-3 py-1 text-xs font-semibold text-[#5b74a4]"
											>
												{module}
											</span>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}