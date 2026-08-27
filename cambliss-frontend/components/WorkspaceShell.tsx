"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState, Suspense } from "react";

const TRIAL_DAYS = 90;
const TRIAL_START_KEY = "trialActivatedAt";
const ENABLE_ONBOARDING_REDIRECT = false;

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

type SidebarItem = {
	label: string;
	href?: string;
	badge?: string;
	accessKey?: "CRM" | "HRM" | "INVENTORY" | "FILE_SHARING" | "USER_MANAGEMENT";
	isSso?: boolean;
	ssoAppUrl?: string;
	subItems?: SidebarItem[];
};

function ChevronRightIcon({ className = "" }: { className?: string }) {
	return (
		<svg viewBox="0 0 20 20" fill="none" className={`h-4 w-4 shrink-0 text-current opacity-70 ${className}`}>
			<path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}



const clientMenuItems: SidebarItem[] = [
	{ label: "Dashboard", href: "/dashboard" },
	{ label: "Profile Completion", href: "/profile-completion" },
	{ label: "CRM", href: "/crm", accessKey: "CRM" },
	{ label: "HRM", href: "/hrm", accessKey: "HRM" },
	{ label: "Inventory", href: "/inventory", accessKey: "INVENTORY" },
	{ label: "Marketplace & Storefronts", href: "/storefront" },
	{ label: "Accountech ERP", href: "/akaunting" },
	{ label: "Store", href: "/store" },
	{ label: "File Sharing", href: "/file-sharing", accessKey: "FILE_SHARING" },
	{ label: "Video Connect", href: "/video-connect" },
	{ label: "User Management", href: "/user-management", accessKey: "USER_MANAGEMENT" },
];

const adminMenuItems: SidebarItem[] = [
	{ label: "Admin Dashboard", href: "/admin-dashboard" },
];

function SidebarIcon({ label }: { label: string }) {
	const common = "h-[18px] w-[18px] text-current";

	switch (label) {
		case "Dashboard":
		case "Client Dashboard":
		case "Admin Dashboard":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M4 12h7V4H4v8Zm9 8h7v-7h-7v7Zm0-16v7h7V4h-7ZM4 20h7v-7H4v7Z" fill="currentColor" />
				</svg>
			);
		case "CRM":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M5 6h14M5 12h9M5 18h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
					<path d="M16 10l3 2-3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			);
		case "HRM":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
					<circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
					<path d="M4.5 18a5.5 5.5 0 0 1 7-5 5.5 5.5 0 0 1 7 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
				</svg>
			);
		case "Profile Completion":
		case "Tech Stack":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
					<path d="M16 10l3 2-3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			);
		case "Inventory":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M4 8.5L12 4l8 4.5-8 4.5L4 8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
					<path d="M4 12l8 4.5 8-4.5M4 15.5 12 20l8-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
				</svg>
			);
		case "User Management":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M16 19a4 4 0 0 0-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
					<circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
					<path d="M19 8v4M17 10h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
				</svg>
			);
		case "Store":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M14 5.5a4 4 0 0 0-5 5l-5 5 2.5 2.5 5-5a4 4 0 0 0 5-5l-2.5 2.5L11.5 8l2.5-2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
				</svg>
			);
		case "File Sharing":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M8 12a3 3 0 0 1 0-6h3M16 12a3 3 0 0 0 0-6h-3M9 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
				</svg>
			);
		case "Video Connect":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<rect x="3" y="7" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
					<path d="M15 10.5 21 8v8l-6-2.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
				</svg>
			);

		default:
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z" stroke="currentColor" strokeWidth="1.8" />
					<path d="M12 9v6M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
				</svg>
			);
	}
}

export default function WorkspaceShell({ children }: { children: ReactNode }) {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
			<WorkspaceShellContent>{children}</WorkspaceShellContent>
		</Suspense>
	);
}

