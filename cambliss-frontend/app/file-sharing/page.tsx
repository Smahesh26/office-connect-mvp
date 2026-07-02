"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

type AuthUser = { id: string; role?: string };
type ChatTransferFile = {
	id: string;
	organizationId: string;
	fileName: string;
	fileSize: number;
	uploadedBy: string;
	createdAt: string;
	expiresAt: string;
};
type FileThreadSummary = {
	organizationId: string;
	organizationName: string;
	fileCount: number;
	latestFileName: string;
	latestUploadedAt: string;
};

type FileTransferPolicy = {
	unlimitedTransfersDuringTrial: boolean;
	retentionDays: number;
	nonRecoverableAfterDeletion: boolean;
};

const isAdminRole = (role?: string) => role === "ADMIN" || role === "SUPER_ADMIN";

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const daysLeft = (expiresAt: string) => Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

const parseApiMessage = async (response: Response, fallback: string) => {
	try {
		const body = (await response.json()) as { message?: string };
		return body.message || fallback;
	} catch {
		return fallback;
	}
};

export default function FileSharingPage() {
	const router = useRouter();
	const [authUser, setAuthUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [notice, setNotice] = useState<string | null>(null);
	const [clientFiles, setClientFiles] = useState<ChatTransferFile[]>([]);
	const [threadSummaries, setThreadSummaries] = useState<FileThreadSummary[]>([]);
	const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [policy, setPolicy] = useState<FileTransferPolicy | null>(null);

	const isAdmin = useMemo(() => isAdminRole(authUser?.role), [authUser?.role]);

	useEffect(() => {
		const rawAuthUser = localStorage.getItem("authUser");
		if (!rawAuthUser) {
			setAuthUser(null);
			return;
		}
		try {
			setAuthUser(JSON.parse(rawAuthUser) as AuthUser);
		} catch {
			setAuthUser(null);
		}
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			setIsLoading(false);
			return;
		}

		const load = async () => {
			setIsLoading(true);
			try {
				const policyResponse = await fetch("/api/chat/files/policy", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (policyResponse.ok) {
					setPolicy((await policyResponse.json()) as FileTransferPolicy);
				}

				if (isAdmin) {
					const response = await fetch("/api/chat/files/threads", { headers: { Authorization: `Bearer ${token}` } });
					setThreadSummaries(response.ok ? ((await response.json()) as FileThreadSummary[]) : []);
					setClientFiles([]);
				} else {
					const response = await fetch("/api/chat/files", { headers: { Authorization: `Bearer ${token}` } });
					setClientFiles(response.ok ? ((await response.json()) as ChatTransferFile[]) : []);
					setThreadSummaries([]);
				}
			} catch {
				setThreadSummaries([]);
				setClientFiles([]);
			} finally {
				setIsLoading(false);
			}
		};

		void load();
	}, [isAdmin]);

	const handleUpload = async (event: FormEvent) => {
		event.preventDefault();
		if (!selectedUploadFile) {
			setNotice("Choose a file first.");
			return;
		}

		const token = localStorage.getItem("authToken");
		if (!token) return;

		setIsUploading(true);
		setNotice(null);
		try {
			const body = new FormData();
			body.append("file", selectedUploadFile);
			const response = await fetch("/api/chat/files", {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
				body,
			});
			if (!response.ok) {
				setNotice("Upload failed.");
				return;
			}
			const created = (await response.json()) as ChatTransferFile;
			setClientFiles((prev) => [created, ...prev]);
			setSelectedUploadFile(null);
			setNotice("File uploaded. Auto-delete in 15 days.");
		} catch {
			setNotice("Upload failed.");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDownload = async (fileId: string, fileName: string) => {
		const token = localStorage.getItem("authToken");
		if (!token) return;

		const response = await fetch(`/api/chat/files/${fileId}/download`, { headers: { Authorization: `Bearer ${token}` } });
		if (!response.ok) {
			if (response.status === 410) {
				setClientFiles((prev) => prev.filter((file) => file.id !== fileId));
				setNotice(await parseApiMessage(response, "File expired and was permanently deleted."));
				return;
			}
			setNotice(await parseApiMessage(response, "Download failed."));
			return;
		}
		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = fileName;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		window.URL.revokeObjectURL(url);
	};

	const handlePreview = async (fileId: string) => {
		const token = localStorage.getItem("authToken");
		if (!token) return;

		const response = await fetch(`/api/chat/files/${fileId}/download`, { headers: { Authorization: `Bearer ${token}` } });
		if (!response.ok) {
			if (response.status === 410) {
				setClientFiles((prev) => prev.filter((file) => file.id !== fileId));
				setNotice(await parseApiMessage(response, "File expired and was permanently deleted."));
				return;
			}
			setNotice(await parseApiMessage(response, "Preview failed."));
			return;
		}

		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		window.open(url, "_blank", "noopener,noreferrer");
		setTimeout(() => window.URL.revokeObjectURL(url), 15000);
	};

	const handleDelete = async (fileId: string) => {
		const token = localStorage.getItem("authToken");
		if (!token) return;

		const response = await fetch(`/api/chat/files/${fileId}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!response.ok) {
			setNotice("Delete failed.");
			return;
		}

		setClientFiles((prev) => prev.filter((file) => file.id !== fileId));
		setNotice("File deleted.");
	};

	return (
		<WorkspaceShell>
			<div className="mt-5 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)]">
				<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">File Sharing</h1>
				<p className="mt-1 text-sm text-zinc-600">Files auto-delete after 15 days.</p>
				<div className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
					<p className="font-semibold text-zinc-900">File Transfer Policy</p>
					<p className="mt-1">• {policy?.unlimitedTransfersDuringTrial === false ? "Controlled transfers during trial" : "Unlimited file transfers during trial"}</p>
					<p>• All files remain available for {policy?.retentionDays ?? 15} days post upload</p>
					<p>• Auto deletion after {policy?.retentionDays ?? 15} days (non-recoverable)</p>
				</div>
				{notice && <p className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">{notice}</p>}

				{isLoading ? (
					<p className="mt-4 text-sm text-zinc-500">Loading...</p>
				) : isAdmin ? (
					<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
						{threadSummaries.length === 0 ? (
							<p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">No client folders yet.</p>
						) : (
							threadSummaries.map((thread) => (
								<button key={thread.organizationId} onClick={() => router.push(`/file-sharing/${thread.organizationId}`)} className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm hover:bg-zinc-50">
									<p className="text-sm font-semibold text-zinc-900">{thread.organizationName}</p>
									<p className="mt-1 text-xs text-zinc-500">Files: {thread.fileCount}</p>
									<p className="mt-1 truncate text-xs text-zinc-500">Latest: {thread.latestFileName}</p>
								</button>
							))
						)}
					</div>
				) : (
					<>
						<form className="mt-4 flex flex-wrap items-center gap-2" onSubmit={(event) => void handleUpload(event)}>
							<input type="file" onChange={(event) => setSelectedUploadFile(event.target.files?.[0] || null)} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-600" />
							<button type="submit" disabled={isUploading || !selectedUploadFile} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:bg-zinc-500">{isUploading ? "Uploading..." : "Upload"}</button>
						</form>
						<div className="mt-4 space-y-2">
							{clientFiles.map((file) => (
								<div key={file.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2">
									<div className="min-w-0">
										<p className="truncate text-xs font-semibold text-zinc-800">{file.fileName}</p>
										<p className="text-[11px] text-zinc-500">{formatFileSize(file.fileSize)} · expires in {daysLeft(file.expiresAt)} day(s)</p>
									</div>
									<div className="flex items-center gap-1">
										<button type="button" onClick={() => void handlePreview(file.id)} className="rounded-lg border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Preview</button>
										<button type="button" onClick={() => void handleDownload(file.id, file.fileName)} className="rounded-lg border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Download</button>
										<button type="button" onClick={() => void handleDelete(file.id)} className="rounded-lg border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50">Delete</button>
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>
		</WorkspaceShell>
	);
}
