"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import {
	MessagesSquare,
	Search,
	Lock,
	Users,
	MessageSquare,
	Clock,
	ArrowRight,
	X,
	Megaphone,
	Zap,
	TrendingUp,
	Palette,
	Shield,
	Store,
	Plus,
} from "lucide-react";

function getSpaceCardIcon(id: string) {
	switch (id) {
		case "general":
			return <Megaphone className="h-6 w-6 text-blue-600" />;
		case "engineering":
			return <Zap className="h-6 w-6 text-amber-500" />;
		case "sales":
			return <TrendingUp className="h-6 w-6 text-emerald-600" />;
		case "product-design":
			return <Palette className="h-6 w-6 text-purple-600" />;
		case "executive":
			return <Shield className="h-6 w-6 text-indigo-600" />;
		case "marketplace-ops":
			return <Store className="h-6 w-6 text-amber-600" />;
		default:
			return <MessagesSquare className="h-6 w-6 text-[#404d85]" />;
	}
}

type SpaceCategory = "all" | "public" | "department" | "private";

type SpaceItem = {
	id: string;
	name: string;
	slug: string;
	category: "public" | "department" | "private";
	description: string;
	membersCount: number;
	postsCount: number;
	lastActive: string;
	icon: string;
	lead: string;
	tags: string[];
	isJoined: boolean;
};

const DEFAULT_SPACES: SpaceItem[] = [
	{
		id: "general",
		name: "General Announcements",
		slug: "general",
		category: "public",
		description: "Company-wide updates, quarterly town halls, executive messages, and milestones.",
		membersCount: 142,
		postsCount: 84,
		lastActive: "12m ago",
		icon: "📢",
		lead: "Sarah Jenkins (COO)",
		tags: ["Company-wide", "Broadcasts", "Leadership"],
		isJoined: true,
	},
	{
		id: "engineering",
		name: "Engineering & Tech Squad",
		slug: "engineering",
		category: "department",
		description: "Architecture reviews, sprint planning, deployment announcements, and system health.",
		membersCount: 38,
		postsCount: 156,
		lastActive: "1h ago",
		icon: "⚡",
		lead: "David Chen (Architect)",
		tags: ["Architecture", "DevOps", "APIs"],
		isJoined: true,
	},
	{
		id: "sales",
		name: "Sales & Commercial Operations",
		slug: "sales",
		category: "department",
		description: "Pipeline discussions, deal closes, CRM integration guidelines, and revenue milestones.",
		membersCount: 45,
		postsCount: 92,
		lastActive: "3h ago",
		icon: "📈",
		lead: "Marcus Vance (VP Sales)",
		tags: ["Revenue", "CRM", "Deals"],
		isJoined: false,
	},
	{
		id: "product-design",
		name: "Product Design & UX",
		slug: "product-design",
		category: "department",
		description: "Design systems, usability research, design reviews, and storefront UX guidelines.",
		membersCount: 22,
		postsCount: 64,
		lastActive: "5h ago",
		icon: "🎨",
		lead: "Amina Al-Mansoor (Design Dir)",
		tags: ["UI/UX", "Storefront", "Design"],
		isJoined: true,
	},
	{
		id: "executive",
		name: "Executive Committee",
		slug: "executive",
		category: "private",
		description: "Strategic planning, board materials, confidential compliance, and governance oversight.",
		membersCount: 8,
		postsCount: 29,
		lastActive: "1d ago",
		icon: "🏛️",
		lead: "Executive Board",
		tags: ["Confidential", "Governance"],
		isJoined: false,
	},
	{
		id: "marketplace-ops",
		name: "Marketplace & Vendor Operations",
		slug: "marketplace-ops",
		category: "department",
		description: "Vendor onboarding workflows, 3P seller compliance, catalog curation, and dispute reviews.",
		membersCount: 28,
		postsCount: 71,
		lastActive: "2h ago",
		icon: "🏬",
		lead: "Carlos Ramos (Market Ops)",
		tags: ["Vendors", "Catalog", "Logistics"],
		isJoined: true,
	},
];

