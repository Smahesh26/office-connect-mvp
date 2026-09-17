"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import WorkspaceShell from "../../../components/WorkspaceShell";
import {
	Bell,
	MessageSquare,
	BookOpen,
	Folder,
	Users,
	FileText,
	Megaphone,
	Zap,
	TrendingUp,
	Shield,
	Building,
} from "lucide-react";

function getSpaceDetailIcon(id: string) {
	switch (id) {
		case "general":
			return <Megaphone className="h-8 w-8 text-blue-600" />;
		case "engineering":
			return <Zap className="h-8 w-8 text-amber-500" />;
		case "sales":
			return <TrendingUp className="h-8 w-8 text-emerald-600" />;
		case "executive":
			return <Shield className="h-8 w-8 text-purple-600" />;
		default:
			return <Building className="h-8 w-8 text-[#404d85]" />;
	}
}

type SpaceTab = "discussions" | "wiki" | "files" | "members";

type Thread = {
	id: string;
	author: {
		name: string;
		role: string;
		avatar: string;
	};
	title: string;
	content: string;
	timestamp: string;
	likes: number;
	comments: {
		id: string;
		author: string;
		avatar: string;
		content: string;
		time: string;
	}[];
};

const SPACE_DETAILS: Record<
	string,
	{
		name: string;
		category: string;
		description: string;
		icon: string;
		lead: string;
		members: { name: string; role: string; avatar: string }[];
		pinnedDoc: string;
		guidelines: string;
	}
> = {
	general: {
		name: "General Announcements",
		category: "Public Space",
		description: "Company-wide updates, quarterly town halls, executive messages, and milestones.",
		icon: "📢",
		lead: "Sarah Jenkins (COO)",
		pinnedDoc: "2026 Company Strategic Roadmap & Operating Rhythm",
		guidelines: "All company-wide announcements are broadcast here. Keep replies constructive and on-topic.",
		members: [
			{ name: "Sarah Jenkins", role: "COO", avatar: "SJ" },
			{ name: "David Chen", role: "Lead Architect", avatar: "DC" },
			{ name: "Elena Rostova", role: "People Lead", avatar: "ER" },
			{ name: "Marcus Vance", role: "VP Sales", avatar: "MV" },
		],
	},
	engineering: {
		name: "Engineering & Tech Squad",
		category: "Department",
		description: "Architecture reviews, sprint planning, deployment announcements, and system health.",
		icon: "⚡",
		lead: "David Chen (Lead Architect)",
		pinnedDoc: "Central Multi-Module API & Synchronization Protocol",
		guidelines: "Code review standards, CI/CD procedures, and architectural decisions are logged here.",
		members: [
			{ name: "David Chen", role: "Lead Architect", avatar: "DC" },
			{ name: "Alex Wong", role: "Senior Backend Eng", avatar: "AW" },
			{ name: "Kavita Reddy", role: "Frontend Lead", avatar: "KR" },
			{ name: "Liam O'Connor", role: "DevOps Engineer", avatar: "LO" },
		],
	},
	sales: {
		name: "Sales & Commercial Operations",
		category: "Department",
		description: "Pipeline discussions, deal closes, CRM integration guidelines, and revenue milestones.",
		icon: "📈",
		lead: "Marcus Vance (VP Sales)",
		pinnedDoc: "Enterprise CRM Pipeline & Closing Playbook",
		guidelines: "Share lead insights, high-value opportunities, and CRM workflow updates.",
		members: [
			{ name: "Marcus Vance", role: "VP Sales", avatar: "MV" },
			{ name: "Rachel Adams", role: "Account Executive", avatar: "RA" },
			{ name: "Jordan Smith", role: "Sales Ops", avatar: "JS" },
		],
	},
	executive: {
		name: "Executive Committee",
		category: "Private Zone",
		description: "Strategic planning, board materials, confidential compliance, and governance oversight.",
		icon: "🏛️",
		lead: "Executive Board",
		pinnedDoc: "Annual Strategic Budget & Audit Review 2026",
		guidelines: "Strict confidentiality applies. Access is governed by RBAC clearance.",
		members: [
			{ name: "Sarah Jenkins", role: "COO", avatar: "SJ" },
			{ name: "Executive Board", role: "Governance", avatar: "EB" },
		],
	},
};

