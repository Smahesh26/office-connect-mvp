"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import WorkspaceShell from "../../../components/WorkspaceShell";

type ChatMessage = {
	id: string;
	organizationId: string;
	senderUserId: string;
	senderEmail: string;
	senderName: string | null;
	senderRole: string;
	message: string;
	createdAt: string;
};

type AuthUser = {
	id: string;
	email: string;
	role?: string;
};

const isAdminRole = (role?: string) => role === "ADMIN" || role === "SUPER_ADMIN";

const getSenderDisplayName = (message: ChatMessage) => message.senderName?.trim() || message.senderEmail;

const appendUniqueMessage = (prev: ChatMessage[], incoming: ChatMessage): ChatMessage[] => {
	if (prev.some((item) => item.id === incoming.id)) return prev;
	return [...prev, incoming];
};

export default function ChatThreadPage() {
	const params = useParams<{ organizationId: string }>();
	const organizationId = typeof params?.organizationId === "string" ? params.organizationId : "";

	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [draftMessage, setDraftMessage] = useState("");
	const [chatMessage, setChatMessage] = useState<string | null>(null);
	const [isSending, setIsSending] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isConnected, setIsConnected] = useState(false);
	const [authUser, setAuthUser] = useState<AuthUser | null>(null);
	const socketRef = useRef<Socket | null>(null);
	const bottomRef = useRef<HTMLDivElement | null>(null);

	const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || process.env.BACKEND_ORIGIN || "http://localhost:4000";
	const isAdmin = isAdminRole(authUser?.role);

	useEffect(() => {
		const rawAuthUser = localStorage.getItem("authUser");
		if (!rawAuthUser) return;
		try {
			setAuthUser(JSON.parse(rawAuthUser) as AuthUser);
		} catch {
			setAuthUser(null);
		}
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token || !organizationId) {
			setIsLoading(false);
			return;
		}

		const loadMessages = async () => {
			try {
				const response = await fetch(`/api/chat/messages?limit=500&organizationId=${organizationId}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!response.ok) {
					setMessages([]);
					return;
				}
				const data = (await response.json()) as ChatMessage[];
				setMessages(Array.isArray(data) ? data.filter((m) => m.organizationId === organizationId) : []);
			} catch {
				setMessages([]);
			} finally {
				setIsLoading(false);
			}
		};

		void loadMessages();
	}, [organizationId]);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token || !organizationId) return;

		const socket = io(backendOrigin, {
			path: "/socket.io",
			transports: ["websocket"],
			auth: { token },
		});
		socketRef.current = socket;
		socket.on("connect", () => setIsConnected(true));
		socket.on("disconnect", () => setIsConnected(false));
		socket.on("chat:new", (incoming: ChatMessage) => {
			if (incoming.organizationId !== organizationId) return;
			setMessages((prev) => appendUniqueMessage(prev, incoming));
		});

		return () => {
			socket.disconnect();
			socketRef.current = null;
		};
	}, [backendOrigin, organizationId]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const sendByApiFallback = async (rawMessage: string) => {
		const token = localStorage.getItem("authToken");
		if (!token) return;
		const response = await fetch("/api/chat/messages", {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ message: rawMessage, organizationId }),
		});
		if (!response.ok) return;
		const created = (await response.json()) as ChatMessage;
		setMessages((prev) => appendUniqueMessage(prev, created));
	};

	const handleSendMessage = async (event: FormEvent) => {
		event.preventDefault();
		const rawMessage = draftMessage.trim();
		if (!rawMessage) return;

		setIsSending(true);
		setChatMessage(null);
		const socket = socketRef.current;
		if (socket && socket.connected) {
			socket.emit("chat:send", { message: rawMessage, organizationId }, async (ack: { ok: boolean; message?: string }) => {
				if (!ack?.ok) {
					setChatMessage(ack?.message || "Unable to send message.");
					await sendByApiFallback(rawMessage);
				}
				setDraftMessage("");
				setIsSending(false);
			});
			return;
		}

		await sendByApiFallback(rawMessage);
		setDraftMessage("");
		setIsSending(false);
	};

	if (!isAdmin) {
		return (
			<WorkspaceShell>
				<div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">This page is available for admin client conversations only.</div>
			</WorkspaceShell>
		);
	}

	return (
		<WorkspaceShell>
			<div className="relative mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)] ring-1 ring-white/80">
				<Link href="/chat" className="mb-4 inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100">
					<span aria-hidden>←</span>
					Back to chat cards
				</Link>
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Client Conversation</h1>
					<span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isConnected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-300 bg-white/90 text-zinc-600"}`}>{isConnected ? "Live" : "Offline"}</span>
				</div>
				{chatMessage && <p className="mt-3 rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-sm text-zinc-700 shadow-sm">{chatMessage}</p>}
				<div className="mt-4 h-[500px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-inner">
					{isLoading ? <p className="text-sm text-zinc-500">Loading chat...</p> : (
						<div className="space-y-3">
							{messages.map((message) => {
								const mine = authUser?.id === message.senderUserId;
								return (
									<div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
										<div className={`max-w-[75%] rounded-2xl border px-3 py-2 shadow-sm ${mine ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-800"}`}>
											<p className={`text-[11px] font-semibold ${mine ? "text-zinc-300" : "text-zinc-500"}`}>{getSenderDisplayName(message)} · {message.senderRole}</p>
											<p className="mt-1 whitespace-pre-wrap text-sm">{message.message}</p>
											<p className={`mt-1 text-[10px] ${mine ? "text-zinc-300" : "text-zinc-400"}`}>{new Date(message.createdAt).toLocaleString()}</p>
										</div>
									</div>
								);
							})}
							<div ref={bottomRef} />
						</div>
					)}
				</div>
				<form className="mt-4 flex gap-2" onSubmit={(event) => void handleSendMessage(event)}>
					<input value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} placeholder="Reply to this client..." className="flex-1 rounded-xl border border-zinc-300 bg-white/95 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
					<button type="submit" disabled={isSending || !draftMessage.trim()} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">{isSending ? "Sending..." : "Send"}</button>
				</form>
			</div>
		</WorkspaceShell>
	);
}
