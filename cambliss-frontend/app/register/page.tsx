"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmationResult, RecaptchaVerifier, getAuth, signInWithPhoneNumber } from "firebase/auth";
import { firebaseApp, isFirebaseConfigured } from "../../lib/firebase";

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
		<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#6678c1]">
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
	"AI-Powered Financial Insights",
	"Automated GST & E-Way Bills",
	"Real-time Inventory Sync",
	"Unified CRM & HRM",
];

const launchModules = ["Accounting", "GST Compliance", "CRM", "HRM", "Inventory"];

const isFirebaseOtpMode = process.env.NEXT_PUBLIC_AUTH_OTP_PROVIDER === "FIREBASE";

const normalizePhoneForFirebase = (value: string) => {
	const normalized = value.trim().replace(/\s+/g, "");
	if (normalized.startsWith("+")) {
		return normalized;
	}

	if (/^\d{10,15}$/.test(normalized)) {
		return `+91${normalized}`;
	}

	return normalized;
};

type PlanSummary = {
	id: string;
	name: string;
	price: string | number;
	currency: string;
	interval: string;
};

export default function RegisterPage() {
	const [organizationName, setOrganizationName] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [plans, setPlans] = useState<PlanSummary[]>([]);
	const [nextPath, setNextPath] = useState("");

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const raw = new URLSearchParams(window.location.search).get("next") || "";
		if (!raw.startsWith("/") || raw.startsWith("//")) {
			setNextPath("");
			return;
		}

		setNextPath(raw);
	}, []);

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
					phone: isFirebaseOtpMode ? normalizePhoneForFirebase(phone) : phone,
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

			// Real JWT is stored in an httpOnly cookie by the backend; keep only a
			// non-sensitive marker so client login guards work without exposing the token to XSS.
			localStorage.setItem("authToken", "cookie-session");
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
			window.location.href = role === "SUPER_ADMIN" ? "/admin-dashboard" : "/dashboard";
		} catch (err: any) {
			setError(err.message || "Unable to register");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(154,183,219,0.14),transparent_36%),linear-gradient(180deg,#f8faff_0%,#eef2fa_48%,#edf2fa_100%)] px-4 py-8 lg:px-8">
			<div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center justify-center">
				<div className="w-full rounded-[40px] border border-white/70 bg-white/72 p-3 shadow-[0_28px_100px_rgba(64,77,133,0.16)] backdrop-blur-sm">
					<div className="grid grid-cols-1 gap-3 rounded-[34px] border border-[#d9e2ef] bg-white p-3 lg:grid-cols-[380px_1fr]">
						<div className="rounded-[24px] bg-white p-8 lg:p-12">
							<div className="mb-8 flex flex-col items-center">
								<img src="/officeconnectlogo.png" alt="Office Connect" className="h-12 w-auto object-contain" />
								<h1 className="mt-8 text-3xl font-semibold tracking-tight text-[#404d85]">Start your free trial</h1>
								<p className="mt-2 text-sm leading-6 text-[#5b6472]">Create your account and verify your mobile number.</p>
							</div>

							<form onSubmit={handleRegister} className="space-y-4">
								<div>
									<label className="mb-2 block text-sm font-medium text-[#5b6472]">Organization</label>
									<input
										type="text"
										required
										value={organizationName}
										onChange={(event) => setOrganizationName(event.target.value)}
										placeholder="Your Company Pvt Ltd"
										className="w-full rounded-xl border border-[#d9e2ef] bg-white px-4 py-2.5 text-sm text-[#1f2430] outline-none ring-0 transition focus:border-[#6678c1]"
									/>
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label className="mb-2 block text-sm font-medium text-[#5b6472]">First name</label>
										<input
											type="text"
											value={firstName}
											onChange={(event) => setFirstName(event.target.value)}
											placeholder="Jane"
											className="w-full rounded-xl border border-[#d9e2ef] bg-white px-4 py-2.5 text-sm text-[#1f2430] outline-none ring-0 transition focus:border-[#6678c1]"
										/>
									</div>
									<div>
										<label className="mb-2 block text-sm font-medium text-[#5b6472]">Last name</label>
										<input
											type="text"
											value={lastName}
											onChange={(event) => setLastName(event.target.value)}
											placeholder="Doe"
											className="w-full rounded-xl border border-[#d9e2ef] bg-white px-4 py-2.5 text-sm text-[#1f2430] outline-none ring-0 transition focus:border-[#6678c1]"
										/>
									</div>
								</div>

								<div>
									<label className="mb-2 block text-sm font-medium text-[#5b6472]">Phone number</label>
									<input
										type="tel"
										required
										value={phone}
										onChange={(event) => setPhone(event.target.value)}
										placeholder="+91 98765 43210"
										className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-foreground outline-none ring-0 transition focus:border-brand"
									/>
								</div>

								<div>
									<label className="mb-2 block text-sm font-medium text-[#5b6472]">Email</label>
									<input
										type="email"
										required
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										placeholder="you@company.com"
										className="w-full rounded-xl border border-[#d9e2ef] bg-white px-4 py-2.5 text-sm text-[#1f2430] outline-none ring-0 transition focus:border-[#6678c1]"
									/>
								</div>

								<div>
									<label className="mb-2 block text-sm font-medium text-[#5b6472]">Password</label>
									<input
										type="password"
										required
										minLength={6}
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										placeholder="At least 6 characters"
										className="w-full rounded-xl border border-[#d9e2ef] bg-white px-4 py-2.5 text-sm text-[#1f2430] outline-none ring-0 transition focus:border-[#6678c1]"
									/>
								</div>

								{error && <p className="text-sm text-red-600">{error}</p>}

								<button
									type="submit"
									disabled={loading}
									className="w-full rounded-xl bg-[#6678c1] py-3 text-sm font-semibold text-white transition hover:bg-[#404d85] disabled:cursor-not-allowed disabled:bg-[#b8c3df]"
								>
									{loading ? "Creating account..." : "Sign up"}
								</button>
							</form>

								<p className="mt-6 text-center text-sm text-[#5b6472]">
								Already have an account?{" "}
									<a href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"} className="font-semibold text-[#404d85] hover:underline">Log in</a>
							</p>
						</div>

						<div className="relative hidden overflow-hidden rounded-[24px] border border-line bg-gradient-to-br from-[#f8faff] to-[#eef2fa] p-8 lg:block">
							<div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/75 blur-2xl" />
							<div className="absolute -bottom-16 -right-14 h-80 w-80 rounded-full bg-white/70 blur-3xl" />
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.7),transparent_60%)]" />
							<div className="relative z-10 flex h-full flex-col">
								<div className="ml-auto">
									<a
										href="/"
										className="inline-flex items-center rounded-xl border border-line bg-white/85 px-4 py-2 text-xs font-semibold text-brand-strong backdrop-blur hover:bg-white"
									>
										Setup Flow
									</a>
								</div>
								<div className="mt-16 max-w-xl pb-8">
									<div className="mb-5 flex items-center gap-2">
										<SparkIcon />
									</div>
									<h2 className="text-4xl font-semibold leading-tight tracking-tight text-brand-strong">
										Your complete business operating system.
									</h2>
									<p className="mt-4 text-lg text-foreground-muted">
										Everything you need to manage finances, compliance, and daily operations in one intelligent platform.
									</p>
									<div className="mt-6 space-y-3 border-l-2 border-brand/30 pl-4 text-base leading-relaxed text-foreground-muted">
										{setupFlow.map((step) => (
											<p key={step}>• {step}</p>
										))}
									</div>
									<div className="mt-6 rounded-xl border border-line bg-white/85 p-4">
										<p className="text-xs font-semibold uppercase tracking-wide text-brand">90-Day Free Trial</p>
										<p className="mt-1 text-sm text-foreground-muted">Enjoy full, unrestricted access to all ERP modules during your free trial. No credit card required.</p>
									</div>
									<div className="mt-6 flex flex-wrap gap-2">
										{launchModules.map((module) => (
											<span
												key={module}
													className="rounded-full border border-line bg-white/80 px-3 py-1 text-xs font-semibold text-foreground-muted"
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