"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

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

type SidebarItem = {
	label: string;
	href?: string;
	badge?: string;
	accessKey?: "CRM" | "HRM" | "INVENTORY" | "ECOMMERCE" | "CHAT" | "FILE_SHARING" | "PROJECT_TRACKING" | "USER_MANAGEMENT";
};

const clientMenuItems: SidebarItem[] = [
	{ label: "Dashboard", href: "/dashboard" },
	{ label: "Profile Completion", href: "/profile-completion" },
	{ label: "Subscription", href: "/subscription" },
	{ label: "Project Tracking", href: "/project-tracking" },
	{ label: "Tools", href: "/tools" },
	{ label: "File Sharing", href: "/file-sharing", accessKey: "FILE_SHARING" },
	{ label: "Chat", href: "/chat", accessKey: "CHAT" },
	{ label: "Video Connect", href: "/video-connect" },
	{ label: "Tech Stack", href: "/tech-stack" },
	{ label: "Order History", href: "/order-history" },
	{ label: "User Management", href: "/user-management", accessKey: "USER_MANAGEMENT" },
	{ label: "Notifications", badge: "5" },
	{ label: "Reports", href: "/ceo-report" },
	{ label: "Settings" },
];

const adminMenuItems: SidebarItem[] = [
	{ label: "Admin Dashboard", href: "/admin-dashboard" },
	{ label: "Client Dashboard", href: "/dashboard" },
	{ label: "Tech Stack", href: "/tech-stack" },
	{ label: "Order History", href: "/admin-order-history" },
	{ label: "Project Tracking", href: "/admin-project-tracking" },
	{ label: "Tools", href: "/tools" },
	{ label: "File Sharing", href: "/file-sharing" },
	{ label: "Chat", href: "/chat" },
	{ label: "Video Connect", href: "/video-connect" },
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
		case "Profile Completion":
		case "Order History":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M7 4h10v4H7zM5 8h14v12H5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
					<path d="M8 12h8M8 15h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
				</svg>
			);
		case "Subscription":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
					<path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
				</svg>
			);
		case "Tech Stack":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
					<path d="M16 10l3 2-3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			);
		case "Project Tracking":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M5 7h14M5 12h9M5 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
					<circle cx="18" cy="17" r="2" fill="currentColor" />
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
		case "Tools":
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
		case "Chat":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M5 6h14v9H9l-4 3V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
				</svg>
			);
		case "Video Connect":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<rect x="3" y="7" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
					<path d="M15 10.5 21 8v8l-6-2.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
				</svg>
			);
		case "Notifications":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M7 10a5 5 0 1 1 10 0v4l2 2H5l2-2v-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
					<path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
				</svg>
			);
		case "Reports":
			return (
				<svg viewBox="0 0 24 24" fill="none" className={common}>
					<path d="M6 5h12v14H6z" stroke="currentColor" strokeWidth="1.8" />
					<path d="M9 10h6M9 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
	const pathname = usePathname();
	const router = useRouter();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [authRole, setAuthRole] = useState<string | null>(null);
	const [authAccesses, setAuthAccesses] = useState<string[]>([]);
	const [currentHash, setCurrentHash] = useState("");

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			router.replace("/login");
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
	}, [router]);

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
	const rawMenuItems = isAdminRole ? adminMenuItems : clientMenuItems;
	const hasManagedAccessRules = !isAdminRole && authAccesses.length > 0;
	const filteredMenuItems = rawMenuItems.filter((item) => {
		if (!hasManagedAccessRules) {
			return true;
		}

		if (item.label === "Order History") {
			return false;
		}

		if (item.label === "Project Tracking") {
			return authAccesses.includes("PROJECT_TRACKING");
		}

		if (item.label === "Tools") {
			return ["CRM", "HRM", "INVENTORY", "ECOMMERCE"].some((key) => authAccesses.includes(key));
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

	return (
		<div className="min-h-screen bg-[#f4f7ff] text-[#111827]">
			<div className="flex min-h-screen">
				<aside className={`border-r border-[#dbe3f7] bg-[#f9fbff] transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"}`}>
					<div className="flex h-28 items-center justify-between border-b border-[#dbe3f7] px-4">
						<div className="flex items-center">
							<Image
								src="/officeconnectlogo.png"
								alt="Office Connect"
								width={sidebarCollapsed ? 70 : 320}
								height={86}
								priority
								className={sidebarCollapsed ? "h-16 w-16 rounded-md object-contain" : "h-24 w-auto object-contain"}
							/>
						</div>
						<button
							onClick={() => setSidebarCollapsed((prev) => !prev)}
							className="rounded-lg border border-[#dbe3f7] p-2 text-[#374151] hover:bg-[#eef2ff]"
							aria-label="Toggle sidebar"
						>
							<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
								<path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
							</svg>
						</button>
					</div>

					<nav className="px-3 py-4">
						<ul className="space-y-1">
							{filteredMenuItems.map((item) => {
								const baseHref = item.href?.split("#")[0];
								const hashPart = item.href?.includes("#") ? item.href.split("#")[1] : undefined;
								const isActive = Boolean(
									baseHref &&
									pathname === baseHref &&
									(
										(hashPart && currentHash === `#${hashPart}`) ||
										(!hashPart && !hasHashSpecificActiveItem)
									)
								);
								return (
									<li key={item.label}>
										{item.href ? (
											<Link
												href={item.href}
												className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
														isActive ? "bg-[#1d419d] text-white shadow-[0_12px_24px_-12px_rgba(29,65,157,0.55)]" : "text-[#111827] hover:bg-[#edf2ff]"
												}`}
											>
												<div className="flex items-center gap-3">
													<span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${isActive ? "border-white/20 bg-white/10" : "border-[#dbe3f7] bg-white shadow-sm"}`}>
														<SidebarIcon label={item.label} />
													</span>
													{!sidebarCollapsed && <span className="text-[15px] font-medium">{item.label}</span>}
												</div>
												{!sidebarCollapsed && item.badge && <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/15 text-white" : "bg-[#1d419d] text-white"}`}>{item.badge}</span>}
											</Link>
										) : (
											<div className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[#4b5563]">
												<div className="flex items-center gap-3">
													<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dbe3f7] bg-white shadow-sm">
														<SidebarIcon label={item.label} />
													</span>
													{!sidebarCollapsed && <span className="text-[15px] font-medium">{item.label}</span>}
												</div>
												{!sidebarCollapsed && item.badge && <span className="rounded-full bg-[#1d419d] px-2 py-0.5 text-xs text-white">{item.badge}</span>}
											</div>
										)}
									</li>
								);
							})}
						</ul>
					</nav>
				</aside>

				<main className="flex-1 p-6 lg:p-8">
					<div className="relative overflow-hidden rounded-2xl border border-[#d7e0f7] bg-gradient-to-r from-white via-[#f7f9ff] to-[#edf3ff] p-4 shadow-[0_18px_38px_-24px_rgba(29,65,157,0.45)] ring-1 ring-white/80">
						<div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#c9d8ff]/45 blur-3xl" />
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="min-w-[260px] rounded-xl border border-[#d7e0f7] bg-white/95 p-1 shadow-inner ring-1 ring-white/70">
								<div className="flex items-center gap-3 rounded-lg bg-[#f2f6ff] px-3 py-2 text-[#6f84af]">
									<span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#d7e0f7] bg-white shadow-sm">
										<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
											<circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
											<path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
										</svg>
									</span>
									<span className="text-sm font-medium">Search...</span>
								</div>
							</div>
							<button
								onClick={() => {
									localStorage.removeItem("authToken");
									localStorage.removeItem("authUser");
									router.push("/login");
								}}
								className="group inline-flex items-center gap-2 rounded-xl border border-[#1d419d] bg-[#1d419d] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(29,65,157,0.8)] transition hover:-translate-y-0.5 hover:bg-[#173784]"
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
		</div>
	);
}
