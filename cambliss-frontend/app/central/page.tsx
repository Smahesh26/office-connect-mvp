"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";

type Post = {
	id: string;
	author: {
		name: string;
		role: string;
		avatar: string;
		department: string;
	};
	title: string;
	content: string;
	space: string;
	pinned?: boolean;
	timestamp: string;
	likes: number;
	comments: number;
	tags: string[];
};

type SpaceSummary = {
	id: string;
	name: string;
	description: string;
	membersCount: number;
	unreadCount: number;
	isPrivate: boolean;
	icon: string;
};

const INITIAL_SPACES: SpaceSummary[] = [
	{
		id: "general",
		name: "General Announcements",
		description: "Company-wide updates, quarterly town halls, and milestones.",
		membersCount: 142,
		unreadCount: 3,
		isPrivate: false,
		icon: "📢",
	},
	{
		id: "engineering",
		name: "Engineering & Tech",
		description: "Architecture reviews, sprint deployments, and tech SOPs.",
		membersCount: 38,
		unreadCount: 7,
		isPrivate: false,
		icon: "⚡",
	},
	{
		id: "sales",
		name: "Sales & Marketing",
		description: "Revenue pipeline targets, campaign assets, and customer feedback.",
		membersCount: 45,
		unreadCount: 0,
		isPrivate: false,
		icon: "📈",
	},
	{
		id: "executive",
		name: "Executive Committee",
		description: "Strategic governance, audit reviews, and compliance.",
		membersCount: 8,
		unreadCount: 1,
		isPrivate: true,
		icon: "🏛️",
	},
];

const INITIAL_POSTS: Post[] = [
	{
		id: "post-1",
		author: {
			name: "Sarah Jenkins",
			role: "Chief Operating Officer",
			avatar: "SJ",
			department: "Executive Leadership",
		},
		title: "Office Connect Central Operating Layer Rollout",
		content:
			"Welcome to Office Connect Central! This foundational digital workplace is now our unified operating layer. It ties together our team spaces, institutional knowledge SOPs, and core operational engines (CRM, HRMS, Accountech ERP, and Marketplace). Please ensure your department documentation is updated in the Knowledge Hub.",
		space: "General Announcements",
		pinned: true,
		timestamp: "2 hours ago",
		likes: 24,
		comments: 6,
		tags: ["Announcement", "Governance", "Operations"],
	},
	{
		id: "post-2",
		author: {
			name: "David Chen",
			role: "Lead Platform Architect",
			avatar: "DC",
			department: "Engineering Core",
		},
		title: "API & Data Exchange Architecture Documentation Completed",
		content:
			"We've published the new multi-module sync playbook inside the Knowledge Wiki. This guarantees automated synchronization between CRM deal stages, Accountech invoicing, and Inventory stock levels. Feel free to review the architecture specs in the Tech SOPs section.",
		space: "Engineering & Tech",
		pinned: false,
		timestamp: "4 hours ago",
		likes: 18,
		comments: 3,
		tags: ["Architecture", "Knowledge", "Integrations"],
	},
	{
		id: "post-3",
		author: {
			name: "Elena Rostova",
			role: "People & Talent Lead",
			avatar: "ER",
			department: "Human Resources",
		},
		title: "Q3 Flexible Workplace & Time-Off Policy Update",
		content:
			"The updated 2026 remote collaboration policy and benefits schedule are now live in the People & Policies repository. Please review and submit any Q3 leaves directly through our integrated HRM portal.",
		space: "General Announcements",
		pinned: false,
		timestamp: "Yesterday at 4:30 PM",
		likes: 31,
		comments: 11,
		tags: ["HRM", "Policy", "Culture"],
	},
];

