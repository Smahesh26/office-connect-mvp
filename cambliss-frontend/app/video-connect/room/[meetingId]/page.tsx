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

type RemoteParticipant = {
	id: string;
	name: string;
	isHost: boolean;
	audioEnabled: boolean;
	videoEnabled: boolean;
};

const RTC_CONFIG: RTCConfiguration = {
	iceServers: [
		{ urls: "stun:stun.l.google.com:19302" },
		{ urls: "stun:stun1.l.google.com:19302" },
		{ urls: "stun:stun2.l.google.com:19302" },
		{ urls: "stun:stun3.l.google.com:19302" },
		{ urls: "stun:stun4.l.google.com:19302" },
	],
};

function RemoteParticipantMediaTile({
	participant,
	stream,
}: {
	participant: RemoteParticipant;
	stream?: MediaStream;
}) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [hasVideoTrack, setHasVideoTrack] = useState(false);

	useEffect(() => {
		if (!stream) return;

		const updateTracks = () => {
			const videoTracks = stream.getVideoTracks();
			setHasVideoTrack(videoTracks.length > 0 && videoTracks.some((t) => t.enabled));
		};

		updateTracks();
		stream.addEventListener("addtrack", updateTracks);
		stream.addEventListener("removetrack", updateTracks);

		if (videoRef.current && videoRef.current.srcObject !== stream) {
			videoRef.current.srcObject = stream;
			void videoRef.current.play().catch(() => {});
		}

		if (audioRef.current && audioRef.current.srcObject !== stream) {
			audioRef.current.srcObject = stream;
			audioRef.current.volume = 1.0;
			audioRef.current.play().catch((err) => {
				console.log("Audio autoplay blocked by browser policy, attaching gesture listener:", err);
				const playAudioOnGesture = () => {
					audioRef.current?.play().catch(() => {});
					document.removeEventListener("click", playAudioOnGesture);
					document.removeEventListener("keydown", playAudioOnGesture);
				};
				document.addEventListener("click", playAudioOnGesture);
				document.addEventListener("keydown", playAudioOnGesture);
			});
		}

		return () => {
			stream.removeEventListener("addtrack", updateTracks);
			stream.removeEventListener("removetrack", updateTracks);
		};
	}, [stream]);

	return (
		<div className="relative h-full min-h-[240px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col justify-between p-4 shadow-lg group">
			<div className="flex items-center justify-between z-10">
				<span className="text-xs font-bold bg-black/60 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-xs">
					{participant.name}
					{participant.isHost && <span className="text-indigo-400 font-extrabold ml-1">HOST</span>}
				</span>
				<span
					className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
						stream
							? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
							: "bg-amber-500/20 text-amber-400 border-amber-500/30"
					}`}
				>
					{stream ? "LIVE P2P STREAM" : "CONNECTING..."}
				</span>
			</div>

			{/* Dedicated Audio Element for Remote Mic Voice */}
			<audio ref={audioRef} autoPlay playsInline />

			{/* Dedicated Video Element for Remote Camera Stream */}
			<video
				ref={videoRef}
				autoPlay
				playsInline
				muted
				className={`absolute inset-0 h-full w-full object-cover ${hasVideoTrack && stream ? "opacity-100" : "opacity-0 pointer-events-none"}`}
			/>

			{(!stream || !hasVideoTrack) && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-purple-950/40 to-zinc-950">
					<div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black border-2 border-purple-400 shadow-xl mb-2">
						{participant.name.substring(0, 2).toUpperCase()}
					</div>
					<p className="text-xs font-bold text-zinc-300">{participant.name}</p>
					<div className="mt-2 flex items-center gap-1">
						<span className="w-1 h-3 bg-emerald-400 rounded animate-pulse" />
						<span className="w-1 h-4 bg-emerald-400 rounded animate-pulse delay-75" />
						<span className="w-1 h-2 bg-emerald-400 rounded animate-pulse delay-150" />
					</div>
				</div>
			)}

			<div className="z-10 flex items-center gap-2">
				<span
					className={`text-xs px-2.5 py-1 rounded-md border ${
						participant.audioEnabled
							? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
							: "bg-rose-500/20 text-rose-300 border-rose-500/30"
					}`}
				>
					{participant.audioEnabled ? "🎤 Mic Active" : "🔇 Mic Muted"}
				</span>
			</div>
		</div>
	);
}

export default function VideoMeetingRoomPage() {
	const params = useParams<{ meetingId: string }>();
	const searchParams = useSearchParams();
	const meetingId = params.meetingId;

	const previewRef = useRef<HTMLVideoElement | null>(null);
	const screenRef = useRef<HTMLVideoElement | null>(null);
	const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});
	const mediaStreamRef = useRef<MediaStream | null>(null);

	const [displayName, setDisplayName] = useState("");
	const [isHost, setIsHost] = useState(false);
	const [myId] = useState(() => `user_${Math.random().toString(36).substring(2, 9)}`);
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

	const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
	const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});

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

	// Keep mediaStreamRef synchronized with state
	useEffect(() => {
		mediaStreamRef.current = mediaStream;
	}, [mediaStream]);

	// Sync active MediaStream tracks into existing RTCPeerConnections whenever mediaStream updates
	useEffect(() => {
		if (!mediaStream) return;
		Object.values(peerConnections.current).forEach((pc) => {
			const senders = pc.getSenders();
			mediaStream.getTracks().forEach((track) => {
				const existing = senders.find((s) => s.track?.kind === track.kind);
				if (existing) {
					void existing.replaceTrack(track).catch(() => {});
				} else {
					try {
						pc.addTrack(track, mediaStream);
					} catch {}
				}
			});
		});
	}, [mediaStream]);

	// Backend Real-Time Room Presence & Dynamic Participant Synchronization
	useEffect(() => {
		if (typeof window === "undefined" || !meetingId || !joined) return;

		const syncRoomState = async () => {
			try {
				const res = await fetch(`/api/video-connect/room/${meetingId}/sync`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						participantId: myId,
						name: displayName || (isHost ? invite.hostName : "Guest"),
						isHost,
						audioEnabled,
						videoEnabled,
					}),
				});

				if (res.ok) {
					const data = (await res.json()) as { participants: RemoteParticipant[] };
					if (Array.isArray(data.participants)) {
						const remotes = data.participants.filter((p) => p.id !== myId);
						setRemoteParticipants(remotes);
					}
				}
			} catch (err) {
				console.log("Room sync poll error:", err);
			}
		};

		void syncRoomState();
		const interval = setInterval(() => {
			void syncRoomState();
		}, 2000);

		return () => {
			clearInterval(interval);
			void fetch(`/api/video-connect/room/${meetingId}/leave`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ participantId: myId }),
			}).catch(() => {});
		};
	}, [joined, meetingId, myId, displayName, isHost, audioEnabled, videoEnabled, invite.hostName]);

	// WebRTC Signaling & Real P2P Video/Audio Connection Setup
	const sendSignal = async (targetId: string, signalData: any) => {
		try {
			await fetch(`/api/video-connect/room/${meetingId}/signal`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					senderId: myId,
					targetId,
					signal: signalData,
				}),
			});
		} catch (e) {
			console.log("Send signal error:", e);
		}
	};

	const createPeerConnection = (targetId: string) => {
		if (peerConnections.current[targetId]) {
			return peerConnections.current[targetId];
		}

		const pc = new RTCPeerConnection(RTC_CONFIG);
		peerConnections.current[targetId] = pc;

		try {
			pc.addTransceiver("audio", { direction: "sendrecv" });
			pc.addTransceiver("video", { direction: "sendrecv" });
		} catch {}

		const currentStream = mediaStreamRef.current || mediaStream;
		if (currentStream) {
			const senders = pc.getSenders();
			currentStream.getTracks().forEach((track) => {
				try {
					const existing = senders.find((s) => s.track?.kind === track.kind);
					if (existing) {
						void existing.replaceTrack(track).catch(() => {});
					} else {
						pc.addTrack(track, currentStream);
					}
				} catch {}
			});
		}

		pc.ontrack = (event) => {
			const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
			setRemoteStreams((prev) => ({
				...prev,
				[targetId]: stream,
			}));
		};

		pc.onicecandidate = (event) => {
			if (event.candidate) {
				void sendSignal(targetId, { type: "candidate", candidate: event.candidate });
			}
		};

		return pc;
	};

	// Initiate WebRTC Calls to Remote Participants (Tie-break by myId > p.id to eliminate glare collisions)
	useEffect(() => {
		if (!joined || remoteParticipants.length === 0) return;

		remoteParticipants.forEach((p) => {
			const isInitiator = myId > p.id;
			if (isInitiator && !peerConnections.current[p.id]) {
				const pc = createPeerConnection(p.id);
				void (async () => {
					try {
						const offer = await pc.createOffer({
							offerToReceiveAudio: true,
							offerToReceiveVideo: true,
						});
						await pc.setLocalDescription(offer);
						void sendSignal(p.id, { type: "offer", sdp: offer });
					} catch (e) {
						console.log("Create offer error:", e);
					}
				})();
			}
		});
	}, [joined, remoteParticipants, myId, mediaStream]);

	// Process Incoming WebRTC Signals (Offers, Answers, ICE Candidates)
	useEffect(() => {
		if (!joined || !meetingId) return;

		const pollSignals = async () => {
			try {
				const res = await fetch(`/api/video-connect/room/${meetingId}/signal/${myId}`);
				if (!res.ok) return;

				const data = (await res.json()) as { signals: { senderId: string; signal: any }[] };
				if (!Array.isArray(data.signals)) return;

				for (const item of data.signals) {
					const { senderId, signal } = item;
					if (!signal) continue;

					if (signal.type === "offer") {
						const pc = createPeerConnection(senderId);
						await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
						const answer = await pc.createAnswer();
						await pc.setLocalDescription(answer);
						void sendSignal(senderId, { type: "answer", sdp: answer });
					} else if (signal.type === "answer") {
						const pc = peerConnections.current[senderId];
						if (pc) {
							await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).catch(() => {});
						}
					} else if (signal.type === "candidate") {
						const pc = peerConnections.current[senderId];
						if (pc && signal.candidate) {
							await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
						}
					}
				}
			} catch (e) {
				console.log("Poll signals error:", e);
			}
		};

		const interval = setInterval(() => {
			void pollSignals();
		}, 400);

		return () => clearInterval(interval);
	}, [joined, meetingId, myId, mediaStream]);

	// Backend Real-Time Chat Synchronization
	useEffect(() => {
		if (typeof window === "undefined" || !meetingId || !joined) return;

		const fetchChat = async () => {
			try {
				const res = await fetch(`/api/video-connect/room/${meetingId}/chat`);
				if (res.ok) {
					const data = (await res.json()) as { messages: ChatMessage[] };
					if (Array.isArray(data.messages) && data.messages.length > 0) {
						setMessages(data.messages);
					}
				}
			} catch {}
		};

		void fetchChat();
		const interval = setInterval(() => {
			void fetchChat();
		}, 2000);

		return () => clearInterval(interval);
	}, [joined, meetingId]);

	const sendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!chatInput.trim()) return;

		const textToSend = chatInput.trim();
		setChatInput("");

		try {
			const res = await fetch(`/api/video-connect/room/${meetingId}/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sender: displayName || (isHost ? invite.hostName : "Guest"),
					text: textToSend,
				}),
			});

			if (res.ok) {
				const data = (await res.json()) as { messages: ChatMessage[] };
				if (Array.isArray(data.messages)) {
					setMessages(data.messages);
				}
			}
		} catch {}
	};

	const setLocalPreviewRef = (node: HTMLVideoElement | null) => {
		previewRef.current = node;
		if (node && mediaStream && node.srcObject !== mediaStream) {
			node.srcObject = mediaStream;
			void node.play().catch(() => {});
		}
	};

	// Local Video Stream Assignment (Prevent redundant srcObject re-assignment camera blinking)
	useEffect(() => {
		if (previewRef.current && mediaStream && previewRef.current.srcObject !== mediaStream) {
			previewRef.current.srcObject = mediaStream;
			void previewRef.current.play().catch(() => {});
		}
	}, [mediaStream, joined, videoEnabled]);

	// Screen Sharing Stream Ref Assignment
	useEffect(() => {
		if (!screenRef.current || !screenStream) return;
		screenRef.current.srcObject = screenStream;
		void screenRef.current.play().catch(() => {});
	}, [screenStream, screenSharing]);

	const enableDevicesAndJoin = async () => {
		setMediaState("loading");
		setMediaError(null);

		let stream: MediaStream | null = null;
		try {
			if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
				stream = await navigator.mediaDevices
					.getUserMedia({
						audio: { echoCancellation: true, noiseSuppression: true },
						video: { width: { ideal: 1280 }, height: { ideal: 720 } },
					})
					.catch(() => navigator.mediaDevices.getUserMedia({ audio: true, video: true }))
					.catch(() => navigator.mediaDevices.getUserMedia({ video: true }))
					.catch(() => null);
			}
		} catch (err) {
			console.log("Hardware device note:", err);
		}

		if (stream) {
			mediaStreamRef.current = stream;
			setMediaStream(stream);
			setAudioEnabled(true);
			setVideoEnabled(true);
		}

		setJoined(true);
		setMediaState("ready");
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
		Object.values(peerConnections.current).forEach((pc) => pc.close());
		peerConnections.current = {};
		mediaStream?.getTracks().forEach((track) => track.stop());
		screenStream?.getTracks().forEach((track) => track.stop());
		mediaStreamRef.current = null;
		setMediaStream(null);
		setScreenStream(null);
		setScreenSharing(false);
		setJoined(false);
		setMediaState("idle");
		setMediaError(null);
	};

	const totalParticipantsCount = 1 + remoteParticipants.length;

	if (!isMounted) {
		return (
			<div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
					<p className="text-xs font-bold text-zinc-400">Loading Video Meeting Room...</p>
				</div>
			</div>
		);
	}

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
										<video ref={setLocalPreviewRef} autoPlay muted playsInline className="h-full w-full object-cover" />
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
					{/* TOP HEADER BAR (Cleaned - No Recording Pill / Number at top) */}
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

						{/* Clean Copy Meeting Link Button */}
						<div className="hidden sm:flex items-center gap-3">
							<button
								type="button"
								onClick={() => void copyLink()}
								className="flex items-center gap-1.5 rounded-full bg-indigo-600/20 px-3 py-1.5 text-xs font-bold text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition"
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
								<span>👥</span> Participants ({totalParticipantsCount})
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
					<div className="flex-1 flex flex-col overflow-hidden relative p-4 gap-4">
						<div className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full relative">
							
							{remoteParticipants.length === 0 ? (
								/* ==================== 1 SINGLE FULL-SIZE TILE (WHEN ALONE) ==================== */
								<div className="relative h-full w-full max-h-[85vh] rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col justify-between p-6 shadow-2xl group">
									<div className="flex items-center justify-between z-10">
										<span className="text-xs font-bold bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md flex items-center gap-2">
											<span>{displayName || (isHost ? invite.hostName : "Participant")}</span>
											{isHost && <span className="text-indigo-400 font-black">HOST</span>}
											<span className="text-zinc-400 text-[10px]">(You)</span>
										</span>
										<span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${mediaStream ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"}`}>
											{mediaStream ? "WEBCAM LIVE" : "CAMERA ACTIVE"}
										</span>
									</div>

									{/* Main Live Webcam Stream */}
									{mediaStream && videoEnabled ? (
										<video ref={setLocalPreviewRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
									) : (
										<div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950/40 to-zinc-950">
											<div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black border-4 border-indigo-400 shadow-2xl mb-3">
												{(displayName || invite.hostName).substring(0, 2).toUpperCase()}
											</div>
											<p className="text-base font-bold text-zinc-200">{displayName || invite.hostName}</p>
											<p className="text-xs text-zinc-400 mt-1">Ready in meeting room</p>
										</div>
									)}

									{/* Bottom Banner (Host vs Guest) */}
									{isHost ? (
										<div className="z-10 flex items-center justify-between bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 max-w-xl mx-auto w-full shadow-lg">
											<div className="flex items-center gap-2 text-xs text-zinc-300">
												<span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
												<span>You are the only person here. Share link to invite others:</span>
											</div>
											<button
												type="button"
												onClick={() => void copyLink()}
												className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs whitespace-nowrap"
											>
												{copyNotice ? "Copied!" : "📋 Copy Link"}
											</button>
										</div>
									) : (
										<div className="z-10 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 max-w-xl mx-auto w-full shadow-lg">
											<div className="flex items-center gap-2 text-xs text-zinc-300">
												<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
												<span>Waiting for host or other participants to join...</span>
											</div>
										</div>
									)}
								</div>
							) : (
								/* ==================== MULTI PARTICIPANTS GRID (MERGED 2+ TILES) ==================== */
								<div className="w-full h-full grid gap-4 auto-rows-fr grid-cols-1 md:grid-cols-2 items-center justify-center">
									{/* MY TILE (Muted locally to prevent self-echo) */}
									<div className="relative h-full min-h-[240px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col justify-between p-4 shadow-lg group">
										<div className="flex items-center justify-between z-10">
											<span className="text-xs font-bold bg-black/60 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-xs">
												{displayName || (isHost ? invite.hostName : "Participant")}
												{isHost && <span className="text-indigo-400 font-extrabold ml-1">HOST</span>}
												<span className="text-zinc-400 text-[10px] ml-1">(You)</span>
											</span>
											<span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${mediaStream ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"}`}>
												{mediaStream ? "WEBCAM LIVE" : "CAMERA ACTIVE"}
											</span>
										</div>

										{mediaStream && videoEnabled ? (
											<video ref={setLocalPreviewRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
										) : (
											<div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950/40 to-zinc-950">
												<div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black border-2 border-indigo-400 shadow-xl mb-2">
													{(displayName || invite.hostName).substring(0, 2).toUpperCase()}
												</div>
												<p className="text-xs font-bold text-zinc-300">{displayName || invite.hostName}</p>
											</div>
										)}

										<div className="z-10 flex items-center gap-2">
											<span className={`text-xs px-2.5 py-1 rounded-md border ${audioEnabled ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/30"}`}>
												{audioEnabled ? "🎤 Mic On" : "🔇 Mic Muted"}
											</span>
										</div>
									</div>

									{/* REMOTE PARTICIPANTS TILES (Unmuted for audible voice & WebRTC stream via RemoteParticipantMediaTile) */}
									{remoteParticipants.map((participant) => (
										<RemoteParticipantMediaTile
											key={participant.id}
											participant={participant}
											stream={remoteStreams[participant.id]}
										/>
									))}
								</div>
							)}

						</div>

						{/* SIDEBAR: CHAT / PARTICIPANTS PANEL */}
						{activeTab && (
							<div className="w-80 rounded-2xl border border-zinc-800 bg-zinc-900 flex flex-col shadow-2xl z-20">
								<div className="flex items-center justify-between p-3 border-b border-zinc-800">
									<h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
										{activeTab === "chat" ? "Live Meeting Chat" : `Participants (${totalParticipantsCount})`}
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
										{/* My Profile Item */}
										<div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800 border border-zinc-700">
											<div className="flex items-center gap-2">
												<div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
													{(displayName || invite.hostName).substring(0, 2).toUpperCase()}
												</div>
												<div>
													<p className="font-bold text-zinc-200">{displayName || invite.hostName} (You)</p>
													<span className="text-[10px] text-indigo-400">{isHost ? "Meeting Host" : "Participant"}</span>
												</div>
											</div>
											<span className="text-emerald-400">🎤</span>
										</div>

										{/* Remote Participants List */}
										{remoteParticipants.map((p) => (
											<div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-800 border border-zinc-700">
												<div className="flex items-center gap-2">
													<div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">
														{p.name.substring(0, 2).toUpperCase()}
													</div>
													<div>
														<p className="font-bold text-zinc-200">{p.name}</p>
														<span className="text-[10px] text-zinc-400">{p.isHost ? "Meeting Host" : "Participant"}</span>
													</div>
												</div>
												<span className="text-emerald-400">🎤</span>
											</div>
										))}
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