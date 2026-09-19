"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState, Suspense } from "react";
import {
	LayoutDashboard,
	Compass,
	MessagesSquare,
	BookOpen,
	Users,
	Store,
	Wrench,
	ShoppingBag,
	Layers,
	Contact,
	Boxes,
	Receipt,
	Folder,
	Video,
	ShieldCheck,
	ChevronRight,
	Menu,
	Search,
	LogOut,
	Building,
	UserCog,
	BadgeCheck,
	Grid,
} from "lucide-react";

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
	return <ChevronRight className={`h-4 w-4 shrink-0 text-current opacity-70 ${className}`} />;
}



const clientMenuItems: SidebarItem[] = [
	{ label: "Office Connect Central", href: "/central", badge: "Hub" },
	{
		label: "Spaces",
		href: "/spaces",
		badge: "Collab",
		subItems: [
			{ label: "All Spaces", href: "/spaces" },
			{ label: "# General Announcements", href: "/spaces/general" },
			{ label: "# Engineering & Tech", href: "/spaces/engineering" },
			{ label: "# Sales & Marketing", href: "/spaces/sales" },
			{ label: "+ Create Space", href: "/spaces?action=create" },
		],
	},
	{
		label: "Knowledge & SOPs",
		href: "/knowledge",
		subItems: [
			{ label: "Knowledge Center", href: "/knowledge" },
			{ label: "Company Policies", href: "/knowledge?category=policies" },
			{ label: "Operations SOPs", href: "/knowledge?category=operations" },
			{ label: "Create Article", href: "/knowledge?action=new" },
		],
	},
	{ label: "People Directory", href: "/directory" },
	{
		label: "Your Store",
		badge: "Seller",
		href: "/vendor-dashboard",
		subItems: [
			{ label: "Overview & Analytics", href: "/vendor-dashboard" },
			{ label: "Products & Catalog", href: "/vendor-dashboard?view=catalog-products" },
			{ label: "Add New Product", href: "/vendor-dashboard?view=catalog-add" },
			{ label: "Orders & Fulfillment", href: "/vendor-dashboard?view=orders-new" },
			{ label: "Payment Gateway & Payouts", href: "/vendor-dashboard?view=finance-payouts" },
			{ label: "Pricing & Promotions", href: "/vendor-dashboard?view=pricing" },
			{ label: "Storefront Settings", href: "/vendor-dashboard?view=settings" },
			{ label: "View Live Storefront", href: "/storefront?tab=store" },
		],
	},
	{ label: "CRM", href: "/crm", accessKey: "CRM" },
	{ label: "HRM", href: "/hrm", accessKey: "HRM" },
	{
		label: "Inventory",
		href: "/inventory",
		accessKey: "INVENTORY",
		subItems: [
			{ label: "Inventory Control", href: "/inventory" },
			{ label: "⚡ Supply Chain & POs", href: "/inventory/supply-chain" },
		],
	},
	{ label: "Accountech ERP", href: "/akaunting" },
	{ label: "File Sharing", href: "/file-sharing", accessKey: "FILE_SHARING" },
	{ label: "Video Connect", href: "/video-connect" },
	{
		label: "Marketplace",
		href: "/storefront",
		badge: "Live",
		subItems: [
			{ label: "🛍️ Explore Marketplace", href: "/storefront" },
			{ label: "➕ Add Products & Catalog", href: "/storefront?tab=store" },
			{ label: "📋 Seller Central Hub", href: "/seller-central" },
			{ label: "📝 Merchant Onboarding", href: "/storefront?tab=onboarding" },
		],
	},
	{ label: "Tools Suite", href: "/tools" },
	{ label: "Profile Completion", href: "/profile-completion" },
	{ label: "User Management", href: "/user-management", accessKey: "USER_MANAGEMENT" },
];

