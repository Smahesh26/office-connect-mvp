"use client";

import Link from "next/link";
import { useState, useMemo, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import {
	Users,
	Search,
	Video,
	Mail,
	Building2,
	CheckCircle2,
} from "lucide-react";

type Employee = {
	id: string;
	name: string;
	role: string;
	department: "Executive" | "Engineering" | "Sales" | "Operations" | "HR";
	email: string;
	status: "Available" | "In Meeting" | "Focus Mode" | "Away";
	avatar: string;
	skills: string[];
	spaces: string[];
};

const EMPLOYEES: Employee[] = [
	{
		id: "emp-1",
		name: "Sarah Jenkins",
		role: "Chief Operating Officer",
		department: "Executive",
		email: "s.jenkins@theofficeconnect.com",
		status: "Available",
		avatar: "SJ",
		skills: ["Operations", "Strategy", "Governance"],
		spaces: ["General Announcements", "Executive Committee"],
	},
	{
		id: "emp-2",
		name: "David Chen",
		role: "Lead Platform Architect",
		department: "Engineering",
		email: "d.chen@theofficeconnect.com",
		status: "Focus Mode",
		avatar: "DC",
		skills: ["Microservices", "Next.js", "System Architecture", "Prisma"],
		spaces: ["Engineering & Tech Squad", "General Announcements"],
	},
	{
		id: "emp-3",
		name: "Marcus Vance",
		role: "VP Commercial Operations & Sales",
		department: "Sales",
		email: "m.vance@theofficeconnect.com",
		status: "In Meeting",
		avatar: "MV",
		skills: ["Enterprise Sales", "CRM", "Partnerships"],
		spaces: ["Sales & Commercial Operations", "General Announcements"],
	},
	{
		id: "emp-4",
		name: "Elena Rostova",
		role: "People & Talent Lead",
		department: "HR",
		email: "e.rostova@theofficeconnect.com",
		status: "Available",
		avatar: "ER",
		skills: ["Talent Acquisition", "HRM Policies", "Culture"],
		spaces: ["General Announcements"],
	},
	{
		id: "emp-5",
		name: "Carlos Ramos",
		role: "Marketplace Operations Director",
		department: "Operations",
		email: "c.ramos@theofficeconnect.com",
		status: "Available",
		avatar: "CR",
		skills: ["Vendor Relations", "Supply Chain", "E-Commerce"],
		spaces: ["Marketplace & Vendor Operations", "General Announcements"],
	},
	{
		id: "emp-6",
		name: "Alex Wong",
		role: "Senior Cloud & DevOps Engineer",
		department: "Engineering",
		email: "a.wong@theofficeconnect.com",
		status: "Available",
		avatar: "AW",
		skills: ["Kubernetes", "PostgreSQL", "CI/CD", "Security"],
		spaces: ["Engineering & Tech Squad"],
	},
	{
		id: "emp-7",
		name: "Kavita Reddy",
		role: "Principal UI/UX Architect",
		department: "Engineering",
		email: "k.reddy@theofficeconnect.com",
		status: "Focus Mode",
		avatar: "KR",
		skills: ["Design Systems", "TailwindCSS", "Accessibility"],
		spaces: ["Product Design & UX", "Engineering & Tech Squad"],
	},
	{
		id: "emp-8",
		name: "Rachel Adams",
		role: "Enterprise Account Executive",
		department: "Sales",
		email: "r.adams@theofficeconnect.com",
		status: "Away",
		avatar: "RA",
		skills: ["B2B SaaS", "Account Management", "CRM"],
		spaces: ["Sales & Commercial Operations"],
	},
];

function DirectoryContent() {
	const [selectedDept, setSelectedDept] = useState<string>("All");
	const [searchQuery, setSearchQuery] = useState("");

	const filteredEmployees = useMemo(() => {
		return EMPLOYEES.filter((emp) => {
			const matchesDept = selectedDept === "All" || emp.department === selectedDept;
			const q = searchQuery.toLowerCase();
			const matchesSearch =
				!searchQuery.trim() ||
				emp.name.toLowerCase().includes(q) ||
				emp.role.toLowerCase().includes(q) ||
				emp.skills.some((s) => s.toLowerCase().includes(q)) ||
				emp.department.toLowerCase().includes(q);
			return matchesDept && matchesSearch;
		});
	}, [selectedDept, searchQuery]);

	const getStatusBadge = (status: Employee["status"]) => {
		switch (status) {
			case "Available":
				return <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>Available</span>;
			case "In Meeting":
				return <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600"><span className="h-2 w-2 rounded-full bg-amber-500"></span>In Meeting</span>;
			case "Focus Mode":
				return <span className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-600"><span className="h-2 w-2 rounded-full bg-purple-500"></span>Focus Mode</span>;
			default:
				return <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400"><span className="h-2 w-2 rounded-full bg-slate-300"></span>Away</span>;
		}
	};

	return (
		<WorkspaceShell>
			<div className="mx-auto max-w-7xl space-y-6 pb-12 pt-2 text-[#1f2430]">
				{/* Top Header */}
				<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
					<div>
						<div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6678c1]">
							<span>Pillar 1</span>
							<span>•</span>
							<span>Users & Department Directory</span>
						</div>
						<h1 className="mt-1 text-3xl font-bold tracking-tight text-[#404d85]">
							People & Expertise Locator
						</h1>
						<p className="mt-1 max-w-2xl text-xs text-slate-500">
							Explore team members across departments, view presence status, discover domain expertise, and initiate collaboration.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<Link
							href="/video-connect"
							className="inline-flex items-center gap-2 rounded-xl bg-[#404d85] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#323d6b]"
						>
							<Video className="h-4 w-4" />
							<span>Start Video Room</span>
						</Link>
					</div>
				</div>

				{/* Search & Department Tabs */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative flex-1">
						<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
							<Search className="h-4 w-4 text-slate-400" />
						</span>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by name, role, skill (e.g. Next.js, CRM, Finance)..."
							className="w-full rounded-2xl border border-[#d9e2ef] bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#404d85] focus:outline-none"
						/>
					</div>

					<div className="flex items-center gap-1 rounded-2xl border border-[#d9e2ef] bg-white p-1 shadow-sm overflow-x-auto">
						{["All", "Executive", "Engineering", "Sales", "Operations", "HR"].map((dept) => (
							<button
								key={dept}
								onClick={() => setSelectedDept(dept)}
								className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
									selectedDept === dept
										? "bg-[#404d85] text-white shadow-sm"
										: "text-slate-600 hover:bg-[#eef2fa] hover:text-slate-900"
								}`}
							>
								{dept}
							</button>
						))}
					</div>
				</div>

				{/* PEOPLE DIRECTORY GRID */}
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{filteredEmployees.map((emp) => (
						<div
							key={emp.id}
							className="group flex flex-col justify-between rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
						>
							<div>
								<div className="flex items-start justify-between">
									<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#323d6b] to-[#6678c1] text-sm font-bold text-white shadow-sm">
										{emp.avatar}
									</span>
									{getStatusBadge(emp.status)}
								</div>

								<h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-[#404d85]">
									{emp.name}
								</h3>
								<p className="text-xs text-slate-600">{emp.role}</p>

								<span className="mt-1 inline-block rounded-md bg-[#eef2fa] px-2 py-0.5 text-[10px] font-semibold text-[#404d85]">
									{emp.department}
								</span>

								{/* Skills */}
								<div className="mt-4">
									<p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expertise</p>
									<div className="mt-1.5 flex flex-wrap gap-1">
										{emp.skills.map((skill) => (
											<span
												key={skill}
												className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
											>
												{skill}
											</span>
										))}
									</div>
								</div>
							</div>

							<div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
								<a
									href={`mailto:${emp.email}`}
									className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
								>
									<Mail className="h-3.5 w-3.5 text-slate-500" />
									<span>Email</span>
								</a>
								<Link
									href="/video-connect"
									className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#eef2fa] py-1.5 text-center text-xs font-semibold text-[#404d85] hover:bg-[#d9e2ef] transition"
								>
									<Video className="h-3.5 w-3.5 text-[#404d85]" />
									<span>Meet</span>
								</Link>
							</div>
						</div>
					))}
				</div>
			</div>
		</WorkspaceShell>
	);
}

export default function DirectoryPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading Directory...</div>}>
			<DirectoryContent />
		</Suspense>
	);
}
