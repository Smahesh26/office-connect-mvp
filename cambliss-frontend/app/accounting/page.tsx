import AccountingWorkspace from "@/components/AccountingWorkspace";
import WorkspaceShell from "../../components/WorkspaceShell";

export default function AccountingPage() {
	return (
		<WorkspaceShell>
			<div className="space-y-4">
				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
					<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Accounting</h1>
					<p className="mt-1 text-sm text-zinc-600">
						Track ledgers, financial health, and AI-assisted finance insights from one place.
					</p>
				</div>
				<AccountingWorkspace />
			</div>
		</WorkspaceShell>
	);
}
