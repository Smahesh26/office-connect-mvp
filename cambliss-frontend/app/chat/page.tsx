"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import WorkspaceShell from "../../components/WorkspaceShell";

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

type PaidClientOrder = {
	subscription?: {
		organization?: {
			id: string;
			name: string;
			memberships?: Array<{
				user: {
					id: string;
					firstName: string | null;
					lastName: string | null;
					email: string;
				};
			}>;
			users?: Array<{
				id: string;
				firstName: string | null;
				lastName: string | null;
				email: string;
			}>;
		};
	};
};

type AdminClientThread = {
	organizationId: string;
	organizationName: string;
	clientId: string;
	clientName: string;
	clientEmail: string;
};

const isAdminRole = (role?: string) => role === "ADMIN" || role === "SUPER_ADMIN";

const getSenderDisplayName = (message: ChatMessage) => message.senderName?.trim() || message.senderEmail;

const appendUniqueMessage = (prev: ChatMessage[], incoming: ChatMessage): ChatMessage[] => {
	if (prev.some((item) => item.id === incoming.id)) {
		return prev;
	}

	return [...prev, incoming];
};

export default function ChatPage() {
	const router = useRouter();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [draftMessage, setDraftMessage] = useState("");
	const [chatMessage, setChatMessage] = useState<string | null>(null);
	const [isSending, setIsSending] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isConnected, setIsConnected] = useState(false);
	const socketRef = useRef<Socket | null>(null);
	const bottomRef = useRef<HTMLDivElement | null>(null);
	const [authUser, setAuthUser] = useState<AuthUser | null>(null);
	const [adminThreads, setAdminThreads] = useState<AdminClientThread[]>([]);

	const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || process.env.BACKEND_ORIGIN || "http://localhost:4000";
	const isAdmin = isAdminRole(authUser?.role);

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
			setChatMessage("Please login to use chat.");
			return;
		}

		const loadMessages = async () => {
			try {
				const response = await fetch(`/api/chat/messages?limit=${isAdmin ? 400 : 200}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					setMessages([]);
					return;
				}

				const data = (await response.json()) as ChatMessage[];
				setMessages(Array.isArray(data) ? data : []);
			} catch {
				setMessages([]);
			} finally {
				setIsLoading(false);
			}
		};

		const loadAdminThreads = async () => {
			if (!isAdmin) {
				setAdminThreads([]);
				return;
			}

			try {
				const adminResponse = await fetch("/api/admin/order-history", {
					headers: { Authorization: `Bearer ${token}` },
				});
				const response = adminResponse.ok
					? adminResponse
					: await fetch("/api/subscription/order-history", {
						headers: { Authorization: `Bearer ${token}` },
					});

				if (!response.ok) {
					setAdminThreads([]);
					return;
				}

				const raw = (await response.json()) as PaidClientOrder[];
				const source = Array.isArray(raw) ? raw : [];
				const byOrg = new Map<string, AdminClientThread>();
				for (const order of source) {
					const organization = order.subscription?.organization;
					const organizationId = organization?.id;
					if (!organizationId || byOrg.has(organizationId)) continue;

					const membershipUsers = (organization?.memberships || []).map((membership) => membership.user);
					const fallbackUsers = organization?.users || [];
					const user = (membershipUsers.length > 0 ? membershipUsers : fallbackUsers)[0];
					if (!user?.id || !user?.email) continue;

					byOrg.set(organizationId, {
						organizationId,
						organizationName: organization?.name || "Organization",
						clientId: user.id,
						clientEmail: user.email,
						clientName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
					});
				}

				setAdminThreads(Array.from(byOrg.values()).sort((a, b) => a.clientName.localeCompare(b.clientName)));
			} catch {
				setAdminThreads([]);
			}
		};

		void loadMessages();
		void loadAdminThreads();
	}, [isAdmin]);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) return;

		const socket = io(backendOrigin, {
			path: "/socket.io",
			transports: ["websocket"],
			auth: { token },
		});

		socketRef.current = socket;
		socket.on("connect", () => setIsConnected(true));
		socket.on("disconnect", () => setIsConnected(false));
		socket.on("chat:new", (incoming: ChatMessage) => setMessages((prev) => appendUniqueMessage(prev, incoming)));

		return () => {
			socket.disconnect();
			socketRef.current = null;
		};
	}, [backendOrigin]);

	const visibleMessages = useMemo(() => (isAdmin ? [] : messages), [isAdmin, messages]);

	const displayedAdminThreads = useMemo(() => {
		if (!isAdmin) return [] as AdminClientThread[];
		const byOrganization = new Map<string, AdminClientThread>();
		for (const thread of adminThreads) byOrganization.set(thread.organizationId, thread);
		for (const message of messages) {
			if (!message.organizationId || byOrganization.has(message.organizationId)) continue;
			byOrganization.set(message.organizationId, {
				organizationId: message.organizationId,
				organizationName: "Organization",
				clientId: message.senderUserId,
				clientName: message.senderName?.trim() || message.senderEmail,
				clientEmail: message.senderEmail,
			});
		}
		return Array.from(byOrganization.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));
	}, [adminThreads, isAdmin, messages]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [visibleMessages]);

	const sendByApiFallback = async (rawMessage: string) => {
		const token = localStorage.getItem("authToken");
		if (!token) return;
		const response = await fetch("/api/chat/messages", {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ message: rawMessage }),
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
			socket.emit("chat:send", { message: rawMessage }, async (ack: { ok: boolean; message?: string }) => {
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

	const getLatestThreadMessage = (organizationId: string) => {
		const threadMessages = messages
			.filter((message) => message.organizationId === organizationId)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		return threadMessages[0] || null;
	};

	return (
		<WorkspaceShell>
			<div className="relative mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)] ring-1 ring-white/80">
				<div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-zinc-200/50 blur-3xl" />
				<div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/70 blur-3xl" />

				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Instant Team Chat</h1>
						<p className="mt-1 text-sm text-zinc-600">{isAdmin ? "Open a client card for isolated conversation history." : "Client queries and admin replies are delivered instantly."}</p>
					</div>
					<span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isConnected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-300 bg-white/90 text-zinc-600"}`}>{isConnected ? "Live" : "Offline"}</span>
				</div>

				{chatMessage && <p className="mt-3 rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-sm text-zinc-700 shadow-sm">{chatMessage}</p>}

				{isAdmin ? (
					<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
						{displayedAdminThreads.map((thread) => {
							const latestMessage = getLatestThreadMessage(thread.organizationId);
							return (
								<button key={thread.organizationId} type="button" onClick={() => router.push(`/chat/${thread.organizationId}`)} className="group w-full rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-4 text-left shadow-[0_20px_44px_-28px_rgba(0,0,0,0.9)] transition hover:-translate-y-0.5 hover:border-zinc-300">
									<p className="text-sm font-semibold text-zinc-900">{thread.clientName}</p>
									<p className="text-xs text-zinc-500">{thread.clientEmail}</p>
									<p className="mt-1 text-[11px] text-zinc-400">Org: {thread.organizationName}</p>
									{latestMessage ? <p className="mt-2 line-clamp-2 text-xs text-zinc-600">{latestMessage.message}</p> : <p className="mt-2 text-xs text-zinc-400">No messages yet.</p>}
									<p className="mt-1 text-[11px] font-semibold text-zinc-500 group-hover:text-zinc-700">Open conversation →</p>
								</button>
							);
						})}
					</div>
				) : (
					<>
						<div className="mt-4 h-[480px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-inner">
							{isLoading ? <p className="text-sm text-zinc-500">Loading chat...</p> : (
								<div className="space-y-3">
									{visibleMessages.map((message) => {
										const mine = authUser?.id === message.senderUserId;
										return (
											<div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
												<div className={`max-w-[75%] rounded-2xl border px-3 py-2 shadow-sm ${mine ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-800"}`}>
													<p className={`text-[11px] font-semibold ${mine ? "text-zinc-300" : "text-zinc-500"}`}>{getSenderDisplayName(message)} · {message.senderRole}</p>
													<p className="mt-1 text-sm whitespace-pre-wrap">{message.message}</p>
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
							<input value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} placeholder="Type your query..." className="flex-1 rounded-xl border border-zinc-300 bg-white/95 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
							<button type="submit" disabled={isSending || !draftMessage.trim()} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">{isSending ? "Sending..." : "Send"}</button>
						</form>
					</>
				)}
			</div>
		</WorkspaceShell>
	);
}