const adminMenuItems: SidebarItem[] = [
	{ label: "Admin Dashboard", href: "/admin-dashboard" },
	{ label: "Office Connect Central", href: "/central", badge: "Hub" },
	{
		label: "Spaces",
		href: "/spaces",
		badge: "Collab",
		subItems: [
			{ label: "All Spaces", href: "/spaces" },
			{ label: "# General Announcements", href: "/spaces/general" },
			{ label: "# Executive Committee", href: "/spaces/executive" },
			{ label: "+ Create Space", href: "/spaces?action=create" },
		],
	},
	{
		label: "Knowledge & SOPs",
		href: "/knowledge",
		subItems: [
			{ label: "Knowledge Center", href: "/knowledge" },
			{ label: "Company Policies", href: "/knowledge?category=policies" },
			{ label: "Operations SOPs", href: "/knowledge?category=operations" },
			{ label: "Create Article", href: "/knowledge?action=new" },
		],
	},
	{ label: "People Directory", href: "/directory" },
	{
		label: "Your Store",
		badge: "Seller",
		href: "/vendor-dashboard",
		subItems: [
			{ label: "Overview & Analytics", href: "/vendor-dashboard" },
			{ label: "Products & Catalog", href: "/vendor-dashboard?view=catalog-products" },
			{ label: "Add New Product", href: "/vendor-dashboard?view=catalog-add" },
			{ label: "Orders & Fulfillment", href: "/vendor-dashboard?view=orders-new" },
			{ label: "Payment Gateway & Payouts", href: "/vendor-dashboard?view=finance-payouts" },
			{ label: "Pricing & Promotions", href: "/vendor-dashboard?view=pricing" },
			{ label: "Storefront Settings", href: "/vendor-dashboard?view=settings" },
			{ label: "View Live Storefront", href: "/storefront?tab=store" },
		],
	},
	{ label: "Vendor Portal", href: "/vendor-dashboard" },
	{ label: "CRM", href: "/crm" },
	{ label: "HRM", href: "/hrm" },
	{
		label: "Inventory",
		href: "/inventory",
		subItems: [
			{ label: "Inventory Control", href: "/inventory" },
			{ label: "⚡ Supply Chain & POs", href: "/inventory/supply-chain" },
		],
	},
	{ label: "Accountech ERP", href: "/akaunting" },
	{ label: "File Sharing", href: "/file-sharing" },
	{ label: "Video Connect", href: "/video-connect" },
	{
		label: "Marketplace",
		href: "/storefront",
		badge: "Live",
		subItems: [
			{ label: "🛍️ Explore Marketplace", href: "/storefront" },
			{ label: "➕ Add Products & Catalog", href: "/storefront?tab=store" },
			{ label: "📋 Seller Central Hub", href: "/seller-central" },
			{ label: "📝 Merchant Onboarding", href: "/storefront?tab=onboarding" },
		],
	},
	{ label: "Tools Suite", href: "/tools" },
	{ label: "User Management", href: "/user-management" },
];

