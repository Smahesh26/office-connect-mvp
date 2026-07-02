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
	"Create organization workspace",
	"Complete business onboarding",
	"Activate free trial",
	"Access core modules",
];

const launchModules = ["CRM", "HRM", "Inventory", "File Sharing", "Video Connect"];

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
	const [otp, setOtp] = useState("");
	const [otpRequestId, setOtpRequestId] = useState<string | null>(null);
	const [otpVerified, setOtpVerified] = useState(false);
	const [otpMessage, setOtpMessage] = useState<string | null>(null);
	const [sendingOtp, setSendingOtp] = useState(false);
	const [verifyingOtp, setVerifyingOtp] = useState(false);
	const [firebaseIdToken, setFirebaseIdToken] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [plans, setPlans] = useState<PlanSummary[]>([]);
	const [nextPath, setNextPath] = useState("");
	const confirmationRef = useRef<ConfirmationResult | null>(null);
	const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

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

	const resetOtpState = () => {
		setOtp("");
		setOtpRequestId(null);
		setOtpVerified(false);
		setOtpMessage(null);
		setFirebaseIdToken("");
		confirmationRef.current = null;
	};

	const handleSendOtp = async () => {
		setError(null);
		setOtpMessage(null);
		setFirebaseIdToken("");
		setOtpVerified(false);

		if (!phone.trim()) {
			setError("Phone number is required before sending OTP");
			return;
		}

		if (isFirebaseOtpMode) {
			if (!firebaseApp || !isFirebaseConfigured()) {
				setError("Firebase is not configured yet");
				return;
			}

			const firebasePhone = normalizePhoneForFirebase(phone);
			if (!firebasePhone.startsWith("+") || firebasePhone.length < 8) {
				setError("Enter phone in international format like +919876543210");
				return;
			}

			setSendingOtp(true);
			try {
				const auth = getAuth(firebaseApp);
				if (!recaptchaVerifierRef.current) {
					recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
						size: "invisible",
					});
					await recaptchaVerifierRef.current.render();
				}

				confirmationRef.current = await signInWithPhoneNumber(auth, firebasePhone, recaptchaVerifierRef.current);
				setOtpRequestId("firebase");
				setOtpMessage("Firebase OTP sent. Check your phone.");
			} catch (err: any) {
				setError(err.message || "Unable to send Firebase OTP");
			} finally {
				setSendingOtp(false);
			}

			return;
		}

		setSendingOtp(true);
		try {
			const response = await fetch("/api/auth/register/otp/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone }),
			});

			const data = (await response.json().catch(() => null)) as {
				message?: string;
				requestId?: string;
				expiresInSeconds?: number;
				otp?: string;
			} | null;

			if (!response.ok || !data?.requestId) {
				throw new Error(data?.message || "Unable to send OTP");
			}

			setOtpRequestId(data.requestId);
			setOtpVerified(false);
			setOtpMessage(data.otp
				? `OTP sent. Dev OTP: ${data.otp}`
				: `OTP sent successfully. It will expire in ${Math.round((data.expiresInSeconds || 300) / 60)} minutes.`);
		} catch (err: any) {
			setError(err.message || "Unable to send OTP");
		} finally {
			setSendingOtp(false);
		}
	};

	const handleVerifyOtp = async () => {
		setError(null);
		setOtpMessage(null);
		setFirebaseIdToken("");

		if (isFirebaseOtpMode) {
			if (!confirmationRef.current) {
				setError("Please send Firebase OTP first");
				return;
			}

			if (!otp.trim()) {
				setError("Enter OTP to verify");
				return;
			}

			setVerifyingOtp(true);
			try {
				const result = await confirmationRef.current.confirm(otp.trim());
				const idToken = await result.user.getIdToken();
				setFirebaseIdToken(idToken);
				setOtpVerified(true);
				setOtpMessage("Firebase phone verified successfully.");
			} catch (err: any) {
				setOtpVerified(false);
				setError(err.message || "Firebase OTP verification failed");
			} finally {
				setVerifyingOtp(false);
			}

			return;
		}

		if (!otpRequestId) {
			setError("Please send OTP first");
			return;
		}

		if (!otp.trim()) {
			setError("Enter OTP to verify");
			return;
		}

		setVerifyingOtp(true);
		try {
			const response = await fetch("/api/auth/register/otp/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					phone,
					requestId: otpRequestId,
					otp,
				}),
			});

			const data = (await response.json().catch(() => null)) as { message?: string; verified?: boolean } | null;
			if (!response.ok || !data?.verified) {
				throw new Error(data?.message || "OTP verification failed");
			}

			setOtpVerified(true);
			setOtpMessage("Mobile OTP verified successfully.");
		} catch (err: any) {
			setOtpVerified(false);
			setError(err.message || "OTP verification failed");
		} finally {
			setVerifyingOtp(false);
		}
	};

	const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isFirebaseOtpMode) {
			if (!otpVerified || !firebaseIdToken) {
				setError("Please verify Firebase OTP before creating account");
				return;
			}
		} else if (!otpVerified || !otpRequestId) {
			setError("Please verify mobile OTP before creating account");
			return;
		}
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
					otpRequestId: isFirebaseOtpMode ? undefined : otpRequestId,
					firebaseIdToken: isFirebaseOtpMode ? firebaseIdToken : undefined,
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
								<Image src="/officeconnect-reference-logo.png" alt="Office Connect" width={300} height={90} priority className="h-20 w-auto object-contain" />
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
										onChange={(event) => {
											setPhone(event.target.value);
											resetOtpState();
										}}
										placeholder={isFirebaseOtpMode ? "+919876543210" : "+91 98765 43210"}
										className="w-full rounded-xl border border-[#d9e2ef] bg-white px-4 py-2.5 text-sm text-[#1f2430] outline-none ring-0 transition focus:border-[#6678c1]"
									/>
									{isFirebaseOtpMode && <p className="mt-2 text-xs text-[#5b6472]">Firebase phone auth expects an international number like +919876543210.</p>}
									<div className="mt-2 flex items-center gap-2">
										<button
											type="button"
											onClick={() => void handleSendOtp()}
											disabled={sendingOtp || loading || !phone.trim()}
											className="rounded-lg border border-[#6678c1] px-3 py-1.5 text-xs font-semibold text-[#404d85] transition hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:border-[#b8c3df] disabled:text-[#b8c3df]"
										>
											{sendingOtp ? "Sending OTP..." : otpRequestId ? "Resend OTP" : isFirebaseOtpMode ? "Send Firebase OTP" : "Send OTP"}
										</button>
										{otpVerified && <span className="text-xs font-semibold text-green-700">Verified</span>}
									</div>
									{otpRequestId && (
										<div className="mt-2 flex items-center gap-2">
											<input
												type="text"
												value={otp}
												onChange={(event) => {
													setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
													if (otpVerified) {
														setOtpVerified(false);
													}
												}}
												placeholder="Enter 6-digit OTP"
												className="w-full rounded-xl border border-[#d9e2ef] bg-white px-4 py-2.5 text-sm text-[#1f2430] outline-none ring-0 transition focus:border-[#6678c1]"
											/>
											<button
												type="button"
												onClick={() => void handleVerifyOtp()}
												disabled={verifyingOtp || loading || otp.length !== 6}
												className="rounded-lg border border-[#6678c1] px-3 py-1.5 text-xs font-semibold text-[#404d85] transition hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:border-[#b8c3df] disabled:text-[#b8c3df]"
											>
												{verifyingOtp ? "Verifying..." : "Verify OTP"}
											</button>
										</div>
									)}
									{otpMessage && <p className="mt-2 text-xs text-[#404d85]">{otpMessage}</p>}
									{isFirebaseOtpMode && <div id="recaptcha-container" className="mt-2" />}
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

						<div className="relative hidden overflow-hidden rounded-[24px] border border-[#d9e2ef] bg-gradient-to-br from-[#f8faff] to-[#eef2fa] p-8 lg:block">
							<div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/75 blur-2xl" />
							<div className="absolute -bottom-16 -right-14 h-80 w-80 rounded-full bg-white/70 blur-3xl" />
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.7),transparent_60%)]" />
							<div className="relative z-10 flex h-full flex-col">
								<div className="ml-auto">
									<a
										href="/"
										className="inline-flex items-center rounded-xl border border-[#d9e2ef] bg-white/85 px-4 py-2 text-xs font-semibold text-[#404d85] backdrop-blur hover:bg-white"
									>
										Setup Flow
									</a>
								</div>
								<div className="mt-auto max-w-xl pb-8">
									<div className="mb-5 flex items-center gap-2">
										<SparkIcon />
									</div>
									<h2 className="text-4xl font-semibold leading-tight tracking-tight text-[#404d85]">
										Start your workspace with onboarding and subscription from day one.
									</h2>
									<div className="mt-6 space-y-3 border-l-2 border-[#b8c3df] pl-4 text-base leading-relaxed text-[#5b6472]">
										{setupFlow.map((step) => (
											<p key={step}>• {step}</p>
										))}
									</div>
									<div className="mt-6 rounded-xl border border-[#d9e2ef] bg-white/85 p-4">
										<p className="text-xs font-semibold uppercase tracking-wide text-[#5b6472]">Available plans</p>
										{plans.length > 0 ? (
											<div className="mt-2 space-y-1.5">
												{plans.map((plan) => (
													<p key={plan.id} className="text-sm text-[#5b6472]">
														{plan.name} · {plan.currency} {plan.price}/{plan.interval.toLowerCase()}
													</p>
												))}
											</div>
										) : (
											<p className="mt-2 text-sm text-[#5b6472]">Plans will appear once configured by admin.</p>
										)}
									</div>
									<div className="mt-6 flex flex-wrap gap-2">
										{launchModules.map((module) => (
											<span
												key={module}
													className="rounded-full border border-[#d9e2ef] bg-white/80 px-3 py-1 text-xs font-semibold text-[#5b6472]"
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