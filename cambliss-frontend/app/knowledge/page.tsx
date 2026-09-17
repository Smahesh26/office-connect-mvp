"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";

type Article = {
	id: string;
	slug: string;
	title: string;
	category: "policies" | "operations" | "engineering" | "onboarding";
	summary: string;
	author: {
		name: string;
		role: string;
		avatar: string;
	};
	updatedAt: string;
	readingTime: string;
	views: number;
	tags: string[];
	verified: boolean;
};

const DEFAULT_ARTICLES: Article[] = [
	{
		id: "art-1",
		slug: "company-handbook",
		title: "Employee Operating Handbook & Code of Conduct 2026",
		category: "policies",
		summary:
			"The core organizational principles, professional standards, remote work guidelines, and compliance expectations for all personnel.",
		author: {
			name: "Elena Rostova",
			role: "People & Talent Lead",
			avatar: "ER",
		},
		updatedAt: "Sep 12, 2026",
		readingTime: "8 min read",
		views: 342,
		tags: ["Handbook", "Culture", "Compliance"],
		verified: true,
	},
	{
		id: "art-2",
		slug: "central-multi-module",
		title: "Office Connect Central Multi-Module Integration Protocol",
		category: "engineering",
		summary:
			"Technical architecture specification for cross-module data exchange between CRM, Accountech ERP, and Multi-Vendor Marketplace.",
		author: {
			name: "David Chen",
			role: "Lead Platform Architect",
			avatar: "DC",
		},
		updatedAt: "Sep 14, 2026",
		readingTime: "12 min read",
		views: 219,
		tags: ["Architecture", "API", "ERP"],
		verified: true,
	},
	{
		id: "art-3",
		slug: "sales-pipeline-sop",
		title: "Enterprise CRM Pipeline & Quote-to-Cash Workflow SOP",
		category: "operations",
		summary:
			"Standard procedure for logging leads, transitioning deals from Discovery to Negotiation, and triggering automated ERP invoice generation.",
		author: {
			name: "Marcus Vance",
			role: "VP Sales",
			avatar: "MV",
		},
		updatedAt: "Sep 08, 2026",
		readingTime: "6 min read",
		views: 185,
		tags: ["CRM", "Sales", "Invoicing"],
		verified: true,
	},
	{
		id: "art-4",
		slug: "security-protocols",
		title: "Enterprise Data Protection, RBAC & SOC2 Compliance Policy",
		category: "policies",
		summary:
			"Guidelines on access levels, two-factor authentication requirements, confidential document handling, and security incident response.",
		author: {
			name: "Security Committee",
			role: "Governance",
			avatar: "SC",
		},
		updatedAt: "Aug 29, 2026",
		readingTime: "10 min read",
		views: 412,
		tags: ["Security", "RBAC", "Governance"],
		verified: true,
	},
	{
		id: "art-5",
		slug: "vendor-onboarding-sop",
		title: "Marketplace 3P Vendor Verification & Catalog Audit SOP",
		category: "operations",
		summary:
			"Step-by-step checklist for reviewing merchant business licenses, verifying payout details, and auditing product listings.",
		author: {
			name: "Carlos Ramos",
			role: "Marketplace Ops",
			avatar: "CR",
		},
		updatedAt: "Sep 04, 2026",
		readingTime: "7 min read",
		views: 164,
		tags: ["Marketplace", "Vendors", "Audit"],
		verified: true,
	},
	{
		id: "art-6",
		slug: "new-hire-fasttrack",
		title: "New Employee 30-Day Onboarding Roadmap",
		category: "onboarding",
		summary:
			"Day 1 to Day 30 milestones, mentor assignment, software provisioning, and key organizational contacts.",
		author: {
			name: "Elena Rostova",
			role: "People & Talent Lead",
			avatar: "ER",
		},
		updatedAt: "Aug 15, 2026",
		readingTime: "5 min read",
		views: 290,
		tags: ["Onboarding", "HRM", "Training"],
		verified: true,
	},
];

