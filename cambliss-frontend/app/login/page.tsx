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

function EyeIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-zinc-400">
			<path
				d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
		</svg>
	);
}

const onboardingSteps = [
	"Business profile onboarding",
	"Subscription activation",
	"Module launcher access",
];

const platformModules = ["Finance Dashboard", "CEO Report", "GST & Compliance", "AI Insights"];

type SubscriptionSnapshot = {
	status?: string;
	plan?: { name?: string };
	currentPeriodEnd?: string;
};

export default function LoginPage() {
	const searchParams = useSearchParams();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);

	const nextPath = useMemo(() => {
		const raw = searchParams.get("next") || "";
		if (!raw.startsWith("/") || raw.startsWith("//")) {
			return "";
		}
		return raw;
	}, [searchParams]);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
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

				const data = (await response.json()) as SubscriptionSnapshot | null;
				setSubscription(data);
			} catch {
				setSubscription(null);
			}
		};

		void fetchSubscription();
	}, []);

	const subscriptionLabel = useMemo(() => {
		if (!subscription?.status) {
			return "No active subscription yet";
		}

		return subscription.status.replaceAll("_", " ");
	}, [subscription]);

	const renewalLabel = useMemo(() => {
		if (!subscription?.currentPeriodEnd) {
			return "Plan renewal date will appear after activation";
		}

		return `Current period ends on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`;
	}, [subscription]);

	const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
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

				throw new Error(data?.message || "Login failed");
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
			setError(err.message || "Unable to login");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#edf2ff] via-[#dfe9ff] to-[#edf2ff] px-4 py-8 lg:px-8">
			<div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
				<div className="w-full rounded-[36px] border border-white/70 bg-white/60 p-3 shadow-[0_24px_90px_rgba(29,65,157,0.18)] backdrop-blur-sm">
					<div className="grid grid-cols-1 gap-3 rounded-[30px] border border-[#d7e0f7] bg-white p-3 lg:grid-cols-[360px_1fr]">
						<div className="rounded-[22px] bg-white p-8 lg:p-10">
							<div className="mb-9">
								<div className="flex items-center">
									<Image src="/officeconnectlogo.png" alt="Office Connect" width={400} height={108} priority className="h-28 w-auto object-contain" />
								</div>
								<h1 className="mt-10 text-[36px] font-semibold tracking-tight text-[#1d419d]">Welcome back!</h1>
								<p className="mt-2 text-[15px] text-[#6f84ad]">Login to your account</p>
							</div>

							<form onSubmit={handleLogin} className="space-y-4.5">
								<div>
									<label className="mb-2 block text-[13px] font-semibold text-[#5b74a4]">Email</label>
									<input
										type="email"
										required
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										placeholder="you@company.com"
										className="h-11 w-full rounded-[11px] border border-[#d7e0f7] bg-white px-4 text-sm text-[#35558e] outline-none ring-0 transition focus:border-[#1d419d]"
									/>
								</div>

								<div>
									<div className="mb-2 flex items-center justify-between">
										<label className="block text-[13px] font-semibold text-[#5b74a4]">Password</label>
									</div>
									<div className="relative">
										<input
											type="password"
											required
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											placeholder="Enter your password"
											className="h-11 w-full rounded-[11px] border border-[#d7e0f7] bg-white px-4 pr-10 text-sm text-[#35558e] outline-none ring-0 transition focus:border-[#1d419d]"
										/>
										<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
											<EyeIcon />
										</span>
									</div>
									<div className="mt-2 text-right">
										<a href="#" className="text-[12px] font-semibold text-[#5b74a4] hover:text-[#1d419d]">Forgot password?</a>
									</div>
								</div>

								{error && <p className="text-sm text-red-600">{error}</p>}

								<button
									type="submit"
									disabled={loading}
									className="mt-1 h-11 w-full rounded-[11px] bg-[#1d419d] text-sm font-semibold text-white transition hover:bg-[#173784] disabled:cursor-not-allowed disabled:bg-[#90a5cf]"
								>
									{loading ? "Signing in..." : "Sign in"}
								</button>
							</form>

							<p className="mt-6 text-center text-[14px] text-[#6f84ad]">
								Don&apos;t have an account?{" "}
								<a href={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"} className="font-semibold text-[#1d419d] hover:underline">Sign up</a>
							</p>
						</div>

						<div className="relative hidden overflow-hidden rounded-[22px] border border-[#d7e0f7] bg-gradient-to-br from-[#edf2ff] to-[#dfe9ff] p-8 lg:block">
							<div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/70 blur-2xl" />
							<div className="absolute -bottom-16 -right-14 h-80 w-80 rounded-full bg-white/65 blur-3xl" />
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.7),transparent_60%)]" />
							<div className="relative z-10 flex h-full flex-col">
								<div className="ml-auto">
									<a
										href="/"
										className="inline-flex items-center rounded-xl border border-[#d7e0f7] bg-white/80 px-4 py-2 text-xs font-semibold text-[#35558e] backdrop-blur hover:bg-white"
									>
										Workspace Home
									</a>
								</div>
								<div className="mt-auto max-w-xl pb-8">
									<div className="mb-5 flex items-center gap-2">
										<SparkIcon />
									</div>
									<h2 className="text-4xl font-semibold leading-tight tracking-tight text-[#1d419d]">
										Continue onboarding, activate subscription, and launch your live modules.
									</h2>
									<div className="mt-6 space-y-3 border-l-2 border-[#8ea5d1] pl-4 text-base leading-relaxed text-[#5b74a4]">
										{onboardingSteps.map((step) => (
											<p key={step}>• {step}</p>
										))}
									</div>
									<div className="mt-6 rounded-xl border border-[#d7e0f7] bg-white/80 p-4">
										<p className="text-xs font-semibold uppercase tracking-wide text-[#6f84ad]">Your subscription</p>
										<p className="mt-1 text-lg font-semibold text-[#1d419d]">{subscription?.plan?.name || "Not selected"}</p>
										<p className="mt-1 text-sm text-[#5b74a4]">Status: {subscriptionLabel}</p>
										<p className="mt-1 text-xs text-[#6f84ad]">{renewalLabel}</p>
									</div>
									<div className="mt-6 flex flex-wrap gap-2">
										{platformModules.map((module) => (
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