export default function OfficeConnectCentralPage() {
	const [userName, setUserName] = useState("Team");
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<"stream" | "spaces" | "knowledge" | "modules">("stream");
	const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
	const [spaces] = useState<SpaceSummary[]>(INITIAL_SPACES);
	const [newPostModalOpen, setNewPostModalOpen] = useState(false);
	const [newPostTitle, setNewPostTitle] = useState("");
	const [newPostContent, setNewPostContent] = useState("");
	const [newPostSpace, setNewPostSpace] = useState("General Announcements");

	useEffect(() => {
		try {
			const raw = localStorage.getItem("authUser");
			if (raw) {
				const user = JSON.parse(raw);
				const name = user.firstName || user.name || (user.email ? user.email.split("@")[0] : "Team");
				setUserName(name);
			}
		} catch {
			// ignore
		}
	}, []);

	const filteredPosts = useMemo(() => {
		if (!searchQuery.trim()) return posts;
		const q = searchQuery.toLowerCase();
		return posts.filter(
			(p) =>
				p.title.toLowerCase().includes(q) ||
				p.content.toLowerCase().includes(q) ||
				p.author.name.toLowerCase().includes(q) ||
				p.tags.some((t) => t.toLowerCase().includes(q))
		);
	}, [posts, searchQuery]);

	const handleCreatePost = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newPostTitle.trim() || !newPostContent.trim()) return;

		const created: Post = {
			id: `post-${Date.now()}`,
			author: {
				name: userName || "Authorized Member",
				role: "Workplace Member",
				avatar: (userName[0] || "U").toUpperCase(),
				department: "Corporate",
			},
			title: newPostTitle,
			content: newPostContent,
			space: newPostSpace,
			timestamp: "Just now",
			likes: 0,
			comments: 0,
			tags: ["Update", newPostSpace.split(" ")[0]],
		};

		setPosts([created, ...posts]);
		setNewPostTitle("");
		setNewPostContent("");
		setNewPostModalOpen(false);
	};

	return (
		<WorkspaceShell>
			<div className="mx-auto max-w-7xl space-y-6 pb-12 pt-2 text-[#1f2430]">
				{/* Top Branding & Strategic Anchor Banner */}
				<div className="relative overflow-hidden rounded-3xl border border-[#d9e2ef] bg-gradient-to-r from-[#21294c] via-[#323d6b] to-[#404d85] p-6 text-white shadow-[0_20px_50px_-25px_rgba(33,41,76,0.35)] md:p-8">
					<div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#c9d4ea] backdrop-blur-md">
								<span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
								Enterprise Digital Workplace Anchor
							</div>
							<h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
								Office Connect Central
							</h1>
							<p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c9d4ea]">
								Good day, <span className="font-semibold text-white">{userName}</span>. Your central operating layer unifying internal communications, team collaboration spaces, organizational memory, and operational engines.
							</p>
						</div>

						{/* Quick Action Hub */}
						<div className="flex flex-wrap items-center gap-3">
							<button
								onClick={() => setNewPostModalOpen(true)}
								className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#323d6b] shadow-md transition hover:bg-[#f0f4fc] active:scale-95"
							>
								<svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
									<path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
								</svg>
								<span>Broadcast Update</span>
							</button>

							<Link
								href="/spaces?action=create"
								className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
							>
								<span>+ New Space</span>
							</Link>

							<Link
								href="/knowledge?action=new"
								className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
							>
								<span>+ SOP Article</span>
							</Link>
						</div>
					</div>

					{/* Background aesthetic decorative shapes */}
					<div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
					<div className="pointer-events-none absolute -top-12 right-1/3 h-48 w-48 rounded-full bg-[#6678c1]/20 blur-2xl"></div>
				</div>

				{/* Search & Knowledge Continuity Index Strip */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative flex-1">
						<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
							<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
								<path
									d="M17.5 17.5l-4.2-4.2m1.7-4.3a6 6 0 11-12 0 6 6 0 0112 0z"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							</svg>
						</span>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search company stream, SOPs, spaces, or people directory..."
							className="w-full rounded-2xl border border-[#d9e2ef] bg-white py-3 pl-10 pr-4 text-xs text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#404d85] focus:outline-none focus:ring-2 focus:ring-[#404d85]/10"
						/>
					</div>

					{/* Navigation View Tabs */}
					<div className="flex items-center gap-1 rounded-2xl border border-[#d9e2ef] bg-white p-1 shadow-sm">
						{[
							{ id: "stream", label: "Workplace Stream", icon: "💬" },
							{ id: "spaces", label: "Active Spaces", icon: "🏢" },
							{ id: "knowledge", label: "Knowledge Wiki", icon: "📚" },
							{ id: "modules", label: "Module Engines", icon: "⚡" },
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id as any)}
								className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
									activeTab === tab.id
										? "bg-[#404d85] text-white shadow-sm"
										: "text-slate-600 hover:bg-[#eef2fa] hover:text-slate-900"
								}`}
							>
								<span>{tab.icon}</span>
								<span>{tab.label}</span>
							</button>
						))}
					</div>
				</div>

				{/* 4 CORE PILLARS OVERVIEW STRIP */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Link
						href="/directory"
						className="group rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
					>
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pillar 1</span>
							<span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Directory</span>
						</div>
						<h2 className="mt-2 text-base font-bold text-slate-900 group-hover:text-[#404d85]">Users & Presence</h2>
						<p className="mt-1 text-xs text-slate-500">
							Search across 142 colleagues, departments, skillsets, and availability status.
						</p>
					</Link>

					<Link
						href="/spaces"
						className="group rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
					>
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pillar 2</span>
							<span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">Collab</span>
						</div>
						<h2 className="mt-2 text-base font-bold text-slate-900 group-hover:text-[#404d85]">Spaces</h2>
						<p className="mt-1 text-xs text-slate-500">
							Collaborative zones for company-wide, department squads, and private boards.
						</p>
					</Link>

					<Link
						href="/knowledge"
						className="group rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
					>
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pillar 3</span>
							<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Memory</span>
						</div>
						<h2 className="mt-2 text-base font-bold text-slate-900 group-hover:text-[#404d85]">Content & SOPs</h2>
						<p className="mt-1 text-xs text-slate-500">
							Institutional memory, searchable policies, technical playbooks, and guidelines.
						</p>
					</Link>

					<Link
						href="/inventory/supply-chain"
						className="group rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
					>
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pillar 4</span>
							<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Supply Chain</span>
						</div>
						<h2 className="mt-2 text-base font-bold text-slate-900 group-hover:text-[#404d85]">Commerce, Stock & PO</h2>
						<p className="mt-1 text-xs text-slate-500">
							Circular engine: Storefront orders ➔ Warehouse deduction ➔ 1-click Auto POs.
						</p>
					</Link>
				</div>

				{/* MAIN 2-COLUMN WORKPLACE LAYOUT */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Left 2 Columns: Workplace Stream / Feed */}
					<div className="space-y-4 lg:col-span-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<h2 className="text-lg font-bold text-slate-900">Workplace Broadcast & Stream</h2>
								<span className="rounded-full bg-[#eef2fa] px-2.5 py-0.5 text-xs font-semibold text-[#404d85]">
									{filteredPosts.length} updates
								</span>
							</div>
							<button
								onClick={() => setNewPostModalOpen(true)}
								className="text-xs font-semibold text-[#6678c1] hover:text-[#404d85]"
							>
								+ Share with Team
							</button>
						</div>

						{/* Posts stream */}
						<div className="space-y-4">
							{filteredPosts.map((post) => (
								<div
									key={post.id}
									className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
										post.pinned ? "border-amber-200 bg-amber-50/20" : "border-[#d9e2ef]"
									}`}
								>
									{post.pinned && (
										<div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
											<span>📌</span>
											<span>Pinned Leadership Announcement</span>
										</div>
									)}

									<div className="flex items-start justify-between gap-4">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#323d6b] to-[#6678c1] text-sm font-bold text-white shadow-sm">
												{post.author.avatar}
											</div>
											<div>
												<h4 className="text-sm font-bold text-slate-900">{post.author.name}</h4>
												<p className="text-[11px] text-slate-500">
													{post.author.role} • <span className="font-medium text-[#404d85]">{post.author.department}</span>
												</p>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
												{post.space}
											</span>
											<span className="text-[11px] text-slate-400">{post.timestamp}</span>
										</div>
									</div>

									<div className="mt-4">
										<h3 className="text-base font-bold text-slate-900">{post.title}</h3>
										<p className="mt-1.5 text-xs leading-relaxed text-slate-600">{post.content}</p>
									</div>

									{post.tags && post.tags.length > 0 && (
										<div className="mt-3 flex flex-wrap gap-1.5">
											{post.tags.map((tag) => (
												<span
													key={tag}
													className="rounded-md bg-[#eef2fa] px-2 py-0.5 text-[10px] font-semibold text-[#404d85]"
												>
													#{tag}
												</span>
											))}
										</div>
									)}

									<div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
										<div className="flex items-center gap-4">
											<button
												onClick={() => {
													setPosts(
														posts.map((p) => (p.id === post.id ? { ...p, likes: p.likes + 1 } : p))
													);
												}}
												className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-600 transition hover:bg-slate-100 hover:text-red-500"
											>
												<span>❤️</span>
												<span>{post.likes}</span>
											</button>
											<button className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-600 transition hover:bg-slate-100 hover:text-[#404d85]">
												<span>💬</span>
												<span>{post.comments} comments</span>
											</button>
										</div>
										<span className="text-[11px] text-slate-400">Enterprise Verified</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Right Column: Spaces Switcher & Module Quick Launcher */}
					<div className="space-y-6">
						{/* SPACES WIDGET */}
						<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-4">
							<div className="flex items-center justify-between border-b border-slate-100 pb-3">
								<div>
									<h3 className="text-sm font-bold text-slate-900">Your Spaces</h3>
									<p className="text-[11px] text-slate-500">Dedicated team collaboration zones</p>
								</div>
								<Link
									href="/spaces"
									className="text-xs font-semibold text-[#6678c1] hover:text-[#404d85]"
								>
									Explore All
								</Link>
							</div>

							<div className="space-y-2">
								{spaces.map((sp) => (
									<Link
										key={sp.id}
										href={`/spaces/${sp.id}`}
										className="group flex items-center justify-between rounded-xl border border-transparent p-2.5 transition hover:border-[#d9e2ef] hover:bg-[#f8faff]"
									>
										<div className="flex items-center gap-2.5">
											<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2fa] text-sm">
												{sp.icon}
											</span>
											<div>
												<div className="flex items-center gap-1.5">
													<p className="text-xs font-bold text-slate-900 group-hover:text-[#404d85]">
														{sp.name}
													</p>
													{sp.isPrivate && (
														<span className="text-[10px] text-slate-400" title="Private space">
															🔒
														</span>
													)}
												</div>
												<p className="text-[10px] text-slate-500">{sp.membersCount} members</p>
											</div>
										</div>

										{sp.unreadCount > 0 && (
											<span className="rounded-full bg-[#6678c1] px-2 py-0.5 text-[10px] font-bold text-white">
												{sp.unreadCount} new
											</span>
										)}
									</Link>
								))}
							</div>

							<Link
								href="/spaces?action=create"
								className="block w-full rounded-xl border border-dashed border-[#d9e2ef] p-2.5 text-center text-xs font-semibold text-[#404d85] transition hover:border-[#404d85] hover:bg-[#eef2fa]"
							>
								+ Create New Space
							</Link>
						</div>

						{/* OPERATIONAL ENGINES (MODULES LAUNCHER) */}
						<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-4">
							<div className="border-b border-slate-100 pb-3">
								<h3 className="text-sm font-bold text-slate-900">Operational Engines</h3>
								<p className="text-[11px] text-slate-500">Connected business modules launcher</p>
							</div>

							<div className="grid grid-cols-2 gap-2.5">
								<Link
									href="/crm"
									className="group flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-[#6678c1] hover:bg-white hover:shadow-sm"
								>
									<span className="text-lg">📊</span>
									<span className="mt-1 text-xs font-bold text-slate-900 group-hover:text-[#404d85]">CRM</span>
									<span className="text-[10px] text-slate-500">Pipeline & Leads</span>
								</Link>

								<Link
									href="/hrm"
									className="group flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-[#6678c1] hover:bg-white hover:shadow-sm"
								>
									<span className="text-lg">👥</span>
									<span className="mt-1 text-xs font-bold text-slate-900 group-hover:text-[#404d85]">HRM</span>
									<span className="text-[10px] text-slate-500">Talent & Attendance</span>
								</Link>

								<Link
									href="/inventory"
									className="group flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-[#6678c1] hover:bg-white hover:shadow-sm"
								>
									<span className="text-lg">📦</span>
									<span className="mt-1 text-xs font-bold text-slate-900 group-hover:text-[#404d85]">Inventory</span>
									<span className="text-[10px] text-slate-500">Stock & Warehousing</span>
								</Link>

								<Link
									href="/akaunting"
									className="group flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-[#6678c1] hover:bg-white hover:shadow-sm"
								>
									<span className="text-lg">💰</span>
									<span className="mt-1 text-xs font-bold text-slate-900 group-hover:text-[#404d85]">Accountech</span>
									<span className="text-[10px] text-slate-500">ERP & Invoicing</span>
								</Link>

								<Link
									href="/file-sharing"
									className="group flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-[#6678c1] hover:bg-white hover:shadow-sm"
								>
									<span className="text-lg">📁</span>
									<span className="mt-1 text-xs font-bold text-slate-900 group-hover:text-[#404d85]">File Vault</span>
									<span className="text-[10px] text-slate-500">Secure Cloud Drive</span>
								</Link>

								<Link
									href="/video-connect"
									className="group flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-[#6678c1] hover:bg-white hover:shadow-sm"
								>
									<span className="text-lg">📹</span>
									<span className="mt-1 text-xs font-bold text-slate-900 group-hover:text-[#404d85]">Video Connect</span>
									<span className="text-[10px] text-slate-500">Instant HD Meetings</span>
								</Link>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<Link
									href="/storefront"
									className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 p-3 text-xs font-bold text-slate-950 shadow-sm transition hover:from-amber-400 hover:to-amber-300"
								>
									<div className="flex items-center gap-2">
										<span>🏬</span>
										<span>Marketplace Supplies Hub</span>
									</div>
									<span>→</span>
								</Link>
							</div>
						</div>

						{/* KNOWLEDGE CONTINUITY SPOTLIGHT */}
						<div className="rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-5 shadow-sm space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-bold text-slate-900">Knowledge Continuity</h3>
								<Link href="/knowledge" className="text-xs font-semibold text-[#6678c1] hover:text-[#404d85]">
									View Wiki
								</Link>
							</div>
							<p className="text-xs text-slate-600">
								Institutional memory prevents operational disruption. Read the most viewed organizational playbooks:
							</p>
							<div className="space-y-1.5 text-xs">
								<Link
									href="/knowledge/company-handbook"
									className="block rounded-lg p-2 font-medium text-slate-700 hover:bg-white hover:text-[#404d85]"
								>
									📖 Employee Operating Handbook 2026
								</Link>
								<Link
									href="/knowledge/security-protocols"
									className="block rounded-lg p-2 font-medium text-slate-700 hover:bg-white hover:text-[#404d85]"
								>
									🔐 Enterprise Data Security & RBAC Policy
								</Link>
								<Link
									href="/knowledge/crm-pipeline-sop"
									className="block rounded-lg p-2 font-medium text-slate-700 hover:bg-white hover:text-[#404d85]"
								>
									⚡ Sales Pipeline & Quote Conversion SOP
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* MODAL: BROADCAST NEW UPDATE */}
				{newPostModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
						<div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
							<div className="flex items-center justify-between border-b border-slate-100 pb-3">
								<h3 className="text-base font-bold text-slate-900">Broadcast Workplace Update</h3>
								<button
									onClick={() => setNewPostModalOpen(false)}
									className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
								>
									✕
								</button>
							</div>

							<form onSubmit={handleCreatePost} className="mt-4 space-y-4">
								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Target Space</label>
									<select
										value={newPostSpace}
										onChange={(e) => setNewPostSpace(e.target.value)}
										className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none"
									>
										{spaces.map((s) => (
											<option key={s.id} value={s.name}>
												{s.icon} {s.name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Headline / Title</label>
									<input
										type="text"
										value={newPostTitle}
										onChange={(e) => setNewPostTitle(e.target.value)}
										placeholder="e.g. Q3 Strategic Priorities & Module Rollout"
										required
										className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Message Body</label>
									<textarea
										rows={4}
										value={newPostContent}
										onChange={(e) => setNewPostContent(e.target.value)}
										placeholder="Share context, action items, or announcements with the team..."
										required
										className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
									/>
								</div>

								<div className="flex items-center justify-end gap-3 pt-2">
									<button
										type="button"
										onClick={() => setNewPostModalOpen(false)}
										className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="rounded-xl bg-[#404d85] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6b]"
									>
										Publish to Space
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</WorkspaceShell>
	);
}
