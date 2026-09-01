"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

const TRIAL_DAYS = 90;

const TRIAL_START_KEY = "trialActivatedAt";
const TRIAL_REMINDER_DAYS = [14, 7, 3, 1];
const ENABLE_ONBOARDING_REDIRECT = false;

type TrialReminderSnapshot = {
	organizationId: string;
	trialStartsAt: string;
	trialEndsAt: string;
	status: "TRIALING" | "EXPIRED" | "ACTIVE" | "NO_SUBSCRIPTION";
	daysLeft: number;
	timeLeftMs: number;
	reminderMessage: string;
	notificationThresholds: number[];
	maxUsersDuringTrial: number;
};

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

const parseStoredDate = (value: string | null): Date | null => {
	if (!value) {
		return null;
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return parsed;
};

const formatDuration = (milliseconds: number) => {
	if (milliseconds <= 0) {
		return "00d 00h 00m 00s";
	}

	const totalSeconds = Math.floor(milliseconds / 1000);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return `${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
	return `${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
};

export default function DashboardPage() {
	const router = useRouter();
	const cardClass =
		"rounded-[24px] border border-[#d9e2ef] bg-white p-5 shadow-[0_18px_42px_-30px_rgba(64,77,133,0.18)] ring-1 ring-white/80";
	
	const [now, setNow] = useState(new Date());
	const [trialStart, setTrialStart] = useState<Date | null>(null);
	const [trialSnapshot, setTrialSnapshot] = useState<TrialReminderSnapshot | null>(null);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		const rawUser = localStorage.getItem("authUser");
		if (!rawUser && !token) {
			return;
		}

		try {
			const parsed = rawUser ? (JSON.parse(rawUser) as { role?: string }) : { role: undefined };
			const resolvedRole = parsed.role ?? getRoleFromToken(token);
			if (resolvedRole === "SUPER_ADMIN") {
				router.replace("/admin-dashboard");
			}
		} catch {
			const resolvedRole = getRoleFromToken(token);
			if (resolvedRole === "SUPER_ADMIN") {
				router.replace("/admin-dashboard");
			}
		}
	}, [router]);

	useEffect(() => {
		if (!ENABLE_ONBOARDING_REDIRECT) {
			return;
		}

		const token = localStorage.getItem("authToken");
		if (!token) {
			return;
		}

		if (!trialSnapshot) {
			return;
		}

		const trialIsExpired = (() => {
			const trialEndsAt = new Date(trialSnapshot.trialEndsAt);
			return trialSnapshot.status === "EXPIRED" || trialEndsAt.getTime() <= now.getTime();
		})();

		if (!trialIsExpired) {
			return;
		}

		const enforceOnboarding = async () => {
			try {
				const response = await fetch("/api/auth/me/onboarding", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!response.ok) {
					return;
				}

				const onboarding = (await response.json()) as {
					profileCompleted?: boolean;
					paymentCardOnboarded?: boolean;
				};

				if (!onboarding.profileCompleted || !onboarding.paymentCardOnboarded) {
					router.replace("/profile-completion");
				}
			} catch {
				// If onboarding status cannot be fetched, keep current dashboard behavior.
			}
		};

		void enforceOnboarding();
	}, [now, router, trialSnapshot]);

	useEffect(() => {
		const timer = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(timer);
	}, []);

	useEffect(() => {
		const fromStorage = parseStoredDate(localStorage.getItem(TRIAL_START_KEY));
		if (fromStorage) {
			setTrialStart(fromStorage);
			return;
		}

		const rawUser = localStorage.getItem("authUser");
		if (rawUser) {
			try {
				const parsed = JSON.parse(rawUser) as { createdAt?: string };
				const userCreatedAt = parseStoredDate(parsed.createdAt ?? null);
				if (userCreatedAt) {
					localStorage.setItem(TRIAL_START_KEY, userCreatedAt.toISOString());
					setTrialStart(userCreatedAt);
					return;
				}
			} catch {
				// Fall back to now when stored user data cannot be parsed.
			}
		}

		const fallbackStart = new Date();
		localStorage.setItem(TRIAL_START_KEY, fallbackStart.toISOString());
		setTrialStart(fallbackStart);
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			return;
		}

		const loadTrialSnapshot = async () => {
			try {
				const response = await fetch("/api/subscription/trial-reminders", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					return;
				}

				const data = (await response.json()) as TrialReminderSnapshot;
				setTrialSnapshot(data);
				const parsedStart = parseStoredDate(data.trialStartsAt);
				if (parsedStart) {
					localStorage.setItem(TRIAL_START_KEY, parsedStart.toISOString());
					setTrialStart(parsedStart);
				}
			} catch {
				// Keep UI fallback mode when API is not reachable.
			}
		};

		void loadTrialSnapshot();
		const refresh = window.setInterval(() => {
			void loadTrialSnapshot();
		}, 60000);

		return () => {
			window.clearInterval(refresh);
		};
	}, []);

	const trialSummary = useMemo(() => {
		if (trialSnapshot) {
			const trialEndsAt = new Date(trialSnapshot.trialEndsAt);
			const msLeft = Math.max(0, trialEndsAt.getTime() - now.getTime());
			const daysLeft = msLeft <= 0 ? 0 : Math.ceil(msLeft / (24 * 60 * 60 * 1000));
			return {
				expiresAt: trialEndsAt,
				timeLeftLabel: formatDuration(msLeft),
				daysLeft,
				isExpired: trialSnapshot.status === "EXPIRED" || msLeft <= 0,
				reminder: trialSnapshot.reminderMessage,
			};
		}

		if (!trialStart) {
			return {
				expiresAt: null,
				timeLeftLabel: "--",
				daysLeft: TRIAL_DAYS,
				isExpired: false,
				reminder: "Loading trial details...",
			};
		}

		const expiresAt = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
		const millisecondsLeft = expiresAt.getTime() - now.getTime();
		const isExpired = millisecondsLeft <= 0;
		const daysLeft = isExpired ? 0 : Math.ceil(millisecondsLeft / (24 * 60 * 60 * 1000));
		const reminderThreshold = TRIAL_REMINDER_DAYS.find((day) => daysLeft <= day);

		let reminder = "You are in the free trial period.";
		if (isExpired) {
			reminder = "Trial expired. Add billing to continue uninterrupted access.";
		} else if (reminderThreshold !== undefined) {
			reminder = `Reminder: your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;
		}

		return {
			expiresAt,
			timeLeftLabel: formatDuration(millisecondsLeft),
			daysLeft,
			isExpired,
			reminder,
		};
	}, [now, trialStart, trialSnapshot]);

	const trialAccessIsActive = useMemo(() => {
		if (trialSnapshot) {
			const trialEndsAt = new Date(trialSnapshot.trialEndsAt);
			return trialSnapshot.status !== "EXPIRED" && trialEndsAt.getTime() > now.getTime();
		}

		if (!trialStart) {
			return true;
		}

		return trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000 > now.getTime();
	}, [now, trialSnapshot, trialStart]);

	return (
		<WorkspaceShell>
			<div className="mt-5 space-y-5 text-[#111827]">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6678c1]">Workspace overview</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#404d85]">Hello, Team</h1>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6472]">Use this hub to open the core Phase 1 modules. All modules remain enabled during the 90-day free trial.</p>
					</div>
					<div className="flex items-center gap-3">
						<div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${trialSummary.isExpired ? "bg-red-50 text-red-600 border border-red-200" : "bg-[#eef2fa] text-[#404d85] border border-[#d9e2ef]"}`}>
							<svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
								<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
								<path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
							</svg>
							{trialSummary.isExpired ? "Trial Expired" : `${trialSummary.daysLeft} days left`}
						</div>
						<Link href="/storefront" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 text-sm font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-300">
							<span>🏬</span>
							<span>Browse Marketplace</span>
						</Link>
						<Link href="/crm" className="inline-flex items-center rounded-xl bg-[#6678c1] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(102,120,193,0.35)] hover:bg-[#404d85]">
							Open CRM
						</Link>
						<Link href="/file-sharing" className="inline-flex items-center rounded-xl border border-[#d9e2ef] bg-white px-4 py-2 text-sm font-semibold text-[#404d85] hover:bg-[#f8faff]">
							Open Files
						</Link>
					</div>
				</div>

				{/* MULTI-VENDOR MARKETPLACE HUB WIDGET */}
				<div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-xl font-extrabold text-slate-900">Multi-Vendor Marketplace Hub</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
									Live Inside Dashboard
								</span>
							</div>
							<p className="text-xs text-slate-500 mt-1">
								Explore thousands of verified products from top 3P sellers, manage RFQs, and order business supplies directly.
							</p>
						</div>
						<Link
							href="/storefront"
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#404d85] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#2b345e] transition"
						>
							<span>Explore Full Marketplace Catalog</span>
							<span>→</span>
						</Link>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						{[
							{ title: "Electronics & Tech", icon: "🎧", count: "1,240+ Products", href: "/categories" },
							{ title: "Apparel & Uniforms", icon: "👕", count: "850+ Products", href: "/categories" },
							{ title: "Beauty & Wellness", icon: "🌸", count: "420+ Products", href: "/categories" },
							{ title: "Automotive Parts", icon: "🚘", count: "310+ Products", href: "/categories" },
						].map((dept) => (
							<Link
								key={dept.title}
								href={dept.href}
								className="group flex flex-col p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-[#6678c1] hover:shadow-md transition-all"
							>
								<span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{dept.icon}</span>
								<h3 className="text-xs font-bold text-slate-900 group-hover:text-[#404d85]">{dept.title}</h3>
								<span className="text-[10px] text-slate-500 mt-0.5">{dept.count}</span>
							</Link>
						))}
					</div>
				</div>

				<div className="mt-8 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#404d85] to-[#252f5a] shadow-[0_20px_48px_-24px_rgba(64,77,133,0.5)]">
					<div className="px-8 py-12 md:px-12 md:py-16 text-center lg:text-left lg:flex lg:items-center lg:justify-between">
						<div className="lg:w-2/3">
							<h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
								Integrate Your Own Tools
							</h2>
							<p className="mt-4 text-base md:text-lg text-[#c9d4ea] max-w-2xl mx-auto lg:mx-0">
								Cambliss is designed to be your central operating system. Bring your favorite third-party apps, custom APIs, and marketing automation tools directly into your dashboard. Our open architecture ensures seamless data flow and a unified workspace for your entire team.
							</p>
						</div>
						<div className="mt-8 lg:mt-0 flex flex-col sm:flex-row justify-center lg:justify-end gap-3 lg:w-1/3">
							<button className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#404d85] shadow-sm hover:bg-[#f8faff] transition">
								Explore Integrations
							</button>
							<button className="rounded-xl border border-[#8f9ecf] bg-transparent px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
								Read API Docs
							</button>
						</div>
					</div>
				</div>

				{/* Removed Trial Access card to keep UI clean */}
			</div>
		</WorkspaceShell>
	);
}