function KnowledgeHubContent() {
	const searchParams = useSearchParams();
	const [articles, setArticles] = useState<Article[]>(DEFAULT_ARTICLES);
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [newArticleModalOpen, setNewArticleModalOpen] = useState(false);

	// New article form
	const [newTitle, setNewTitle] = useState("");
	const [newCategory, setNewCategory] = useState<Article["category"]>("operations");
	const [newSummary, setNewSummary] = useState("");
	const [newContent, setNewContent] = useState("");

	useEffect(() => {
		const categoryParam = searchParams.get("category");
		if (categoryParam) {
			setSelectedCategory(categoryParam);
		}
		if (searchParams.get("action") === "new") {
			setNewArticleModalOpen(true);
		}
	}, [searchParams]);

	const filteredArticles = useMemo(() => {
		return articles.filter((art) => {
			const matchesCategory = selectedCategory === "all" || art.category === selectedCategory;
			const q = searchQuery.toLowerCase();
			const matchesSearch =
				!searchQuery.trim() ||
				art.title.toLowerCase().includes(q) ||
				art.summary.toLowerCase().includes(q) ||
				art.author.name.toLowerCase().includes(q) ||
				art.tags.some((t) => t.toLowerCase().includes(q));
			return matchesCategory && matchesSearch;
		});
	}, [articles, selectedCategory, searchQuery]);

	const handleCreateArticle = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTitle.trim()) return;

		const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
		const created: Article = {
			id: `art-${Date.now()}`,
			slug,
			title: newTitle,
			category: newCategory,
			summary: newSummary || "Standard operating documentation.",
			author: {
				name: "You",
				role: "Authorized Contributor",
				avatar: "ME",
			},
			updatedAt: "Just now",
			readingTime: "4 min read",
			views: 1,
			tags: [newCategory, "SOP"],
			verified: true,
		};

		setArticles([created, ...articles]);
		setNewTitle("");
		setNewSummary("");
		setNewContent("");
		setNewArticleModalOpen(false);
	};

	return (
		<WorkspaceShell>
			<div className="mx-auto max-w-7xl space-y-6 pb-12 pt-2 text-[#1f2430]">
				{/* Top Header */}
				<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
					<div>
						<div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6678c1]">
							<span>Pillar 3</span>
							<span>•</span>
							<span>Organizational Memory</span>
						</div>
						<h1 className="mt-1 text-3xl font-bold tracking-tight text-[#404d85]">
							Knowledge Continuity & SOP Wiki
						</h1>
						<p className="mt-1 max-w-2xl text-xs text-slate-500">
							Searchable enterprise playbooks, operational SOPs, and governance policies ensuring organizational memory is never lost.
						</p>
					</div>

					<button
						onClick={() => setNewArticleModalOpen(true)}
						className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#404d85] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#323d6b]"
					>
						<span>+ Create New SOP / Article</span>
					</button>
				</div>

				{/* Search & Category Filter */}
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
							placeholder="Search company knowledge, SOPs, policies, or authors..."
							className="w-full rounded-2xl border border-[#d9e2ef] bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#404d85] focus:outline-none"
						/>
					</div>

					<div className="flex items-center gap-1 rounded-2xl border border-[#d9e2ef] bg-white p-1 shadow-sm">
						{[
							{ id: "all", label: "All Knowledge" },
							{ id: "policies", label: "Policies & Governance" },
							{ id: "operations", label: "Operations SOPs" },
							{ id: "engineering", label: "Tech Playbooks" },
							{ id: "onboarding", label: "Onboarding" },
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setSelectedCategory(tab.id)}
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

				{/* ARTICLES LIST / GRID */}
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
					{filteredArticles.map((art) => (
						<div
							key={art.id}
							className="group flex flex-col justify-between rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
						>
							<div>
								<div className="flex items-start justify-between gap-3">
									<span
										className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
											art.category === "policies"
												? "border border-amber-200 bg-amber-50 text-amber-700"
												: art.category === "engineering"
												? "border border-purple-200 bg-purple-50 text-purple-700"
												: art.category === "operations"
												? "border border-blue-200 bg-blue-50 text-blue-700"
												: "border border-emerald-200 bg-emerald-50 text-emerald-700"
										}`}
									>
										{art.category}
									</span>

									{art.verified && (
										<span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
											<span>✓</span>
											<span>Verified SOP</span>
										</span>
									)}
								</div>

								<h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-[#404d85]">
									{art.title}
								</h3>

								<p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3">
									{art.summary}
								</p>

								{/* Tags */}
								<div className="mt-3 flex flex-wrap gap-1.5">
									{art.tags.map((tag) => (
										<span
											key={tag}
											className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
										>
											#{tag}
										</span>
									))}
								</div>
							</div>

							<div className="mt-5 border-t border-slate-100 pt-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2.5">
										<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#323d6b] text-[10px] font-bold text-white">
											{art.author.avatar}
										</span>
										<div>
											<p className="text-[11px] font-bold text-slate-900">{art.author.name}</p>
											<p className="text-[10px] text-slate-400">
												{art.updatedAt} • {art.readingTime}
											</p>
										</div>
									</div>

									<Link
										href={`/knowledge/${art.slug}`}
										className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#404d85] hover:bg-[#eef2fa]"
									>
										Read →
									</Link>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* CREATE ARTICLE MODAL */}
				{newArticleModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
						<div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
							<div className="flex items-center justify-between border-b border-slate-100 pb-3">
								<h3 className="text-base font-bold text-slate-900">Publish to Organizational Memory</h3>
								<button
									onClick={() => setNewArticleModalOpen(false)}
									className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
								>
									✕
								</button>
							</div>

							<form onSubmit={handleCreateArticle} className="mt-4 space-y-4">
								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Article / SOP Title</label>
									<input
										type="text"
										value={newTitle}
										onChange={(e) => setNewTitle(e.target.value)}
										placeholder="e.g. Incident Escalation & Response Protocol"
										required
										className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
									<select
										value={newCategory}
										onChange={(e) => setNewCategory(e.target.value as any)}
										className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none"
									>
										<option value="policies">Policies & Governance</option>
										<option value="operations">Operations SOP</option>
										<option value="engineering">Engineering Playbook</option>
										<option value="onboarding">Onboarding Guide</option>
									</select>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Executive Summary</label>
									<input
										type="text"
										value={newSummary}
										onChange={(e) => setNewSummary(e.target.value)}
										placeholder="Brief summary of when and why team members should reference this document..."
										required
										className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Article Content (Markdown Supported)</label>
									<textarea
										rows={5}
										value={newContent}
										onChange={(e) => setNewContent(e.target.value)}
										placeholder="## 1. Overview&#10;Document standard operational steps, role responsibilities, and expected outcomes..."
										required
										className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none font-mono"
									/>
								</div>

								<div className="flex items-center justify-end gap-3 pt-2">
									<button
										type="button"
										onClick={() => setNewArticleModalOpen(false)}
										className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="rounded-xl bg-[#404d85] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6b]"
									>
										Publish to Knowledge Base
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

export default function KnowledgePage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading Knowledge Hub...</div>}>
			<KnowledgeHubContent />
		</Suspense>
	);
}