function WorkspaceShellContent({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [authRole, setAuthRole] = useState<string | null>(null);
	const [authAccesses, setAuthAccesses] = useState<string[]>([]);
	const [currentHash, setCurrentHash] = useState("");
	const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

	const toggleExpanded = (label: string, e: React.MouseEvent) => {
		e.preventDefault();
		setExpandedItems(prev => ({ ...prev, [label]: !prev[label] }));
	};

	useEffect(() => {
		const isPublicRoomPath = pathname.startsWith("/video-connect/room/");
		const token = localStorage.getItem("authToken");

		if (!token && !isPublicRoomPath) {
			router.replace("/login");
			return;
		}

		if (!token) {
			setAuthRole(null);
			setAuthAccesses([]);
			return;
		}

		const rawUser = localStorage.getItem("authUser");
		if (!rawUser) {
			setAuthRole(null);
			setAuthAccesses([]);
			return;
		}

		try {
			const parsed = JSON.parse(rawUser) as { role?: string; accesses?: string[] };
			setAuthRole(parsed.role ?? getRoleFromToken(token));
			setAuthAccesses(Array.isArray(parsed.accesses) ? parsed.accesses : []);
		} catch {
			setAuthRole(getRoleFromToken(token));
			setAuthAccesses([]);
		}
	}, [pathname, router]);

	useEffect(() => {
		if (!ENABLE_ONBOARDING_REDIRECT) {
			return;
		}

		const token = localStorage.getItem("authToken");
		if (!token) {
			return;
		}

		const publicAllowedPaths = new Set(["/profile-completion", "/admin-dashboard", "/login", "/register"]);
		if (publicAllowedPaths.has(pathname)) {
			return;
		}

		const enforceOnboarding = async () => {
			try {
				let trialIsExpired = false;
				const trialResponse = await fetch("/api/subscription/trial-reminders", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (trialResponse.ok) {
					const trial = (await trialResponse.json()) as {
						status?: string;
						trialEndsAt?: string;
					};
					const trialEndsAt = trial.trialEndsAt ? new Date(trial.trialEndsAt) : null;
					trialIsExpired = trial.status === "EXPIRED" || Boolean(trialEndsAt && trialEndsAt.getTime() <= Date.now());
				} else {
					// Fallback for environments without trial-reminders endpoint availability.
					const trialStart = parseStoredDate(localStorage.getItem(TRIAL_START_KEY)) ?? (() => {
						const rawUser = localStorage.getItem("authUser");
						if (!rawUser) {
							return null;
						}

						try {
							const parsed = JSON.parse(rawUser) as { createdAt?: string };
							return parseStoredDate(parsed.createdAt ?? null);
						} catch {
							return null;
						}
					})();

					trialIsExpired = trialStart ? trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000 <= Date.now() : false;
				}

				if (!trialIsExpired) {
					return;
				}

				const response = await fetch("/api/auth/me/onboarding", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					return;
				}

				const data = (await response.json()) as {
					profileCompleted?: boolean;
					paymentCardOnboarded?: boolean;
				};

				if (!data.profileCompleted || !data.paymentCardOnboarded) {
					router.replace("/profile-completion");
				}
			} catch {
				// Keep current navigation if onboarding endpoint is unavailable.
			}
		};

		void enforceOnboarding();
	}, [pathname, router]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const syncHash = () => setCurrentHash(window.location.hash || "");
		syncHash();
		window.addEventListener("hashchange", syncHash);

		return () => {
			window.removeEventListener("hashchange", syncHash);
		};
	}, [pathname]);

	const isAdminRole = authRole === "SUPER_ADMIN" || authRole === "ADMIN";
	const isSuperAdminRole = authRole === "SUPER_ADMIN";
	const rawMenuItems = isSuperAdminRole ? adminMenuItems : clientMenuItems;
	const hasManagedAccessRules = !isAdminRole && authAccesses.length > 0;
	const filteredMenuItems = rawMenuItems.filter((item) => {
		if (!hasManagedAccessRules) {
			return true;
		}

		if (item.label === "Order History") {
			return false;
		}

		if (item.accessKey) {
			return authAccesses.includes(item.accessKey);
		}

		return true;
	});
	const hasHashSpecificActiveItem = filteredMenuItems.some((item) => {
		if (!item.href || !item.href.includes("#")) {
			return false;
		}

		const [baseHref, hashPart] = item.href.split("#");
		return pathname === baseHref && currentHash === `#${hashPart}`;
	});

	const isGuestUser = typeof window !== "undefined" && !localStorage.getItem("authToken");

	if (pathname.startsWith("/video-connect/room/") && isGuestUser) {
		return <div className="min-h-screen bg-[#f8faff] text-[#1f2430]">{children}</div>;
	}

	return (
		<div className="flex h-screen overflow-hidden bg-[#eef2fa] text-[#1f2430]">
			<aside className={`flex flex-col flex-shrink-0 h-full overflow-y-auto border-r border-[#d9e2ef] bg-[#f8faff] transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"}`}>
					<div className="flex-shrink-0 flex h-24 items-center justify-between border-b border-[#d9e2ef] px-4">
						<div className="flex items-center">
							<Image
								src="/officeconnectlogo.png"
								alt="Office Connect"
								width={sidebarCollapsed ? 70 : 320}
								height={86}
								priority
								className={sidebarCollapsed ? "h-12 w-12 rounded-md object-contain" : "h-16 w-auto object-contain"}
							/>
						</div>
						<button
							onClick={() => setSidebarCollapsed((prev) => !prev)}
							className="rounded-lg border border-[#d9e2ef] p-2 text-[#404d85] hover:bg-[#eef2fa]"
							aria-label="Toggle sidebar"
						>
							<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
								<path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
							</svg>
						</button>
					</div>

					<nav className="flex-1 overflow-y-auto px-3 py-4">
						<ul className="space-y-1">
							{filteredMenuItems.map((item) => {
								const baseHref = item.href?.split("?")[0].split("#")[0];
								const isActive = Boolean(baseHref && pathname.startsWith(baseHref));
								const isExpanded = expandedItems[item.label] ?? isActive;
								
								return (
									<li key={item.label} className="flex flex-col">
										{item.href ? (
											<Link
												href={item.href}
												onClick={(e) => { 
													if (item.subItems) {
														if (isActive) {
															toggleExpanded(item.label, e);
														} else {
															setExpandedItems(prev => ({ ...prev, [item.label]: true }));
														}
													} else {
														setSidebarCollapsed(true); 
													}
												}}
												className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
														isActive ? "bg-[#6678c1] text-white shadow-[0_12px_24px_-12px_rgba(102,120,193,0.45)]" : "text-[#1f2430] hover:bg-[#eef2fa]"
												}`}
											>
												<div className="flex items-center gap-3">
													<span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${isActive ? "border-white/20 bg-white/10" : "border-[#d9e2ef] bg-white shadow-sm"}`}>
														<SidebarIcon label={item.label} />
													</span>
													{!sidebarCollapsed && <span className="text-[15px] font-medium">{item.label}</span>}
												</div>
												<div className="ml-auto flex items-center gap-2">
													{!sidebarCollapsed && item.badge && <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/15 text-white" : "bg-[#6678c1] text-white"}`}>{item.badge}</span>}
													{!sidebarCollapsed && (
														item.subItems ? (
															<ChevronRightIcon className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
														) : (
															<ChevronRightIcon />
														)
													)}
												</div>
											</Link>
										) : (
											<div className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[#5b6472]">
												<div className="flex items-center gap-3">
													<span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d9e2ef] bg-white shadow-sm">
														<SidebarIcon label={item.label} />
													</span>
													{!sidebarCollapsed && <span className="text-[15px] font-medium">{item.label}</span>}
												</div>
												<div className="ml-auto flex items-center gap-2">
													{!sidebarCollapsed && item.badge && <span className="rounded-full bg-[#6678c1] px-2 py-0.5 text-xs text-white">{item.badge}</span>}
													<ChevronRightIcon />
												</div>
											</div>
										)}
										
										{/* Render SubItems */}
										{!sidebarCollapsed && item.subItems && isExpanded && (
											<ul className="mt-1 flex flex-col space-y-0.5 pl-12 pr-2">
												{item.subItems.map(subItem => {
													const subHrefQuery = subItem.href?.includes('?') ? new URLSearchParams(subItem.href.split('?')[1]) : null;
													const subView = subHrefQuery?.get('view');
													const currentView = searchParams.get('view');
													const isSubActive = subView ? currentView === subView : !currentView;
													
													return (
														<li key={subItem.label}>
															<Link
																href={subItem.href || "#"}
																onClick={() => setSidebarCollapsed(true)}
																className={`block rounded-lg px-3 py-2 text-[14px] transition ${
																	isSubActive ? "bg-[#eef2fa] font-semibold text-[#6678c1]" : "text-[#5b6472] hover:bg-[#f8faff] hover:text-[#1f2430]"
																}`}
															>
																{subItem.label}
															</Link>
														</li>
													);
												})}
											</ul>
										)}
									</li>
								);
							})}
						</ul>
					</nav>
				</aside>

				<main className="flex-1 h-full overflow-y-auto p-6 lg:p-8">
					<div className="relative overflow-hidden rounded-2xl border border-[#d9e2ef] bg-gradient-to-r from-white via-[#f8faff] to-[#eef2fa] p-4 shadow-[0_18px_38px_-24px_rgba(64,77,133,0.18)] ring-1 ring-white/80">
						<div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#c9d4ea]/45 blur-3xl" />
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="min-w-[260px] rounded-xl border border-[#d9e2ef] bg-white/95 p-1 shadow-inner ring-1 ring-white/70">
								<div className="flex items-center gap-3 rounded-lg bg-[#f8faff] px-3 py-2 text-[#5b6472]">
									<span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#d9e2ef] bg-white shadow-sm">
										<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
											<circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
											<path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
										</svg>
									</span>
									<span className="text-sm font-medium">Search...</span>
								</div>
							</div>
							<button
								onClick={async () => {
									try {
										await fetch("/api/auth/logout", { method: "POST" });
									} catch {
										// ignore network error; still clear client state below
									}
									localStorage.removeItem("authToken");
									localStorage.removeItem("authUser");
									router.push("/login");
								}}
								className="group inline-flex items-center gap-2 rounded-xl border border-[#6678c1] bg-[#6678c1] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(102,120,193,0.45)] transition hover:-translate-y-0.5 hover:bg-[#404d85]"
							>
								<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-white/95">
									<path d="M12 5V3h5v14h-5v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
									<path d="M8 10h8M8 10l2.5-2.5M8 10l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
									<path d="M3 3h6v14H3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
								</svg>
								Logout
							</button>
						</div>
					</div>

					{children}
				</main>
		</div>
	);
}
