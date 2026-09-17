"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import WorkspaceShell from "../../../components/WorkspaceShell";

const ARTICLES_DATABASE: Record<
	string,
	{
		title: string;
		category: string;
		updatedAt: string;
		version: string;
		readingTime: string;
		author: { name: string; role: string; avatar: string; department: string };
		sections: { heading: string; body: string }[];
		relatedModules: { name: string; href: string; icon: string }[];
	}
> = {
	"company-handbook": {
		title: "Employee Operating Handbook & Code of Conduct 2026",
		category: "Policies & Governance",
		updatedAt: "September 12, 2026",
		version: "v3.2 - Annual Board Approved",
		readingTime: "8 min read",
		author: {
			name: "Elena Rostova",
			role: "People & Talent Lead",
			avatar: "ER",
			department: "Human Resources",
		},
		sections: [
			{
				heading: "1. Strategic Purpose & Organizational Values",
				body: "Office Connect Central functions as our digital operating anchor. Every team member contributes to our institutional memory by keeping communications transparent across Spaces, documenting processes in Knowledge, and respecting data boundaries across our operational modules.",
			},
			{
				heading: "2. Working Rhythm & Cross-Department Collaboration",
				body: "We operate on an asynchronous-first model supplemented by high-impact synchronous checkpoints. All cross-functional initiatives must maintain an active Space where decisions, meeting minutes, and deliverables are publicly accessible to authorized personnel.",
			},
			{
				heading: "3. Information Governance & Security Clearance",
				body: "Access to client financial ledgers (Accountech ERP) and personnel records (HRM) is restricted by Role-Based Access Control (RBAC). Employees must never share credentials or export raw data outside of approved enterprise channels.",
			},
		],
		relatedModules: [
			{ name: "HRM Portal", href: "/hrm", icon: "👥" },
			{ name: "User Management", href: "/user-management", icon: "🔐" },
		],
	},
	"central-multi-module": {
		title: "Office Connect Central Multi-Module Integration Protocol",
		category: "Engineering Playbooks",
		updatedAt: "September 14, 2026",
		version: "v4.0 - Production Architecture",
		readingTime: "12 min read",
		author: {
			name: "David Chen",
			role: "Lead Platform Architect",
			avatar: "DC",
			department: "Engineering Core",
		},
		sections: [
			{
				heading: "1. Architectural Overview & Integration Fabric",
				body: "Office Connect Central unifies distinct enterprise modules into a coherent execution layer. Data flows seamlessly between CRM, Accountech ERP, Inventory, and the Marketplace through unified domain events and shared organization tenancies.",
			},
			{
				heading: "2. CRM to Accountech Quote-to-Invoice Pipeline",
				body: "When an opportunity in CRM reaches 'Closed Won', the system triggers an invoice draft in Accountech ERP via the `/api/akaunting/sync` webhook. The payment receipt subsequently syncs back to update the client's lifetime revenue tally.",
			},
			{
				heading: "3. Marketplace 3P Seller Fulfillment to Inventory Tracking",
				body: "Orders placed on the Multi-Vendor Marketplace immediately reserve stock in the Inventory module. 3P vendors update fulfillment tracking numbers via Seller Central, which triggers automated customer email notifications.",
			},
		],
		relatedModules: [
			{ name: "CRM Engine", href: "/crm", icon: "📊" },
			{ name: "Accountech ERP", href: "/akaunting", icon: "💰" },
			{ name: "Inventory", href: "/inventory", icon: "📦" },
		],
	},
	"sales-pipeline-sop": {
		title: "Enterprise CRM Pipeline & Quote-to-Cash Workflow SOP",
		category: "Operations SOPs",
		updatedAt: "September 08, 2026",
		version: "v2.1",
		readingTime: "6 min read",
		author: {
			name: "Marcus Vance",
			role: "VP Sales",
			avatar: "MV",
			department: "Commercial Operations",
		},
		sections: [
			{
				heading: "1. Lead Qualification Standards (BANT Framework)",
				body: "Prior to converting an inquiry into a formal deal stage, account executives must confirm Budget, Authority, Need, and Timeline. Unqualified inquiries should remain tagged as 'Prospecting' in CRM.",
			},
			{
				heading: "2. Proposal Generation & Discount Approvals",
				body: "Any proposal offering more than a 15% discount requires approval from the Commercial Director inside the #sales space before issuance.",
			},
			{
				heading: "3. Deal Closing & Account Handover",
				body: "Upon contract execution, transfer the client onboarding dossier to Customer Success and notify Finance for revenue schedule initialization.",
			},
		],
		relatedModules: [
			{ name: "CRM Portal", href: "/crm", icon: "📊" },
			{ name: "Accountech ERP", href: "/akaunting", icon: "💰" },
		],
	},
};

