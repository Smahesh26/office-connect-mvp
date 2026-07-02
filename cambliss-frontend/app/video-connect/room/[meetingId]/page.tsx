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

	const invite = useMemo<VideoMeetingInvite>(
		() => ({
			meetingId,
			title: searchParams.get("title") || "Office Connect Meeting",
			hostName: searchParams.get("host") || "Office Connect",
			scheduledStart: searchParams.get("start") || new Date().toISOString(),
			durationMinutes: Number(searchParams.get("duration") || 30),
			attendeeEmails: parseAttendees(searchParams.get("attendees")),
			notes: searchParams.get("notes") || "",
		}),
		[meetingId, searchParams],
	);

	const meetingUrl = useMemo(() => {
		if (typeof window === "undefined") {
			return "";
		}

		return buildMeetingUrl(window.location.origin, invite);
	}, [invite]);

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
		if (!navigator.mediaDevices?.getUserMedia) {
			setMediaState("blocked");
			setMediaError("Your browser does not support camera or microphone access.");
			return;
		}

		setMediaState("loading");
		setMediaError(null);

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
			setMediaStream(stream);
			setJoined(true);
			setMediaState("ready");
			setAudioEnabled(true);
			setVideoEnabled(true);
		} catch {
			setMediaState("blocked");
			setMediaError("Camera and microphone access was blocked. Allow permissions and try again.");
		}
	};

	const toggleAudio = () => {
		if (!mediaStream) return;
		const nextState = !audioEnabled;
		mediaStream.getAudioTracks().forEach((track) => {
			track.enabled = nextState;
		});
		setAudioEnabled(nextState);
	};

	const toggleVideo = () => {
		if (!mediaStream) return;
		const nextState = !videoEnabled;
		mediaStream.getVideoTracks().forEach((track) => {
			track.enabled = nextState;
		});
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
							<p className="text-xs uppercase tracking-[0.24em] text-[#c7d2fe]">Your tile</p>
							<div className="mt-4 overflow-hidden rounded-xl border border-white/15 bg-black">
								<video ref={previewRef} autoPlay muted playsInline className="h-44 w-full object-cover" />
								{!mediaStream && (
									<div className="flex h-44 items-center justify-center bg-white/5 text-sm text-white/80">
										{mediaState === "loading" ? "Starting devices..." : "Waiting to join"}
									</div>
								)}
							</div>
							<div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
								<span className="rounded-full bg-white/10 px-3 py-1 text-white/85">{audioEnabled ? "Mic on" : "Mic off"}</span>
								<span className="rounded-full bg-white/10 px-3 py-1 text-white/85">{videoEnabled ? "Camera on" : "Camera off"}</span>
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
								<button type="button" onClick={toggleAudio} disabled={!mediaStream} className="rounded-xl border border-[#dbe3f7] bg-white px-3 py-2 text-sm font-semibold text-[#35558e] disabled:cursor-not-allowed disabled:opacity-50">{audioEnabled ? "Mute mic" : "Unmute mic"}</button>
								<button type="button" onClick={toggleVideo} disabled={!mediaStream} className="rounded-xl border border-[#dbe3f7] bg-white px-3 py-2 text-sm font-semibold text-[#35558e] disabled:cursor-not-allowed disabled:opacity-50">{videoEnabled ? "Turn camera off" : "Turn camera on"}</button>
								<button type="button" onClick={leaveRoom} disabled={!mediaStream} className="rounded-xl bg-[#1d419d] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#173784]">Leave room</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</WorkspaceShell>
	);
}