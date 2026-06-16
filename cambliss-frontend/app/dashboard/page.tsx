"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

export default function DashboardPage() {
	const router = useRouter();
	const cardClass =
		"rounded-2xl border border-[#d7e0f7] bg-white p-5 shadow-[0_14px_34px_-24px_rgba(29,65,157,0.45)] ring-1 ring-white/80";
	const iconClassName = "h-4 w-4 text-[#4f6698]";
	const [city, setCity] = useState("Hyderabad");
	const [weatherLabel, setWeatherLabel] = useState("Loading...");
	const [newsTopic, setNewsTopic] = useState("finance");
	const [news, setNews] = useState<Array<{ title: string; url: string | null }>>([]);
	const [numA, setNumA] = useState("0");
	const [numB, setNumB] = useState("0");
	const [operation, setOperation] = useState<"+" | "-" | "*" | "/">("+");
	const [now, setNow] = useState(new Date());

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
		const timer = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(timer);
	}, []);

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
						<h1 className="text-3xl font-semibold tracking-tight text-[#111827]">Hello, Client</h1>
						<p className="mt-1 text-sm text-[#4b5563]">Here&apos;s what&apos;s happening across your business today.</p>
					</div>
					<div className="flex items-center gap-2">
						<Link href="/project-tracking" className="inline-flex items-center rounded-xl bg-[#1d419d] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(29,65,157,0.85)] hover:bg-[#173784]">
							+ New Project
						</Link>
						<Link href="/tools" className="inline-flex items-center rounded-xl border border-[#d7e0f7] bg-white px-4 py-2 text-sm font-semibold text-[#35558e] hover:bg-[#edf3ff]">
							Manage Tools
						</Link>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
					<div className={`${cardClass} relative overflow-hidden`}>
						<div className="absolute bottom-0 left-0 h-1 w-2/3 bg-[#62c4a7]" />
						<p className="text-sm font-medium text-[#4b5563]">Current Time</p>
						<p className="mt-2 text-3xl font-semibold text-[#111827]">{now.toLocaleTimeString("en-IN")}</p>
						<p className="mt-2 text-sm text-[#4b5563]">{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
					</div>
					<div className={`${cardClass} relative overflow-hidden`}>
						<div className="absolute bottom-0 left-0 h-1 w-2/3 bg-[#62c4a7]" />
						<p className="text-sm font-medium text-[#4b5563]">Weather</p>
						<p className="mt-2 text-2xl font-semibold text-[#111827]">{weatherLabel}</p>
						<input value={city} onChange={(event) => setCity(event.target.value)} className="mt-3 w-full rounded-xl border border-[#d7e0f7] bg-[#f7f9ff] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#1d419d]" />
					</div>
					<div className={`${cardClass} relative overflow-hidden`}>
						<div className="absolute bottom-0 left-0 h-1 w-2/3 bg-[#62c4a7]" />
						<p className="text-sm font-medium text-[#4b5563]">Calculator</p>
						<div className="mt-2 flex flex-wrap items-center gap-2">
							<input value={numA} onChange={(event) => setNumA(event.target.value)} className="w-20 rounded-lg border border-[#d7e0f7] bg-[#f7f9ff] px-2 py-1.5 text-sm text-[#111827] outline-none" />
							<select value={operation} onChange={(event) => setOperation(event.target.value as "+" | "-" | "*" | "/")} className="rounded-lg border border-[#d7e0f7] bg-[#f7f9ff] px-2 py-1.5 text-sm text-[#111827] outline-none">
								<option value="+">+</option>
								<option value="-">-</option>
								<option value="*">×</option>
								<option value="/">÷</option>
							</select>
							<input value={numB} onChange={(event) => setNumB(event.target.value)} className="w-20 rounded-lg border border-[#d7e0f7] bg-[#f7f9ff] px-2 py-1.5 text-sm text-[#111827] outline-none" />
						</div>
						<p className="mt-3 rounded-xl bg-[#edf3ff] px-3 py-2 text-sm font-semibold text-[#111827]">Result: {calculatorResult}</p>
					</div>
					<div className={`${cardClass} relative overflow-hidden`}>
						<div className="absolute bottom-0 left-0 h-1 w-2/3 bg-[#f2a8be]" />
						<p className="text-sm font-medium text-[#4b5563]">Month View</p>
						<p className="mt-2 text-2xl font-semibold text-[#111827]">{monthLabel}</p>
						<p className="mt-2 text-sm text-[#4b5563]">{daysInMonth} days in this month</p>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
					<div className={`${cardClass} xl:col-span-2`}>
						<div className="flex items-center justify-between gap-3">
							<h3 className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
								<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d7e0f7] bg-[#edf3ff]">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v13.5a2.5 2.5 0 0 1-2.5 2.5H4V6.5Z" />
										<path strokeLinecap="round" d="M8 9h8M8 12h8M8 15h5" />
									</svg>
								</span>
								Latest News
							</h3>
							<input value={newsTopic} onChange={(event) => setNewsTopic(event.target.value)} className="w-40 rounded-xl border border-[#d7e0f7] bg-[#f7f9ff] px-3 py-2 text-xs text-[#111827] outline-none focus:border-[#1d419d]" />
						</div>
						<ul className="mt-4 space-y-2 text-sm text-[#374151]">
							{news.length === 0 ? (
								<li className="rounded-lg border border-[#d7e0f7] bg-[#f7f9ff] px-3 py-2">No news available</li>
							) : (
								news.map((item, idx) => (
									<li key={`${item.title}-${idx}`} className="rounded-lg border border-[#d7e0f7] bg-[#f7f9ff] px-3 py-2 shadow-sm">
										{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="font-medium text-[#111827] transition hover:text-[#1f2937] hover:underline">{item.title}</a> : item.title}
									</li>
								))
							)}
						</ul>
					</div>
					<div className={cardClass}>
						<h3 className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d7e0f7] bg-[#edf3ff]">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
									<rect x="3" y="5" width="18" height="16" rx="2" />
									<path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
								</svg>
							</span>
							Calendar
						</h3>
						<div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-[#4b5563]">
							{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
								<div key={day} className="rounded-md border border-[#d7e0f7] bg-[#f7f9ff] py-1 font-semibold">{day}</div>
							))}
							{calendarCells.map((day, idx) => (
								<div key={idx} className={`rounded-md border py-1 shadow-sm ${day === today.getDate() ? "border-[#1d419d] bg-[#1d419d] text-white" : "border-[#d7e0f7] bg-white text-[#4b5563]"}`}>
									{day ?? ""}
								</div>
							))}
						</div>
					</div>
				</div>

				<div className={cardClass}>
					<p className="text-sm font-semibold text-[#111827]">How to use CRM (Client)</p>
					<p className="mt-1 text-sm text-[#4b5563]">CRM is your central place to manage customer details, leads, deals, follow-ups, and support updates in one flow.</p>
					<ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-[#374151]">
						<li>Create a lead in Sales Execution.</li>
						<li>Use that lead to create a deal with pipeline and stage.</li>
						<li>Track stage movement and deal history.</li>
						<li>Manage service cases and marketing campaigns.</li>
					</ol>
					<Link href="/crm" className="mt-4 inline-flex items-center rounded-xl bg-[#1d419d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173784]">
						Open CRM
					</Link>
				</div>
			</div>
		</WorkspaceShell>
	);
}
