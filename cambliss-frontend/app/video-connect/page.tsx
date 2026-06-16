"use client";

import WorkspaceShell from "../../components/WorkspaceShell";

export default function VideoConnectPage() {
	return (
		<WorkspaceShell>
			<div className="mt-5 rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_38px_-24px_rgba(29,65,157,0.35)]">
				<h1 className="text-2xl font-semibold tracking-tight text-[#111827]">Video Connect</h1>
				<p className="mt-2 text-sm text-[#4b5563]">
					This page is ready for your video calling integration.
				</p>
				<div className="mt-5 rounded-xl border border-dashed border-[#b9c9eb] bg-[#f6f9ff] p-5">
					<p className="text-sm font-medium text-[#111827]">Integration Placeholder</p>
					<p className="mt-1 text-sm text-[#4b5563]">
						Use this area for WebRTC, Daily, Agora, or Twilio UI components.
					</p>
				</div>
			</div>
		</WorkspaceShell>
	);
}