export default function SpaceDetailPage() {
	const params = useParams();
	const spaceId = (params.spaceId as string) || "general";
	const currentSpace = SPACE_DETAILS[spaceId] || {
		name: `${spaceId.charAt(0).toUpperCase() + spaceId.slice(1)} Space`,
		category: "Department",
		description: "Collaboration space for team discussions, files, and project coordination.",
		icon: "🏢",
		lead: "Team Lead",
		pinnedDoc: "Space Documentation & Getting Started Guide",
		guidelines: "Engage respectfully and keep documentation updated.",
		members: [
			{ name: "Team Member 1", role: "Member", avatar: "M1" },
			{ name: "Team Member 2", role: "Member", avatar: "M2" },
		],
	};

	const [activeTab, setActiveTab] = useState<SpaceTab>("discussions");
	const [threads, setThreads] = useState<Thread[]>([
		{
			id: "t-1",
			author: {
				name: currentSpace.lead.split("(")[0].trim(),
				role: "Space Lead",
				avatar: currentSpace.lead.slice(0, 2).toUpperCase(),
			},
			title: `Welcome to the ${currentSpace.name} space`,
			content:
				"Use this space for all relevant discussions, ongoing task synchronization, and knowledge sharing. Let's make sure all relevant updates are logged here to preserve institutional memory.",
			timestamp: "2 hours ago",
			likes: 8,
			comments: [
				{
					id: "c-1",
					author: "David Chen",
					avatar: "DC",
					content: "Confirmed. All technical guidelines are linked in the Space Wiki tab.",
					time: "1 hour ago",
				},
			],
		},
	]);

	const [newThreadTitle, setNewThreadTitle] = useState("");
	const [newThreadContent, setNewThreadContent] = useState("");
	const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

	const handlePostThread = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

		const created: Thread = {
			id: `t-${Date.now()}`,
			author: {
				name: "You",
				role: "Authorized Member",
				avatar: "ME",
			},
			title: newThreadTitle,
			content: newThreadContent,
			timestamp: "Just now",
			likes: 0,
			comments: [],
		};

		setThreads([created, ...threads]);
		setNewThreadTitle("");
		setNewThreadContent("");
	};

	const handleAddComment = (threadId: string) => {
		const text = commentInputs[threadId];
		if (!text || !text.trim()) return;

		setThreads(
			threads.map((t) => {
				if (t.id === threadId) {
					return {
						...t,
						comments: [
							...t.comments,
							{
								id: `c-${Date.now()}`,
								author: "You",
								avatar: "ME",
								content: text,
								time: "Just now",
							},
						],
					};
				}
				return t;
			})
		);

		setCommentInputs({ ...commentInputs, [threadId]: "" });
	};

	return (
		<WorkspaceShell>
			<div className="mx-auto max-w-7xl space-y-6 pb-12 pt-2 text-[#1f2430]">
				{/* Top Navigation Breadcrumbs */}
				<div className="flex items-center gap-2 text-xs text-slate-500">
					<Link href="/central" className="hover:text-[#404d85]">
						Central Hub
					</Link>
					<span>/</span>
					<Link href="/spaces" className="hover:text-[#404d85]">
						Spaces
					</Link>
					<span>/</span>
					<span className="font-semibold text-slate-900">{currentSpace.name}</span>
				</div>

				{/* Space Header Card */}
				<div className="rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
					<div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
						<div className="flex items-center gap-4">
							<span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef2fa] shadow-sm">
								{getSpaceDetailIcon(spaceId)}
							</span>
							<div>
								<div className="flex items-center gap-2.5">
									<h1 className="text-2xl font-bold text-slate-900">{currentSpace.name}</h1>
									<span className="rounded-full bg-[#eef2fa] px-2.5 py-0.5 text-xs font-semibold text-[#404d85]">
										{currentSpace.category}
									</span>
								</div>
								<p className="mt-1 text-xs text-slate-500">{currentSpace.description}</p>
								<div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
									<span>Lead: <strong className="text-slate-700">{currentSpace.lead}</strong></span>
									<span>•</span>
									<span>{currentSpace.members.length} active members</span>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
								<Bell className="h-3.5 w-3.5 text-slate-500" />
								<span>Notifications</span>
							</button>
							<button className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6b]">
								Joined Space
							</button>
						</div>
					</div>

					{/* Space Tab Navigation */}
					<div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold">
						{[
							{ id: "discussions", label: "Discussions & Stream", icon: MessageSquare },
							{ id: "wiki", label: "Space Wiki & SOPs", icon: BookOpen },
							{ id: "files", label: "Files & Vault", icon: Folder },
							{ id: "members", label: "Members", icon: Users },
						].map((tab) => {
							const IconComponent = tab.icon;
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id as SpaceTab)}
									className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
										activeTab === tab.id
											? "bg-[#404d85] text-white shadow-sm"
											: "text-slate-600 hover:bg-[#eef2fa] hover:text-slate-900"
									}`}
								>
									<IconComponent className="h-3.5 w-3.5" />
									<span>{tab.label}</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* TAB CONTENTS */}
				{activeTab === "discussions" && (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						{/* Discussion Threads Feed */}
						<div className="space-y-6 lg:col-span-2">
							{/* New Thread Composer */}
							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
								<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
									Start a Thread in {currentSpace.name}
								</h3>
								<form onSubmit={handlePostThread} className="space-y-3">
									<input
										type="text"
										value={newThreadTitle}
										onChange={(e) => setNewThreadTitle(e.target.value)}
										placeholder="Topic headline..."
										className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none"
									/>
									<textarea
										rows={3}
										value={newThreadContent}
										onChange={(e) => setNewThreadContent(e.target.value)}
										placeholder="Share discussion context, blockers, or deliverables..."
										className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none"
									/>
									<div className="flex items-center justify-between pt-1">
										<span className="text-[11px] text-slate-400">Preserved in Organizational Memory</span>
										<button
											type="submit"
											className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6b]"
										>
											Post Thread
										</button>
									</div>
								</form>
							</div>

							{/* Thread List */}
							<div className="space-y-4">
								{threads.map((t) => (
									<div key={t.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#323d6b] text-xs font-bold text-white">
													{t.author.avatar}
												</span>
												<div>
													<h4 className="text-xs font-bold text-slate-900">{t.author.name}</h4>
													<p className="text-[10px] text-slate-500">{t.author.role}</p>
												</div>
											</div>
											<span className="text-[11px] text-slate-400">{t.timestamp}</span>
										</div>

										<div>
											<h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
											<p className="mt-1 text-xs leading-relaxed text-slate-600">{t.content}</p>
										</div>

										{/* Comments section */}
										{t.comments.length > 0 && (
											<div className="space-y-2 rounded-xl bg-slate-50 p-3">
												{t.comments.map((c) => (
													<div key={c.id} className="flex items-start gap-2.5 text-xs">
														<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-bold text-slate-700">
															{c.avatar}
														</span>
														<div>
															<div className="flex items-center gap-2">
																<span className="font-bold text-slate-900">{c.author}</span>
																<span className="text-[10px] text-slate-400">{c.time}</span>
															</div>
															<p className="text-slate-600 mt-0.5">{c.content}</p>
														</div>
													</div>
												))}
											</div>
										)}

										{/* Reply box */}
										<div className="flex items-center gap-2 border-t border-slate-100 pt-3">
											<input
												type="text"
												value={commentInputs[t.id] || ""}
												onChange={(e) =>
													setCommentInputs({ ...commentInputs, [t.id]: e.target.value })
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") handleAddComment(t.id);
												}}
												placeholder="Reply to this thread..."
												className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-[#404d85] focus:outline-none"
											/>
											<button
												onClick={() => handleAddComment(t.id)}
												className="rounded-xl bg-[#eef2fa] px-3 py-1.5 text-xs font-semibold text-[#404d85] hover:bg-[#d9e2ef]"
											>
												Reply
											</button>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Right Sidebar: Guidelines & Space Wiki */}
						<div className="space-y-6">
							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-3">
								<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
									Pinned SOP / Playbook
								</h3>
								<Link
									href="/knowledge/central-multi-module"
									className="group block rounded-xl border border-slate-100 bg-[#f8faff] p-3 transition hover:border-[#6678c1]"
								>
									<span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-[#404d85]">
										<FileText className="h-3.5 w-3.5 text-blue-600" />
										<span>{currentSpace.pinnedDoc}</span>
									</span>
									<p className="mt-1 text-[11px] text-slate-500">
										Required reading for all members contributing to this space.
									</p>
								</Link>
							</div>

							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-2">
								<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
									Space Governance
								</h3>
								<p className="text-xs leading-relaxed text-slate-600">{currentSpace.guidelines}</p>
							</div>

							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-3">
								<div className="flex items-center justify-between">
									<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
										Members ({currentSpace.members.length})
									</h3>
									<Link href="/directory" className="text-[11px] text-[#6678c1] font-semibold">
										Directory
									</Link>
								</div>
								<div className="space-y-2">
									{currentSpace.members.map((m) => (
										<div key={m.name} className="flex items-center gap-2.5">
											<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef2fa] text-[10px] font-bold text-[#404d85]">
												{m.avatar}
											</span>
											<div>
												<p className="text-xs font-bold text-slate-900">{m.name}</p>
												<p className="text-[10px] text-slate-500">{m.role}</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === "wiki" && (
					<div className="rounded-2xl border border-[#d9e2ef] bg-white p-8 shadow-sm space-y-4">
						<div className="flex items-center justify-between border-b border-slate-100 pb-4">
							<div>
								<h2 className="text-lg font-bold text-slate-900">{currentSpace.name} Wiki & Knowledge</h2>
								<p className="text-xs text-slate-500">Standard operating procedures, protocols, and documentation.</p>
							</div>
							<Link
								href="/knowledge?action=new"
								className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6b]"
							>
								+ New Article
							</Link>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
							<Link
								href="/knowledge"
								className="rounded-xl border border-slate-100 bg-[#f8faff] p-4 transition hover:border-[#6678c1]"
							>
								<h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
									<BookOpen className="h-4 w-4 text-blue-600" />
									<span>{currentSpace.pinnedDoc}</span>
								</h4>
								<p className="mt-1 text-xs text-slate-500">Core operational guidance for all team members.</p>
							</Link>
							<Link
								href="/knowledge"
								className="rounded-xl border border-slate-100 bg-[#f8faff] p-4 transition hover:border-[#6678c1]"
							>
								<h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
									<FileText className="h-4 w-4 text-indigo-600" />
									<span>Escalation & Incident Triage Protocol</span>
								</h4>
								<p className="mt-1 text-xs text-slate-500">How to handle priority issues across departments.</p>
							</Link>
						</div>
					</div>
				)}

				{activeTab === "files" && (
					<div className="rounded-2xl border border-[#d9e2ef] bg-white p-8 shadow-sm space-y-4">
						<div className="flex items-center justify-between border-b border-slate-100 pb-4">
							<div>
								<h2 className="text-lg font-bold text-slate-900">Space Files & Vault</h2>
								<p className="text-xs text-slate-500">Shared attachments, spreadsheets, presentations, and assets.</p>
							</div>
							<Link
								href="/file-sharing"
								className="rounded-xl bg-[#404d85] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6b]"
							>
								Open Full File Vault
							</Link>
						</div>

						<div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
							<Folder className="h-10 w-10 text-slate-400 mx-auto" />
							<h4 className="mt-2 text-sm font-bold text-slate-700">Space File Vault Active</h4>
							<p className="mt-1 text-xs text-slate-500">Drag and drop files to attach to this space, or view them in File Sharing.</p>
						</div>
					</div>
				)}

				{activeTab === "members" && (
					<div className="rounded-2xl border border-[#d9e2ef] bg-white p-8 shadow-sm space-y-4">
						<div className="flex items-center justify-between border-b border-slate-100 pb-4">
							<div>
								<h2 className="text-lg font-bold text-slate-900">Space Members & Roles</h2>
								<p className="text-xs text-slate-500">People with access to discussions and documentation in this space.</p>
							</div>
							<Link
								href="/directory"
								className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
							>
								Browse Company Directory
							</Link>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
							{currentSpace.members.map((m) => (
								<div key={m.name} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#f8faff] p-3">
									<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#323d6b] text-xs font-bold text-white">
										{m.avatar}
									</span>
									<div>
										<h4 className="text-xs font-bold text-slate-900">{m.name}</h4>
										<p className="text-[11px] text-slate-500">{m.role}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</WorkspaceShell>
	);
}