function SidebarIcon({ label }: { label: string }) {
	const className = "h-[18px] w-[18px] text-current";

	switch (label) {
		case "Your Store":
		case "My Store":
		case "Store Dashboard":
		case "Store":
			return <Store className={className} />;
		case "Tools Suite":
		case "Tools":
		case "Tools Store":
			return <Wrench className={className} />;
		case "Marketplace":
		case "Marketplace Hub":
		case "Marketplace Control Hub":
		case "Marketplace & Storefronts":
			return <ShoppingBag className={className} />;
		case "Category & Product Catalog":
			return <Layers className={className} />;
		case "Dashboard":
		case "Client Dashboard":
		case "Admin Dashboard":
			return <LayoutDashboard className={className} />;
		case "Office Connect Central":
		case "Central Hub":
		case "Central":
			return <Compass className={className} />;
		case "Spaces":
		case "Collaboration Spaces":
			return <MessagesSquare className={className} />;
		case "Knowledge & SOPs":
		case "Knowledge":
		case "Knowledge Continuity":
			return <BookOpen className={className} />;
		case "People Directory":
		case "Directory":
			return <Users className={className} />;
		case "Vendor Portal":
			return <Building className={className} />;
		case "CRM":
			return <Contact className={className} />;
		case "HRM":
			return <UserCog className={className} />;
		case "Profile Completion":
		case "Tech Stack":
			return <BadgeCheck className={className} />;
		case "Inventory":
			return <Boxes className={className} />;
		case "User Management":
			return <ShieldCheck className={className} />;
		case "Accountech ERP":
			return <Receipt className={className} />;
		case "File Sharing":
			return <Folder className={className} />;
		case "Video Connect":
			return <Video className={className} />;
		default:
			return <Grid className={className} />;
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
	const [isMounted, setIsMounted] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [authRole, setAuthRole] = useState<string | null>(null);
	const [authAccesses, setAuthAccesses] = useState<string[]>([]);
	const [currentHash, setCurrentHash] = useState("");
	const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({ Marketplace: true });

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const toggleExpanded = (label: string, e: React.MouseEvent) => {
		e.preventDefault();
		setExpandedItems(prev => {
			const isCurrentlyExpanded = prev[label] !== undefined ? prev[label] : (label === "Marketplace" ? true : false);
			return { ...prev, [label]: !isCurrentlyExpanded };
		});
	};

	useEffect(() => {
		const isPublicPath = pathname.startsWith("/video-connect/room/") || pathname.startsWith("/storefront") || pathname.startsWith("/seller-central") || pathname.startsWith("/product/") || pathname.startsWith("/store/") || pathname.startsWith("/category/") || pathname.startsWith("/brand/") || pathname === "/cart" || pathname === "/categories" || pathname === "/search" || pathname === "/wishlist" || pathname === "/checkout" || pathname === "/orders" || pathname === "/tools" || pathname.startsWith("/tools");
		const token = localStorage.getItem("authToken");

		if (!token && !isPublicPath) {
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

	const isGuestUser = isMounted && typeof window !== "undefined" && !localStorage.getItem("authToken");

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
							<Menu className="h-4 w-4" />
						</button>
					</div>

					<nav className="flex-1 overflow-y-auto px-3 py-4">
						<ul className="space-y-1">
							{filteredMenuItems.map((item) => {
								const baseHref = item.href?.split("?")[0].split("#")[0];
								const isActive = Boolean(baseHref && pathname.startsWith(baseHref));
								const isExpanded = expandedItems[item.label] !== undefined
									? expandedItems[item.label]
									: (item.label === "Marketplace" ? true : isActive);
								
								return (
									<li key={item.label} className="flex flex-col">
										{item.href ? (
											<Link
												href={item.href}
												onClick={(e) => { 
													if (item.subItems) {
														toggleExpanded(item.label, e);
													} else {
														if (typeof window !== "undefined" && window.innerWidth < 1024) {
															setSidebarCollapsed(true); 
														}
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
													const subBaseHref = subItem.href?.split('?')[0].split('#')[0];
													const subHrefQuery = subItem.href?.includes('?') ? new URLSearchParams(subItem.href.split('?')[1]) : null;
													const subTab = subHrefQuery?.get('tab');
													const subView = subHrefQuery?.get('view');
													const currentTab = searchParams.get('tab');
													const currentView = searchParams.get('view');
													
													const isSubActive = (pathname === subBaseHref) && 
														(!subTab || currentTab === subTab) && 
														(!subView || currentView === subView);
													
													return (
														<li key={subItem.label}>
															<Link
																href={subItem.href || "#"}
																onClick={() => {
																	if (typeof window !== "undefined" && window.innerWidth < 1024) {
																		setSidebarCollapsed(true);
																	}
																}}
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
										<Search className="h-4 w-4 text-[#5b6472]" />
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
								<LogOut className="h-4 w-4 text-white/95" />
								Logout
							</button>
						</div>
					</div>

					{children}
				</main>
		</div>
	);
}
