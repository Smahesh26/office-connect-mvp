"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

const TRIAL_DAYS = 90;
const MAX_TRIAL_USERS = 4;
const TRIAL_START_KEY = "trialActivatedAt";
const STICKY_NOTES_KEY = "dashboardStickyNotes";
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
};

export default function DashboardPage() {
	const router = useRouter();
	const cardClass =
		"rounded-[24px] border border-[#d9e2ef] bg-white p-5 shadow-[0_18px_42px_-30px_rgba(64,77,133,0.18)] ring-1 ring-white/80";
	const iconClassName = "h-4 w-4 text-[#5b6472]";
	const [city, setCity] = useState("Hyderabad");
	const [weatherLabel, setWeatherLabel] = useState("Loading...");
	const [newsTopic, setNewsTopic] = useState("finance");
	const [news, setNews] = useState<Array<{ title: string; url: string | null }>>([]);
	const [numA, setNumA] = useState("0");
	const [numB, setNumB] = useState("0");
	const [operation, setOperation] = useState<"+" | "-" | "*" | "/">("+");
	const [now, setNow] = useState(new Date());
	const [trialStart, setTrialStart] = useState<Date | null>(null);
	const [trialSnapshot, setTrialSnapshot] = useState<TrialReminderSnapshot | null>(null);
	const [stickyNotes, setStickyNotes] = useState<string[]>([]);
	const [stickyNoteDraft, setStickyNoteDraft] = useState("");

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		const rawUser = localStorage.getItem("authUser");
		if (!rawUser && !token) {
			return;
		}

		try {
			const parsed = rawUser ? (JSON.parse(rawUser) as { role?: string }) : { role: undefined };
			const resolvedRole = parsed.role ?? getRoleFromToken(token);
			if (resolvedRole === "SUPER_ADMIN" || resolvedRole === "ADMIN") {
				router.replace("/admin-dashboard");
			}
		} catch {
			const resolvedRole = getRoleFromToken(token);
			if (resolvedRole === "SUPER_ADMIN" || resolvedRole === "ADMIN") {
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

	useEffect(() => {
		try {
			const savedNotes = localStorage.getItem(STICKY_NOTES_KEY);
			if (savedNotes) {
				const parsed = JSON.parse(savedNotes) as unknown;
				if (Array.isArray(parsed)) {
					setStickyNotes(parsed.filter((note): note is string => typeof note === "string"));
					return;
				}
			}
		} catch {
			// Keep default notes when local storage cannot be read.
		}

		setStickyNotes([
			"Review CRM leads before lunch.",
			"Check trial reminders for the team.",
			"Prepare payment card onboarding for week 13.",
		]);
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem(STICKY_NOTES_KEY, JSON.stringify(stickyNotes));
		} catch {
			// Ignore storage failures in private/incognito mode.
		}
	}, [stickyNotes]);

	useEffect(() => {
		const loadWeather = async () => {
			try {
				const geocode = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
				const geocodeData = (await geocode.json()) as { results?: Array<{ latitude: number; longitude: number; name: string }> };
				const place = geocodeData.results?.[0];
				if (!place) {
					setWeatherLabel("City not found");
					return;
				}
				const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true`);
				const weatherData = (await weatherResponse.json()) as { current_weather?: { temperature: number } };
				if (!weatherData.current_weather) {
					setWeatherLabel("Weather unavailable");
					return;
				}
				setWeatherLabel(`${place.name}: ${weatherData.current_weather.temperature}°C`);
			} catch {
				setWeatherLabel("Weather unavailable");
			}
		};

		void loadWeather();
	}, [city]);

	useEffect(() => {
		const loadNews = async () => {
			try {
				const response = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(newsTopic)}&tags=story`);
				const data = (await response.json()) as { hits?: Array<{ title?: string; url?: string | null }> };
				const hits = (data.hits ?? []).slice(0, 5).map((item) => ({
					title: item.title || "Untitled",
					url: item.url || null,
				}));
				setNews(hits);
			} catch {
				setNews([]);
			}
		};

		void loadNews();
	}, [newsTopic]);

	const calculatorResult = useMemo(() => {
		const a = Number(numA);
		const b = Number(numB);
		if (!Number.isFinite(a) || !Number.isFinite(b)) return "Invalid";
		if (operation === "+") return String(a + b);
		if (operation === "-") return String(a - b);
		if (operation === "*") return String(a * b);
		if (b === 0) return "Cannot divide by zero";
		return String(a / b);
	}, [numA, numB, operation]);

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

	const addStickyNote = () => {
		const trimmed = stickyNoteDraft.trim();
		if (!trimmed) {
			return;
		}

		setStickyNotes((prev) => [trimmed, ...prev].slice(0, 6));
		setStickyNoteDraft("");
	};

	const removeStickyNote = (index: number) => {
		setStickyNotes((prev) => prev.filter((_, noteIndex) => noteIndex !== index));
	};

	const today = new Date();
	const currentYear = today.getFullYear();
	const currentMonth = today.getMonth();
	const firstDay = new Date(currentYear, currentMonth, 1).getDay();
	const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
	const calendarCells = Array.from({ length: firstDay + daysInMonth }, (_, idx) => (idx < firstDay ? null : idx - firstDay + 1));
	const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

	return (
		<WorkspaceShell>
			<div className="mt-5 space-y-5 text-[#111827]">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6678c1]">Workspace overview</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#404d85]">Hello, Team</h1>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6472]">Use this hub to open the core Phase 1 modules. All modules remain enabled during the 90-day free trial.</p>
					</div>
					<div className="flex items-center gap-2">
						<Link href="/crm" className="inline-flex items-center rounded-xl bg-[#6678c1] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(102,120,193,0.35)] hover:bg-[#404d85]">
							Open CRM
						</Link>
						<Link href="/file-sharing" className="inline-flex items-center rounded-xl border border-[#d9e2ef] bg-white px-4 py-2 text-sm font-semibold text-[#404d85] hover:bg-[#f8faff]">
							Open Files
						</Link>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					<div className={`${cardClass} relative overflow-hidden`}>
						<div className="absolute bottom-0 left-0 h-1 w-2/3 bg-[#62c4a7]" />
						<p className="text-sm font-medium text-[#5b6472]">Core Scope</p>
						<p className="mt-2 text-2xl font-semibold text-[#404d85]">CRM, HRM, Inventory</p>
						<p className="mt-2 text-sm text-[#5b6472]">Trial users also get secure file transfers, video conferencing, and every workspace module unlocked.</p>
					</div>
					<div className={cardClass}>
						<p className="text-sm font-medium text-[#4b5563]">90-Day Trial Countdown</p>
						<p className="mt-2 text-2xl font-semibold text-[#111827]">{trialSummary.timeLeftLabel}</p>
						<p className="mt-2 text-sm text-[#4b5563]">{trialSummary.isExpired ? "Your 90-day free trial has ended." : `${trialSummary.daysLeft} day${trialSummary.daysLeft === 1 ? "" : "s"} left in the 90-day free trial.`}</p>
						<p className={`mt-2 text-sm font-medium ${trialSummary.isExpired ? "text-[#b42318]" : "text-[#404d85]"}`}>{trialSummary.reminder}</p>
						{trialSummary.expiresAt && <p className="mt-3 text-xs font-medium text-[#5b6472]">Ends on {trialSummary.expiresAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>}
					</div>
					<div className={cardClass}>
						<p className="text-sm font-medium text-[#4b5563]">File Retention</p>
						<p className="mt-2 text-2xl font-semibold text-[#111827]">Auto-delete in 15 days</p>
						<p className="mt-2 text-sm text-[#4b5563]">This is a storage policy and is separate from the 90-day free trial window.</p>
					</div>
				</div>

				<div className={cardClass}>
						<p className="text-sm font-semibold text-[#111827]">Trial Activation Policy</p>
						<p className="mt-1 text-sm text-[#4b5563]">Every new organization starts with a 90-day free trial. All modules stay enabled until the timer expires.</p>
					<div className="mt-3 grid gap-2 text-sm text-[#4b5563]">
						<p>• 90-day free trial with no charges during the trial period</p>
						<p>• All modules stay enabled throughout the trial</p>
							<p>• Account creation starts the trial; Razorpay onboarding is connected from profile completion</p>
						<p>• Live countdown timer is shown across the dashboard during trial</p>
						<p>• Automated reminder notifications are dispatched from backend as trial expiry approaches</p>
						<p>• Maximum {MAX_TRIAL_USERS} users per organization during trial</p>
					</div>
					{trialSummary.expiresAt && (
						<p className="mt-3 text-xs font-medium text-[#6678c1]">Trial end date: {trialSummary.expiresAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
					)}
				</div>

				<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
					<div className={cardClass}>
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-[#111827]">Weather</p>
							<span className="text-xs text-[#5b6472]">Quick glance</span>
						</div>
						<div className="mt-3 flex gap-2">
							<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City name" className="flex-1 rounded-xl border border-[#d9e2ef] px-3 py-2 text-sm outline-none focus:border-[#6678c1]" />
						</div>
						<p className="mt-4 text-2xl font-semibold text-[#111827]">{weatherLabel}</p>
						<p className="mt-1 text-sm text-[#4b5563]">Use this before travel, site visits, or team planning.</p>
					</div>

					<div className={cardClass}>
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-[#111827]">News</p>
							<span className="text-xs text-[#5b6472]">Latest stories</span>
						</div>
						<div className="mt-3 flex gap-2">
							<input value={newsTopic} onChange={(event) => setNewsTopic(event.target.value)} placeholder="Topic: finance, startup, AI" className="flex-1 rounded-xl border border-[#d9e2ef] px-3 py-2 text-sm outline-none focus:border-[#6678c1]" />
						</div>
						<ul className="mt-4 space-y-2 text-sm text-[#404d85]">
							{news.length > 0 ? news.map((item) => (
								<li key={item.title} className="rounded-xl border border-[#e6ebfa] bg-[#fbfcff] px-3 py-2">
									{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">{item.title}</a> : item.title}
								</li>
							)) : <li className="text-[#6b7280]">No news loaded right now.</li>}
						</ul>
					</div>

					<div className={cardClass}>
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-[#111827]">Calculator</p>
							<span className="text-xs text-[#5b6472]">Fast math</span>
						</div>
						<div className="mt-3 grid gap-2 sm:grid-cols-3">
							<input value={numA} onChange={(event) => setNumA(event.target.value)} inputMode="decimal" className="rounded-xl border border-[#d9e2ef] px-3 py-2 text-sm outline-none focus:border-[#6678c1]" />
							<select value={operation} onChange={(event) => setOperation(event.target.value as "+" | "-" | "*" | "/")} className="rounded-xl border border-[#d9e2ef] px-3 py-2 text-sm outline-none focus:border-[#6678c1]">
								<option value="+">+</option>
								<option value="-">-</option>
								<option value="*">×</option>
								<option value="/">÷</option>
							</select>
							<input value={numB} onChange={(event) => setNumB(event.target.value)} inputMode="decimal" className="rounded-xl border border-[#d9e2ef] px-3 py-2 text-sm outline-none focus:border-[#6678c1]" />
						</div>
						<p className="mt-4 text-3xl font-semibold text-[#111827]">{calculatorResult}</p>
					</div>

					<div className={cardClass}>
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-[#111827]">Sticky Notes</p>
							<span className="text-xs text-[#5b6472]">Saved locally</span>
						</div>
						<div className="mt-3 flex gap-2">
							<input value={stickyNoteDraft} onChange={(event) => setStickyNoteDraft(event.target.value)} placeholder="Add a quick note" className="flex-1 rounded-xl border border-[#d9e2ef] px-3 py-2 text-sm outline-none focus:border-[#6678c1]" />
							<button type="button" onClick={addStickyNote} className="rounded-xl bg-[#6678c1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#404d85]">Add</button>
						</div>
						<div className="mt-4 space-y-2">
							{stickyNotes.length > 0 ? stickyNotes.map((note, index) => (
								<div key={`${note}-${index}`} className="flex items-start justify-between gap-3 rounded-xl border border-[#e6ebfa] bg-[#fffef8] px-3 py-2 text-sm text-[#4b5563]">
									<p className="whitespace-pre-wrap">{note}</p>
									<button type="button" onClick={() => removeStickyNote(index)} className="text-xs font-semibold text-[#b42318] hover:underline">Remove</button>
								</div>
							)) : <p className="text-sm text-[#6b7280]">No notes yet.</p>}
						</div>
					</div>

					<div className={cardClass}>
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-[#111827]">Mini Calendar</p>
							<span className="text-xs text-[#5b6472]">{monthLabel}</span>
						</div>
						<div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
							{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
						</div>
						<div className="mt-2 grid grid-cols-7 gap-1">
							{calendarCells.map((cell, index) => (
								<div key={`${monthLabel}-${index}`} className={`flex h-10 items-center justify-center rounded-lg text-sm ${cell ? "bg-[#f8fbff] text-[#111827]" : "bg-transparent text-transparent"}`}>
									{cell ?? "0"}
								</div>
							))}
						</div>
					</div>

					<div className={cardClass}>
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-[#111827]">Useful Suggestions</p>
							<span className="text-xs text-[#5b6472]">Next actions</span>
						</div>
						<ul className="mt-3 space-y-2 text-sm text-[#4b5563]">
							<li>• Invite 2-3 teammates so they can try CRM and HRM together.</li>
							<li>• Open Video Connect and share a meeting link with your team.</li>
							<li>• Use the sticky notes to keep launch tasks visible.</li>
							<li>• Check weather and news before planning field work or demos.</li>
						</ul>
						<div className="mt-4 flex flex-wrap gap-2">
							<Link href="/video-connect" className="rounded-xl border border-[#d9e2ef] bg-white px-3 py-2 text-sm font-semibold text-[#404d85] hover:bg-[#f8faff]">Start meeting</Link>
							<Link href="/user-management" className="rounded-xl border border-[#d9e2ef] bg-white px-3 py-2 text-sm font-semibold text-[#404d85] hover:bg-[#f8faff]">Add users</Link>
							<Link href="/profile-completion" className="rounded-xl border border-[#d9e2ef] bg-white px-3 py-2 text-sm font-semibold text-[#404d85] hover:bg-[#f8faff]">Review onboarding</Link>
						</div>
					</div>
				</div>

					<div className={cardClass}>
						<p className="text-sm font-semibold text-[#111827]">Trial Access</p>
						<p className="mt-1 text-sm text-[#4b5563]">{trialAccessIsActive ? "Your 90-day trial is active, so the workspace stays open." : "Your 90-day trial has expired and onboarding/payment completion is required."}</p>
				</div>
			</div>
		</WorkspaceShell>
	);
}