export default function ArticleDetailPage() {
	const params = useParams();
	const articleId = (params.articleId as string) || "company-handbook";

	const article = ARTICLES_DATABASE[articleId] || {
		title: `${articleId.replace(/-/g, " ").toUpperCase()} SOP`,
		category: "Operations Documentation",
		updatedAt: "September 2026",
		version: "v1.0",
		readingTime: "5 min read",
		author: {
			name: "Enterprise Author",
			role: "Operations Specialist",
			avatar: "EA",
			department: "Central Operations",
		},
		sections: [
			{
				heading: "1. Purpose & Scope",
				body: "This document establishes the standard operating protocol for team members. Adherence ensures consistency, data integrity, and operational alignment across all departments.",
			},
			{
				heading: "2. Step-by-Step Procedure",
				body: "Ensure prerequisites are met before initiating workflows. Log all changes in the appropriate module and verify synchronization with Central Hub.",
			},
		],
		relatedModules: [
			{ name: "CRM", href: "/crm", icon: "📊" },
			{ name: "Inventory", href: "/inventory", icon: "📦" },
		],
	};

	const [feedbackGiven, setFeedbackGiven] = useState(false);

	return (
		<WorkspaceShell>
			<div className="mx-auto max-w-5xl space-y-6 pb-16 pt-2 text-[#1f2430]">
				{/* Breadcrumb Navigation */}
				<div className="flex items-center gap-2 text-xs text-slate-500">
					<Link href="/central" className="hover:text-[#404d85]">
						Central Hub
					</Link>
					<span>/</span>
					<Link href="/knowledge" className="hover:text-[#404d85]">
						Knowledge & SOPs
					</Link>
					<span>/</span>
					<span className="font-semibold text-slate-900">{article.title}</span>
				</div>

				{/* Article Header Card */}
				<div className="rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-sm md:p-8">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
						<div className="flex items-center gap-2">
							<span className="rounded-full bg-[#eef2fa] px-3 py-1 text-xs font-semibold text-[#404d85]">
								{article.category}
							</span>
							<span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
								<span>✓</span>
								<span>Verified Institutional SOP</span>
							</span>
						</div>

						<span className="text-xs text-slate-400">{article.version}</span>
					</div>

					<h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
						{article.title}
					</h1>

					<div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
						<div className="flex items-center gap-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#323d6b] text-xs font-bold text-white shadow-sm">
								{article.author.avatar}
							</span>
							<div>
								<h4 className="font-bold text-slate-900">{article.author.name}</h4>
								<p className="text-[11px] text-slate-500">
									{article.author.role} • <span className="text-[#404d85]">{article.author.department}</span>
								</p>
							</div>
						</div>

						<div className="flex items-center gap-4 text-slate-400">
							<span>Last Updated: <strong className="text-slate-700">{article.updatedAt}</strong></span>
							<span>•</span>
							<span>{article.readingTime}</span>
						</div>
					</div>
				</div>

				{/* Article Content Layout */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
					{/* Main Article Body */}
					<div className="space-y-6 lg:col-span-3">
						<div className="rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-sm md:p-8 space-y-6">
							{article.sections.map((section) => (
								<div key={section.heading} className="space-y-2">
									<h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
										{section.heading}
									</h2>
									<p className="text-xs leading-relaxed text-slate-600">{section.body}</p>
								</div>
							))}

							{/* Feedback Strip */}
							<div className="mt-8 rounded-2xl border border-slate-200 bg-[#f8faff] p-4 text-center">
								<p className="text-xs font-semibold text-slate-700">
									Did this documentation solve your operational query?
								</p>
								{feedbackGiven ? (
									<p className="mt-2 text-xs font-bold text-emerald-600">
										Thank you! Your feedback helps refine our organizational memory.
									</p>
								) : (
									<div className="mt-3 flex justify-center gap-3">
										<button
											onClick={() => setFeedbackGiven(true)}
											className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
										>
											👍 Yes, helpful
										</button>
										<button
											onClick={() => setFeedbackGiven(true)}
											className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
										>
											👎 Needs update
										</button>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right Sidebar: Connected Modules & Fast Links */}
					<div className="space-y-6">
						<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-3">
							<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
								Connected Modules
							</h3>
							<p className="text-[11px] text-slate-500">
								This SOP directly interfaces with the following enterprise engines:
							</p>
							<div className="space-y-2 pt-1">
								{article.relatedModules.map((mod) => (
									<Link
										key={mod.name}
										href={mod.href}
										className="group flex items-center justify-between rounded-xl border border-slate-100 bg-[#f8faff] p-2.5 transition hover:border-[#6678c1] hover:bg-white hover:shadow-sm"
									>
										<div className="flex items-center gap-2">
											<span>{mod.icon}</span>
											<span className="text-xs font-bold text-slate-900 group-hover:text-[#404d85]">
												{mod.name}
											</span>
										</div>
										<span className="text-xs text-slate-400">→</span>
									</Link>
								))}
							</div>
						</div>

						<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-3">
							<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
								Audit & Governance
							</h3>
							<div className="space-y-1.5 text-[11px] text-slate-500">
								<p><strong>Visibility:</strong> Company-wide</p>
								<p><strong>Review Cycle:</strong> Quarterly</p>
								<p><strong>Custodian:</strong> {article.author.department}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</WorkspaceShell>
	);
}
