"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import WorkspaceShell from "../../../../components/WorkspaceShell";
import {
	buildGoogleCalendarUrl,
	buildMailtoUrl,
	buildMeetingUrl,
	formatDateTime,
	type VideoMeetingInvite,
} from "../../../../lib/video-connect";

const parseAttendees = (value: string | null) =>
	value
		? value
			.split(/[\n,;]+/)
			.map((email) => email.trim())
			.filter(Boolean)
		: [];

type ChatMessage = {
	id: string;
	sender: string;
	text: string;
	time: string;
};

export default function VideoMeetingRoomPage() {
	const params = useParams<{ meetingId: string }>();
	const searchParams = useSearchParams();
	const meetingId = params.meetingId;

	const previewRef = useRef<HTMLVideoElement | null>(null);
	const screenRef = useRef<HTMLVideoElement | null>(null);

	const [displayName, setDisplayName] = useState("");
	const [isHost, setIsHost] = useState(false);
	const [joined, setJoined] = useState(false);
	const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
	const [mediaState, setMediaState] = useState<"idle" | "loading" | "ready" | "blocked">("idle");
	const [mediaError, setMediaError] = useState<string | null>(null);
	const [audioEnabled, setAudioEnabled] = useState(true);
	const [videoEnabled, setVideoEnabled] = useState(true);

	const [screenSharing, setScreenSharing] = useState(false);
	const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

	const [activeTab, setActiveTab] = useState<"chat" | "participants" | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([
		{ id: "1", sender: "System", text: "Welcome to the meeting room!", time: "10:00 AM" },
	]);
	const [chatInput, setChatInput] = useState("");
	const [copyNotice, setCopyNotice] = useState(false);
	const [timerSeconds, setTimerSeconds] = useState(0);

	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
	}, []);

	const defaultStart = useMemo(() => "2026-08-20T10:00:00.000Z", []);

	// Derive actual Host Name cleanly
	const actualHostName = useMemo(() => {
		const rawHost = searchParams.get("host");
		if (rawHost && rawHost !== "Office Connect") {
			return rawHost;
		}
		return "Host";
	}, [searchParams]);

	const invite = useMemo<VideoMeetingInvite>(
		() => ({
			meetingId,
			title: searchParams.get("title") || "Team Meeting",
			hostName: actualHostName,
			scheduledStart: searchParams.get("start") || defaultStart,
			durationMinutes: Number(searchParams.get("duration") || 30),
			attendeeEmails: parseAttendees(searchParams.get("attendees")),
			notes: searchParams.get("notes") || "",
		}),
		[meetingId, searchParams, actualHostName, defaultStart],
	);

	// Differentiate Host vs Guest display name & auto-join logged in Host
	useEffect(() => {
		if (typeof window === "undefined") return;
		const authUser = localStorage.getItem("authUser");
		if (authUser) {
			try {
				const parsed = JSON.parse(authUser) as { firstName?: string; name?: string; email?: string };
				const name = parsed.firstName || parsed.name || parsed.email?.split("@")[0];
				if (name) {
					setDisplayName(name);
					setIsHost(true);
					void enableDevicesAndJoin();
					return;
				}
			} catch {}
		}
		// Unauthenticated Guest Participant -> Stay in Pre-Join Lobby
		setIsHost(false);
		setDisplayName("");
	}, []);

	const meetingUrl = useMemo(() => {
		if (typeof window === "undefined" || !isMounted) {
			return "";
		}
		return buildMeetingUrl(window.location.origin, invite);
	}, [invite, isMounted]);

	const copyLink = async () => {
		if (!meetingUrl) return;
		await navigator.clipboard.writeText(meetingUrl);
		setCopyNotice(true);
		setTimeout(() => setCopyNotice(false), 2500);
	};

	// Real-Time Cross-Tab / Cross-Window Chat Sync via BroadcastChannel & Storage
	useEffect(() => {
		if (typeof window === "undefined" || !meetingId) return;
		const channel = new BroadcastChannel(`video_connect_chat_${meetingId}`);

		channel.onmessage = (event) => {
			if (event.data && event.data.text) {
				setMessages((prev) => {
					if (prev.some((m) => m.id === event.data.id)) return prev;
					return [...prev, event.data];
				});
			}
		};

		const handleStorage = (e: StorageEvent) => {
			if (e.key === `video_connect_chat_${meetingId}` && e.newValue) {
				try {
					const msg = JSON.parse(e.newValue) as ChatMessage;
					setMessages((prev) => {
						if (prev.some((m) => m.id === msg.id)) return prev;
						return [...prev, msg];
					});
				} catch {}
			}
		};

		window.addEventListener("storage", handleStorage);

		return () => {
			channel.close();
			window.removeEventListener("storage", handleStorage);
		};
	}, [meetingId]);

	const sendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (!chatInput.trim()) return;
		const newMsg: ChatMessage = {
			id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
			sender: displayName || (isHost ? invite.hostName : "Guest"),
			text: chatInput.trim(),
			time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
		};
		setMessages((prev) => [...prev, newMsg]);
		setChatInput("");

		// Broadcast to other participants
		try {
			const channel = new BroadcastChannel(`video_connect_chat_${meetingId}`);
			channel.postMessage(newMsg);
			channel.close();
			localStorage.setItem(`video_connect_chat_${meetingId}`, JSON.stringify(newMsg));
		} catch {}
	};

	// Camera Video Stream Ref Assignment
	useEffect(() => {
		if (!previewRef.current) return;
		previewRef.current.srcObject = mediaStream;
		if (mediaStream) {
			void previewRef.current.play().catch(() => {});
		}
		return () => {
			if (previewRef.current) {
				previewRef.current.srcObject = null;
			}
		};
	}, [mediaStream, joined]);

	// Screen Sharing Stream Ref Assignment
	useEffect(() => {
		if (!screenRef.current || !screenStream) return;
		screenRef.current.srcObject = screenStream;
		void screenRef.current.play().catch(() => {});
	}, [screenStream, screenSharing]);

	// Live Meeting Timer
	useEffect(() => {
		if (!joined) return;
		const interval = setInterval(() => {
			setTimerSeconds((prev) => prev + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, [joined]);

	const formatTimer = (seconds: number) => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		const pad = (n: number) => String(n).padStart(2, "0");
		return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
	};

	const enableDevicesAndJoin = async () => {
		setMediaState("loading");
		setMediaError(null);

		try {
			if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(() =>
					navigator.mediaDevices.getUserMedia({ video: true })
				);
				if (stream) {
					setMediaStream(stream);
					setJoined(true);
					setMediaState("ready");
					setAudioEnabled(true);
					setVideoEnabled(true);
					return;
				}
			}
		} catch (err) {
			console.log("Hardware device note:", err);
		}

		// Virtual Room Fallback (when hardware camera is restricted by browser HTTP origin rules)
		setJoined(true);
		setMediaState("ready");
		setAudioEnabled(true);
		setVideoEnabled(true);
	};

	const toggleAudio = () => {
		const nextState = !audioEnabled;
		if (mediaStream) {
			mediaStream.getAudioTracks().forEach((track) => {
				track.enabled = nextState;
			});
		}
		setAudioEnabled(nextState);
	};

	const toggleVideo = () => {
		const nextState = !videoEnabled;
		if (mediaStream) {
			mediaStream.getVideoTracks().forEach((track) => {
				track.enabled = nextState;
			});
		}
		setVideoEnabled(nextState);
	};

	// Real Browser Screen Sharing Implementation
	const toggleScreenShare = async () => {
		if (screenSharing && screenStream) {
			screenStream.getTracks().forEach((track) => track.stop());
			setScreenStream(null);
			setScreenSharing(false);
			return;
		}

		try {
			if (typeof window !== "undefined" && navigator.mediaDevices?.getDisplayMedia) {
				const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
				setScreenStream(displayStream);
				setScreenSharing(true);

				// Automatically revert when user stops sharing via browser top bar
				displayStream.getVideoTracks()[0].onended = () => {
					setScreenStream(null);
					setScreenSharing(false);
				};
			} else {
				alert("Screen sharing is not supported in this browser environment.");
			}
		} catch (err) {
			console.log("Screen share cancelled:", err);
		}
	};

	const leaveRoom = () => {
		mediaStream?.getTracks().forEach((track) => track.stop());
		screenStream?.getTracks().forEach((track) => track.stop());
		setMediaStream(null);
		setScreenStream(null);
		setScreenSharing(false);
		setJoined(false);
		setMediaState("idle");
		setMediaError(null);
		setTimerSeconds(0);
	};

	return (
		<WorkspaceShell>
			{!joined ? (
				/* ==================== PRE-JOIN LOBBY (GUEST ACCESS) ==================== */
				<div className="mx-auto max-w-5xl py-6 px-4">
					<div className="flex items-center justify-between mb-6">
						<Link href="/video-connect" className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs">
							← Back to Scheduler
						</Link>
						<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
							Direct Guest Access • No Login Required
						</span>
					</div>

					<div className="grid gap-6 lg:grid-cols-12 items-center">
						{/* Device Preview Box */}
						<div className="lg:col-span-7">
							<div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl">
								<div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
									<span className="font-semibold text-zinc-300">Device Preview</span>
									<span className={`px-2 py-0.5 rounded font-bold text-[10px] ${mediaStream ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"}`}>
										{mediaStream ? "WEBCAM READY" : "LOBBY PREVIEW"}
									</span>
								</div>

								<div className="relative h-72 w-full rounded-xl bg-zinc-900 overflow-hidden flex items-center justify-center border border-zinc-800">
									{mediaStream && videoEnabled ? (
										<video ref={previewRef} autoPlay muted playsInline className="h-full w-full object-cover" />
									) : (
										<div className="flex flex-col items-center justify-center p-6 text-center">
											<div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black border-2 border-indigo-400 shadow-lg mb-3">
												{displayName ? displayName.substring(0, 2).toUpperCase() : "GUEST"}
											</div>
											<p className="text-sm font-bold text-zinc-200">{displayName || "Guest Participant"}</p>
											<p className="text-xs text-zinc-400 mt-1">{videoEnabled ? "Ready to connect video" : "Camera turned off"}</p>
										</div>
									)}

									{/* Controls Overlay */}
									<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
										<button
											type="button"
											onClick={toggleAudio}
											className={`p-2.5 rounded-full text-xs font-semibold transition ${audioEnabled ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-rose-600 text-white hover:bg-rose-700"}`}
										>
											{audioEnabled ? "🎤 Mic On" : "🔇 Mic Off"}
										</button>
										<button
											type="button"
											onClick={toggleVideo}
											className={`p-2.5 rounded-full text-xs font-semibold transition ${videoEnabled ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-rose-600 text-white hover:bg-rose-700"}`}
										>
											{videoEnabled ? "📷 Camera On" : "📷 Camera Off"}
										</button>
									</div>
								</div>
							</div>
						</div>

						{/* Pre-Join Card */}
						<div className="lg:col-span-5 space-y-4">
							<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
								<h1 className="text-2xl font-bold tracking-tight text-zinc-900">{invite.title}</h1>
								<p className="text-xs font-semibold text-indigo-600 mt-1">Hosted by {invite.hostName}</p>

								<div className="mt-4 space-y-2 text-xs text-zinc-600 border-t border-b border-zinc-100 py-3">
									<p><span className="font-bold text-zinc-800">Scheduled:</span> {formatDateTime(invite.scheduledStart) || "Instant Meeting"}</p>
									<p><span className="font-bold text-zinc-800">Duration:</span> {invite.durationMinutes} minutes</p>
									{invite.notes && <p><span className="font-bold text-zinc-800">Notes:</span> {invite.notes}</p>}
								</div>

								{/* Display Name Input */}
								<div className="mt-4 space-y-1.5">
									<label className="block text-xs font-bold text-zinc-700">Enter Your Name to Join:</label>
									<input
										type="text"
										value={displayName}
										onChange={(e) => setDisplayName(e.target.value)}
										placeholder="e.g. Alex Morgan"
										className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-semibold text-zinc-900 focus:border-indigo-600 focus:outline-none shadow-2xs"
										required
									/>
								</div>

								<button
									type="button"
									onClick={() => void enableDevicesAndJoin()}
									className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-2"
								>
									<span>🎥</span> Join Meeting Now
								</button>
							</div>

							{/* Share Link Card */}
							<div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
								<div className="flex items-center justify-between mb-2">
									<p className="text-xs font-bold text-zinc-900">Share Meeting Link</p>
									{copyNotice && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Copied!</span>}
								</div>
								<div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs">
									<a href={meetingUrl} target="_blank" rel="noreferrer" className="flex-1 truncate font-mono text-indigo-600 hover:underline">
										{meetingUrl || "Generating meeting link..."}
									</a>
									<button
										type="button"
										onClick={() => void copyLink()}
										className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs whitespace-nowrap"
									>
										📋 Copy Link
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				/* ==================== LIVE MEETING STUDIO ROOM ==================== */
				<div className="flex flex-col h-[calc(100vh-80px)] -m-6 bg-zinc-950 text-white overflow-hidden relative">
					{/* TOP HEADER BAR */}
					<header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
						<div className="flex items-center gap-3">
							<div>
								<h1 className="text-base font-bold text-white flex items-center gap-2">
									{invite.title}
									<span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
										LIVE
									</span>
								</h1>
								<p className="text-xs text-zinc-400">Hosted by {invite.hostName}</p>
							</div>
						</div>

						{/* Live Timer & Copy Badge */}
						<div className="hidden sm:flex items-center gap-3">
							<div className="flex items-center gap-2 rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-emerald-400 border border-zinc-700">
								<span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
								{formatTimer(timerSeconds)}
							</div>
							<button
								type="button"
								onClick={() => void copyLink()}
								className="flex items-center gap-1.5 rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition"
							>
								<span>📋</span> {copyNotice ? "Copied Link!" : "Copy Meeting Link"}
							</button>
						</div>

						{/* Right Control Toggles */}
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setActiveTab(activeTab === "participants" ? null : "participants")}
								className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === "participants" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
							>
								<span>👥</span> Participants
							</button>
							<button
								type="button"
								onClick={() => setActiveTab(activeTab === "chat" ? null : "chat")}
								className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === "chat" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
							>
								<span>💬</span> Chat ({messages.length})
							</button>
						</div>
					</header>

					{/* SCREEN SHARE STAGE (IF ACTIVE) */}
					{screenSharing && (
						<div className="p-4 bg-zinc-900 border-b border-zinc-800">
							<div className="flex items-center justify-between text-xs text-zinc-300 mb-2">
								<span className="font-bold text-indigo-400 flex items-center gap-1.5">
									<span>🖥️</span> Screen Share Stream Active
								</span>
								<button
									type="button"
									onClick={() => void toggleScreenShare()}
									className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
								>
									Stop Screen Share
								</button>
							</div>
							<div className="relative h-64 w-full rounded-xl bg-black overflow-hidden border border-indigo-500/40">
								<video ref={screenRef} autoPlay playsInline className="h-full w-full object-contain" />
							</div>
						</div>
					)}

					{/* MAIN VIDEO STAGE AREA */}
					<div className="flex-1 flex overflow-hidden relative p-4 gap-4">
						{/* Video Grid */}
						<div className="flex-1 grid gap-4 auto-rows-fr grid-cols-1 md:grid-cols-2 items-center justify-center max-w-6xl mx-auto w-full">
							
							{/* TILE 1: HOST TILE (Bhasker) */}
							<div className="relative h-full min-h-[240px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col justify-between p-4 shadow-lg group">
								<div className="flex items-center justify-between z-10">
									<span className="text-xs font-bold bg-black/60 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-xs">
										{invite.hostName} <span className="text-indigo-400 font-extrabold ml-1">HOST</span>
									</span>
									<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
										{isHost && mediaStream ? "WEBCAM LIVE" : "HOST FEED"}
									</span>
								</div>

								{/* Video Feed if You are Host, else Host Avatar */}
								{isHost && mediaStream && videoEnabled ? (
									<video ref={previewRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
								) : (
									<div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950/40 to-zinc-950">
										<div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black border-2 border-indigo-400 shadow-xl mb-2">
											{invite.hostName.substring(0, 2).toUpperCase()}
										</div>
										<p className="text-xs font-bold text-zinc-300">{invite.hostName}</p>
										<div className="mt-2 flex items-center gap-1">
											<span className="w-1 h-3 bg-emerald-400 rounded animate-pulse" />
											<span className="w-1 h-4 bg-emerald-400 rounded animate-pulse delay-75" />
											<span className="w-1 h-2 bg-emerald-400 rounded animate-pulse delay-150" />
										</div>
									</div>
								)}

								<div className="z-10 flex items-center gap-2">
									<span className="text-xs bg-black/60 px-2.5 py-1 rounded-md text-emerald-400 border border-emerald-500/30">
										🎤 Mic Active
									</span>
								</div>
							</div>

							{/* TILE 2: GUEST TILE (Somalingam / Participant) */}
							<div className="relative h-full min-h-[240px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col justify-between p-4 shadow-lg group">
								<div className="flex items-center justify-between z-10">
									<span className="text-xs font-bold bg-black/60 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-xs">
										{!isHost ? `${displayName || "Guest"}` : "Guest Participant"}
										{!isHost && <span className="text-zinc-400 text-[10px] ml-1">(You)</span>}
									</span>
									<span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${!isHost && mediaStream ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-purple-500/20 text-purple-400 border-purple-500/30"}`}>
										{!isHost && mediaStream ? "WEBCAM LIVE" : "CONNECTED"}
									</span>
								</div>

								{/* Video Feed if You are Guest, else Guest Avatar */}
								{!isHost && mediaStream && videoEnabled ? (
									<video ref={previewRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
								) : (
									<div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-purple-950/40 to-zinc-950">
										<div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black border-2 border-purple-400 shadow-xl mb-2">
											{(!isHost && displayName) ? displayName.substring(0, 2).toUpperCase() : "GP"}
										</div>
										<p className="text-xs font-bold text-zinc-300">{!isHost ? displayName : "Guest Participant"}</p>
										<p className="text-[11px] text-zinc-400 mt-0.5">Connected to Meeting</p>
									</div>
								)}

								<div className="z-10 flex items-center gap-2">
									<span className={`text-xs px-2.5 py-1 rounded-md border ${audioEnabled ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/30"}`}>
										{audioEnabled ? "🎤 Mic On" : "🔇 Mic Muted"}
									</span>
								</div>
							</div>

						</div>

						{/* SIDEBAR: CHAT / PARTICIPANTS PANEL */}
						{activeTab && (
							<div className="w-80 rounded-2xl border border-zinc-800 bg-zinc-900 flex flex-col shadow-2xl z-20">
								<div className="flex items-center justify-between p-3 border-b border-zinc-800">
									<h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
										{activeTab === "chat" ? "Live Meeting Chat" : "Participants"}
									</h2>
									<button type="button" onClick={() => setActiveTab(null)} className="text-zinc-400 hover:text-white text-sm">
										✕
									</button>
								</div>

								{activeTab === "chat" ? (
									<div className="flex-1 flex flex-col justify-between p-3 overflow-hidden">
										<div className="space-y-3 overflow-y-auto flex-1 pr-1">
											{messages.map((msg) => (
												<div key={msg.id} className="rounded-xl bg-zinc-800/80 p-2.5 text-xs border border-zinc-700/50">
													<div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
														<span className="font-bold text-indigo-400">{msg.sender}</span>
														<span>{msg.time}</span>
													</div>
													<p className="text-zinc-200">{msg.text}</p>
												</div>
											))}
										</div>
										<form onSubmit={sendMessage} className="mt-3 flex gap-2">
											<input
												type="text"
												value={chatInput}
												onChange={(e) => setChatInput(e.target.value)}
												placeholder="Send a message..."
												className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
											/>
											<button type="submit" className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition">
												Send
											</button>
										</form>
									</div>
								) : (
									<div className="p-3 space-y-2 overflow-y-auto flex-1 text-xs">
										{/* Host Item */}
										<div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800 border border-zinc-700">
											<div className="flex items-center gap-2">
												<div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
													{invite.hostName.substring(0, 2).toUpperCase()}
												</div>
												<div>
													<p className="font-bold text-zinc-200">{invite.hostName}</p>
													<span className="text-[10px] text-indigo-400">Meeting Host</span>
												</div>
											</div>
											<span className="text-emerald-400">🎤</span>
										</div>

										{/* Guest Item */}
										<div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800 border border-zinc-700">
											<div className="flex items-center gap-2">
												<div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">
													{(!isHost && displayName ? displayName : "Guest").substring(0, 2).toUpperCase()}
												</div>
												<div>
													<p className="font-bold text-zinc-200">{!isHost ? displayName : "Guest Participant"}</p>
													<span className="text-[10px] text-zinc-400">Guest Participant</span>
												</div>
											</div>
											<span className={audioEnabled ? "text-emerald-400" : "text-rose-400"}>
												{audioEnabled ? "🎤" : "🔇"}
											</span>
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					{/* BOTTOM FLOATING CONTROL DOCK (GOOGLE MEET STYLE) */}
					<footer className="flex items-center justify-center gap-3 py-3 px-6 bg-zinc-900 border-t border-zinc-800 z-30">
						<button
							type="button"
							onClick={toggleAudio}
							className={`p-3.5 rounded-full transition shadow-md flex items-center gap-2 text-xs font-bold ${audioEnabled ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}`}
							title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
						>
							<span>{audioEnabled ? "🎤" : "🔇"}</span>
							<span className="hidden sm:inline">{audioEnabled ? "Mute" : "Unmute"}</span>
						</button>

						<button
							type="button"
							onClick={toggleVideo}
							className={`p-3.5 rounded-full transition shadow-md flex items-center gap-2 text-xs font-bold ${videoEnabled ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}`}
							title={videoEnabled ? "Turn Camera Off" : "Turn Camera On"}
						>
							<span>{videoEnabled ? "📷" : "📷 Off"}</span>
							<span className="hidden sm:inline">{videoEnabled ? "Camera Off" : "Camera On"}</span>
						</button>

						<button
							type="button"
							onClick={() => void toggleScreenShare()}
							className={`p-3.5 rounded-full transition shadow-md flex items-center gap-2 text-xs font-bold ${screenSharing ? "bg-indigo-600 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-white"}`}
							title="Share Screen"
						>
							<span>🖥️</span>
							<span className="hidden sm:inline">{screenSharing ? "Stop Sharing" : "Share Screen"}</span>
						</button>

						<button
							type="button"
							onClick={leaveRoom}
							className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 ml-4"
						>
							<span>📞</span>
							<span>Leave Call</span>
						</button>
					</footer>
				</div>
			)}
		</WorkspaceShell>
	);
}