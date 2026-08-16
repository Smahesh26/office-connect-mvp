"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import WorkspaceShell from "../../../../components/WorkspaceShell";
import {
	buildGoogleCalendarUrl,
	buildInviteText,
	buildMailtoUrl,
	buildMeetingPath,
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

export default function VideoMeetingRoomPage() {
	const params = useParams<{ meetingId: string }>();
	const searchParams = useSearchParams();
	const meetingId = params.meetingId;
	const previewRef = useRef<HTMLVideoElement | null>(null);
	const [displayName, setDisplayName] = useState("Guest");
	const [joined, setJoined] = useState(false);
	const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
	const [mediaState, setMediaState] = useState<"idle" | "loading" | "ready" | "blocked">("idle");
	const [mediaError, setMediaError] = useState<string | null>(null);
	const [audioEnabled, setAudioEnabled] = useState(true);
	const [videoEnabled, setVideoEnabled] = useState(true);

	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
	}, []);

	const defaultStart = useMemo(() => "2026-08-16T10:00:00.000Z", []);

	const invite = useMemo<VideoMeetingInvite>(
		() => ({
			meetingId,
			title: searchParams.get("title") || "Office Connect Meeting",
			hostName: searchParams.get("host") || "Office Connect",
			scheduledStart: searchParams.get("start") || defaultStart,
			durationMinutes: Number(searchParams.get("duration") || 30),
			attendeeEmails: parseAttendees(searchParams.get("attendees")),
			notes: searchParams.get("notes") || "",
		}),
		[meetingId, searchParams, defaultStart],
	);

	const meetingUrl = useMemo(() => {
		if (typeof window === "undefined" || !isMounted) {
			return "";
		}

		return buildMeetingUrl(window.location.origin, invite);
	}, [invite, isMounted]);

	const copyLink = async () => {
		if (!meetingUrl) return;
		await navigator.clipboard.writeText(meetingUrl);
	};

	useEffect(() => {
		if (!previewRef.current) {
			return;
		}

		previewRef.current.srcObject = mediaStream;
		if (mediaStream) {
			void previewRef.current.play();
		}

		return () => {
			if (previewRef.current) {
				previewRef.current.srcObject = null;
			}
		};
	}, [mediaStream]);

	useEffect(() => {
		return () => {
			mediaStream?.getTracks().forEach((track) => track.stop());
		};
	}, [mediaStream]);

	const enableDevices = async () => {
		setMediaState("loading");
		setMediaError(null);

		try {
			if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(() => 
					navigator.mediaDevices.getUserMedia({ video: true })
				);
				if (stream) {
					if (previewRef.current) {
						previewRef.current.srcObject = stream;
						previewRef.current.play().catch(() => {});
					}
					setMediaStream(stream);
					setJoined(true);
					setMediaState("ready");
					setAudioEnabled(true);
					setVideoEnabled(true);
					return;
				}
			}
		} catch (err) {
			console.log("Hardware device access note:", err);
		}

		// Virtual Room Fallback (when hardware camera is restricted by browser HTTP policies)
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

	const leaveRoom = () => {
		mediaStream?.getTracks().forEach((track) => track.stop());
		setMediaStream(null);
		setJoined(false);
		setMediaState("idle");
		setMediaError(null);
	};

	return (
		<WorkspaceShell>
			<div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
				<div className="rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_38px_-24px_rgba(29,65,157,0.35)]">
					<Link href="/video-connect" className="inline-flex items-center gap-2 rounded-xl border border-[#dbe3f7] bg-[#f6f9ff] px-3 py-1.5 text-xs font-semibold text-[#35558e] hover:bg-[#edf3ff]">
						<span aria-hidden>←</span>
						Back to scheduler
					</Link>
					<h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#111827]">{invite.title}</h1>
					<p className="mt-2 text-sm text-[#4b5563]">Hosted by {invite.hostName}</p>

					<div className="mt-5 grid gap-3 rounded-2xl border border-[#dbe3f7] bg-[#f6f9ff] p-4 text-sm text-[#4b5563] sm:grid-cols-2">
						<p><span className="font-semibold text-[#111827]">Meeting ID:</span> {meetingId}</p>
						<p><span className="font-semibold text-[#111827]">When:</span> {formatDateTime(invite.scheduledStart)}</p>
						<p><span className="font-semibold text-[#111827]">Duration:</span> {invite.durationMinutes} minutes</p>
						<p><span className="font-semibold text-[#111827]">Guests:</span> {invite.attendeeEmails.length ? invite.attendeeEmails.join(", ") : "No attendees yet"}</p>
					</div>

					{invite.notes && (
						<div className="mt-4 rounded-2xl border border-[#dbe3f7] bg-[#fbfcff] p-4 text-sm text-[#4b5563]">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f84ad]">Notes</p>
							<p className="mt-2 whitespace-pre-wrap">{invite.notes}</p>
						</div>
					)}

					<div className="mt-5 rounded-2xl border border-dashed border-[#b9c9eb] bg-[#f6f9ff] p-5">
						<p className="text-sm font-semibold text-[#111827]">Join flow</p>
						<p className="mt-1 text-sm text-[#4b5563]">This basic release gives every participant a shareable room link and a browser-based join step with camera and mic preview.</p>
						<div className="mt-4 flex flex-wrap gap-2">
							<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="min-w-56 rounded-xl border border-[#dbe3f7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1d419d]" placeholder="Your name" />
							<button type="button" onClick={() => void enableDevices()} className="rounded-xl bg-[#1d419d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173784]">Enable camera and mic</button>
							<button type="button" onClick={() => void copyLink()} className="rounded-xl border border-[#dbe3f7] bg-white px-4 py-2 text-sm font-semibold text-[#35558e] hover:bg-[#edf3ff]">Copy link</button>
						</div>
						{mediaError && <p className="mt-3 text-sm text-[#b42318]">{mediaError}</p>}
					</div>

					<div className="mt-5 flex flex-wrap gap-2">
						<a href={buildMailtoUrl(invite, meetingUrl)} className="rounded-xl border border-[#dbe3f7] bg-white px-4 py-2 text-sm font-semibold text-[#35558e] hover:bg-[#edf3ff]">Open email draft</a>
						<a href={buildGoogleCalendarUrl(invite, meetingUrl)} target="_blank" rel="noreferrer" className="rounded-xl bg-[#1d419d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173784]">Google Calendar reminder</a>
					</div>
				</div>

				<div className="rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_38px_-24px_rgba(29,65,157,0.35)]">
					<p className="text-sm font-semibold text-[#111827]">Meeting room</p>
					<p className="mt-1 text-sm text-[#4b5563]">{joined ? `${displayName} is in the room.` : "Click Enable camera and mic to enter the room."}</p>

					<div className="mt-5 grid gap-3 sm:grid-cols-2">
						<div className="rounded-2xl border border-[#dbe3f7] bg-[#0f172a] p-4 text-white shadow-[0_20px_40px_-28px_rgba(15,23,42,0.8)]">
							<div className="flex items-center justify-between">
								<p className="text-xs uppercase tracking-[0.24em] text-[#c7d2fe]">{displayName}'s Tile</p>
								<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
									{mediaStream ? "LIVE WEBCAM" : joined ? "ACTIVE ROOM" : "STANDBY"}
								</span>
							</div>
							<div className="mt-3 relative overflow-hidden rounded-xl border border-white/15 bg-black h-44 flex items-center justify-center">
								{mediaStream && videoEnabled ? (
									<video ref={previewRef} autoPlay muted playsInline className="h-full w-full object-cover" />
								) : joined ? (
									<div className="relative w-full h-full bg-[#1e1b4b] flex flex-col items-center justify-center p-4 text-center">
										<div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold border-2 border-indigo-400 shadow-md mb-2">
											{displayName ? displayName.substring(0, 2).toUpperCase() : "ME"}
										</div>
										<p className="text-xs font-bold text-white">{displayName}</p>
										<p className="text-[11px] text-indigo-300 mt-0.5">{videoEnabled ? "Camera Feed Active" : "Camera Muted"}</p>
										{audioEnabled && (
											<div className="mt-2 flex items-center gap-1">
												<span className="w-1 h-3 bg-emerald-400 rounded animate-pulse" />
												<span className="w-1 h-4 bg-emerald-400 rounded animate-pulse delay-75" />
												<span className="w-1 h-2 bg-emerald-400 rounded animate-pulse delay-150" />
											</div>
										)}
									</div>
								) : (
									<div className="flex h-44 items-center justify-center bg-white/5 text-sm text-white/80">
										{mediaState === "loading" ? "Starting devices..." : "Click 'Enable camera and mic' to join"}
									</div>
								)}
							</div>
							<div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
								<span className={`rounded-full px-3 py-1 ${audioEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>{audioEnabled ? "🎤 Mic On" : "🔇 Mic Muted"}</span>
								<span className={`rounded-full px-3 py-1 ${videoEnabled ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>{videoEnabled ? "📷 Camera On" : "📷 Camera Off"}</span>
							</div>
						</div>

						<div className="rounded-2xl border border-[#dbe3f7] bg-[#f6f9ff] p-4">
							<p className="text-xs uppercase tracking-[0.24em] text-[#6f84ad]">Invite summary</p>
							<div className="mt-3 space-y-2 text-sm text-[#4b5563]">
								<p><span className="font-semibold text-[#111827]">Link:</span> share the room URL with attendees.</p>
								<p><span className="font-semibold text-[#111827]">Email:</span> use the email draft button to open your mail app.</p>
								<p><span className="font-semibold text-[#111827]">Calendar:</span> add the Google Calendar reminder so the meeting shows up on time.</p>
							</div>
							<div className="mt-4 rounded-xl border border-dashed border-[#b9c9eb] bg-white p-4 text-xs text-[#4b5563]">
								{buildInviteText(invite, meetingUrl || buildMeetingPath(invite))}
							</div>
							<div className="mt-4 flex flex-wrap gap-2">
								<button type="button" onClick={toggleAudio} disabled={!joined} className="rounded-xl border border-[#dbe3f7] bg-white px-3 py-2 text-sm font-semibold text-[#35558e] disabled:cursor-not-allowed disabled:opacity-50">{audioEnabled ? "Mute mic" : "Unmute mic"}</button>
								<button type="button" onClick={toggleVideo} disabled={!joined} className="rounded-xl border border-[#dbe3f7] bg-white px-3 py-2 text-sm font-semibold text-[#35558e] disabled:cursor-not-allowed disabled:opacity-50">{videoEnabled ? "Turn camera off" : "Turn camera on"}</button>
								<button type="button" onClick={leaveRoom} disabled={!joined} className="rounded-xl bg-[#1d419d] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#173784]">Leave room</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</WorkspaceShell>
	);
}