function SpacesDirectoryContent() {
	const searchParams = useSearchParams();
	const [spaces, setSpaces] = useState<SpaceItem[]>(DEFAULT_SPACES);
	const [selectedCategory, setSelectedCategory] = useState<SpaceCategory>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [createModalOpen, setCreateModalOpen] = useState(false);

	// Form states
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState<"public" | "department" | "private">("public");
	const [icon, setIcon] = useState("🚀");

	useEffect(() => {
		if (searchParams.get("action") === "create") {
			setCreateModalOpen(true);
		}
	}, [searchParams]);

	const filteredSpaces = useMemo(() => {
		return spaces.filter((sp) => {
			const matchesCategory = selectedCategory === "all" || sp.category === selectedCategory;
			const matchesSearch =
				!searchQuery.trim() ||
				sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				sp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				sp.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
			return matchesCategory && matchesSearch;
		});
	}, [spaces, selectedCategory, searchQuery]);

	const handleCreateSpace = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
		const newSpace: SpaceItem = {
			id: slug,
			name,
			slug,
			category,
			description,
			membersCount: 1,
			postsCount: 0,
			lastActive: "Just now",
			icon: icon || "🏢",
			lead: "You",
			tags: [category, "New"],
			isJoined: true,
		};

		setSpaces([newSpace, ...spaces]);
		setName("");
		setDescription("");
		setCreateModalOpen(false);
	};

	const toggleJoin = (id: string, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setSpaces(
			spaces.map((sp) => {
				if (sp.id === id) {
					return {
						...sp,
						isJoined: !sp.isJoined,
						membersCount: sp.isJoined ? sp.membersCount - 1 : sp.membersCount + 1,
					};
				}
				return sp;
			})
		);
	};

	return (
		<WorkspaceShell>
			<div className="mx-auto max-w-7xl space-y-6 pb-12 pt-2 text-[#1f2430]">
				{/* Top Header */}
				<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
					<div>
						<div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6678c1]">
							<span>Pillar 2</span>
							<span>•</span>
							<span>Collaboration Zones</span>
						</div>
						<h1 className="mt-1 text-3xl font-bold tracking-tight text-[#404d85]">
							Spaces Directory
						</h1>
						<p className="mt-1 max-w-2xl text-xs text-slate-500">
							Join dedicated collaboration spaces for projects, departments, and cross-functional squads with strict access boundaries.
						</p>
					</div>

					<button
						onClick={() => setCreateModalOpen(true)}
						className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#404d85] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#323d6b]"
					>
						<span>+ Create New Space</span>
					</button>
				</div>

				{/* Search & Filter Bar */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative flex-1">
						<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
							<Search className="h-4 w-4 text-slate-400" />
						</span>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search spaces by name, topic, or tags..."
							className="w-full rounded-2xl border border-[#d9e2ef] bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#404d85] focus:outline-none"
						/>
					</div>

					{/* Category Tabs */}
					<div className="flex items-center gap-1 rounded-2xl border border-[#d9e2ef] bg-white p-1 shadow-sm">
						{[
							{ id: "all", label: "All Spaces" },
							{ id: "public", label: "Public" },
							{ id: "department", label: "Departments" },
							{ id: "private", label: "Private Zones" },
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setSelectedCategory(tab.id as SpaceCategory)}
								className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
									selectedCategory === tab.id
										? "bg-[#404d85] text-white shadow-sm"
										: "text-slate-600 hover:bg-[#eef2fa] hover:text-slate-900"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				{/* SPACES GRID */}
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
					{filteredSpaces.map((sp) => (
						<div
							key={sp.id}
							className="group flex flex-col justify-between rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
						>
							<div>
								<div className="flex items-start justify-between gap-3">
									<div className="flex items-center gap-3">
										<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2fa] shadow-sm">
											{getSpaceCardIcon(sp.id)}
										</span>
										<div>
											<h3 className="text-base font-bold text-slate-900 group-hover:text-[#404d85]">
												{sp.name}
											</h3>
											<p className="text-[11px] text-slate-500">Lead: {sp.lead}</p>
										</div>
									</div>

									<span
										className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
											sp.category === "private"
												? "border border-amber-200 bg-amber-50 text-amber-700"
												: sp.category === "department"
												? "border border-purple-200 bg-purple-50 text-purple-700"
												: "border border-emerald-200 bg-emerald-50 text-emerald-700"
										}`}
									>
										{sp.category === "private" ? (
											<span className="inline-flex items-center gap-1">
												<Lock className="h-2.5 w-2.5" /> Private
											</span>
										) : (
											sp.category
										)}
									</span>
								</div>

								<p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
									{sp.description}
								</p>

								{/* Tags */}
								<div className="mt-3 flex flex-wrap gap-1.5">
									{sp.tags.map((tag) => (
										<span
											key={tag}
											className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
										>
											#{tag}
										</span>
									))}
								</div>
							</div>

							<div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
								<div className="flex items-center gap-3 text-slate-500 text-[11px]">
									<span className="inline-flex items-center gap-1">
										<Users className="h-3 w-3" /> {sp.membersCount}
									</span>
									<span className="inline-flex items-center gap-1">
										<MessageSquare className="h-3 w-3" /> {sp.postsCount} posts
									</span>
									<span className="inline-flex items-center gap-1">
										<Clock className="h-3 w-3" /> {sp.lastActive}
									</span>
								</div>

								<div className="flex items-center gap-2">
									<button
										onClick={(e) => toggleJoin(sp.id, e)}
										className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
											sp.isJoined
												? "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
												: "bg-[#404d85] text-white hover:bg-[#323d6b]"
										}`}
									>
										{sp.isJoined ? "Joined" : "Join"}
									</button>

									<Link
										href={`/spaces/${sp.id}`}
										className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#404d85] hover:bg-[#eef2fa]"
									>
										<span>Open</span>
										<ArrowRight className="h-3.5 w-3.5" />
									</Link>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* CREATE SPACE MODAL */}
				{createModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
						<div className="w-full max-w-md rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
							<div className="flex items-center justify-between border-b border-slate-100 pb-3">
								<h3 className="text-base font-bold text-slate-900">Create Collaboration Space</h3>
								<button
									onClick={() => setCreateModalOpen(false)}
									className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
								>
									<X className="h-4 w-4" />
								</button>
							</div>

							<form onSubmit={handleCreateSpace} className="mt-4 space-y-4">
								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Space Name</label>
									<input
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="e.g. Customer Experience Squad"
										required
										className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none"
									/>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
										<select
											value={category}
											onChange={(e) => setCategory(e.target.value as any)}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none"
										>
											<option value="public">Public Space</option>
											<option value="department">Department</option>
											<option value="private">Private Zone</option>
										</select>
									</div>

									<div>
										<label className="block text-xs font-semibold text-slate-700 mb-1">Icon Emoji</label>
										<input
											type="text"
											value={icon}
											onChange={(e) => setIcon(e.target.value)}
											placeholder="e.g. 🚀"
											className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-center text-slate-900 focus:border-[#404d85] focus:outline-none"
										/>
									</div>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Purpose & Description</label>
									<textarea
										rows={3}
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Describe the focus, mission, and scope of this collaboration space..."
										required
										className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none"
									/>
								</div>

								<div className="flex items-center justify-end gap-3 pt-2">
									<button
										type="button"
										onClick={() => setCreateModalOpen(false)}
										className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="rounded-xl bg-[#404d85] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6b]"
									>
										Initialize Space
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

export default function SpacesPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading Spaces...</div>}>
			<SpacesDirectoryContent />
		</Suspense>
	);
}
