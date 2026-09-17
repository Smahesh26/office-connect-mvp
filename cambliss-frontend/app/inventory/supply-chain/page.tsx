"use client";

import Link from "next/link";
import WorkspaceShell from "../../../components/WorkspaceShell";
import UnifiedSupplyChainHub from "../../../components/inventory/UnifiedSupplyChainHub";
import { ArrowLeft } from "lucide-react";

export default function SupplyChainPage() {
	return (
		<WorkspaceShell>
			<div className="mx-auto max-w-7xl space-y-6 pb-12 pt-2 text-[#1f2430]">
				{/* Breadcrumb Navigation */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-xs text-slate-500">
						<Link href="/central" className="hover:text-[#404d85]">
							Central Hub
						</Link>
						<span>/</span>
						<Link href="/inventory" className="hover:text-[#404d85]">
							Inventory Control
						</Link>
						<span>/</span>
						<span className="font-semibold text-slate-900">Unified Supply Chain (Commerce + PO)</span>
					</div>

					<Link
						href="/inventory"
						className="inline-flex items-center gap-1 text-xs font-semibold text-[#404d85] hover:underline"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						<span>Back to Inventory Ops</span>
					</Link>
				</div>

				<UnifiedSupplyChainHub />
			</div>
		</WorkspaceShell>
	);
}
