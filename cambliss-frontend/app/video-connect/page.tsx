"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";
import {
	buildGoogleCalendarUrl,
	buildInviteText,
	buildMailtoUrl,
	buildMeetingPath,
	buildMeetingUrl,
	createVideoMeetingId,
	splitEmails,
	toDateTimeLocalValue,
	type VideoMeetingInvite,
} from "../../lib/video-connect";

const defaultStart = () => toDateTimeLocalValue(new Date(Date.now() + 30 * 60 * 1000));

export default function VideoConnectPage() {
	const router = useRouter();
	const [title, setTitle] = useState("Team meeting");
	const [hostName, setHostName] = useState("Office Connect");
	const [scheduledStart, setScheduledStart] = useState(defaultStart());
	const [durationMinutes, setDurationMinutes] = useState(30);
	const [attendees, setAttendees] = useState("team@company.com");
	const [notes, setNotes] = useState("Join from the meeting link. Open Google Calendar to add a reminder.");
	const [createdInvite, setCreatedInvite] = useState<VideoMeetingInvite | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	const meetingUrl = useMemo(() => {
		if (!createdInvite || typeof window === "undefined") {
			return "";
		}

		return buildMeetingUrl(window.location.origin, createdInvite);
	}, [createdInvite]);

	const calendarLink = useMemo(() => {
		if (!createdInvite || !meetingUrl) {
			return "";
		}

		return buildGoogleCalendarUrl(createdInvite, meetingUrl);
	}, [createdInvite, meetingUrl]);

	const buildInviteFromForm = (): VideoMeetingInvite => ({
		meetingId: createVideoMeetingId(),
		title: title.trim() || "Team meeting",
		hostName: hostName.trim() || "Office Connect",
		scheduledStart,
		durationMinutes: Math.max(15, Math.min(480, Number(durationMinutes) || 30)),
		attendeeEmails: splitEmails(attendees),
		notes: notes.trim(),
	});

	const buildInstantInvite = (): VideoMeetingInvite => ({
		meetingId: createVideoMeetingId(),
		title: title.trim() || "Instant meeting",
		hostName: hostName.trim() || "Office Connect",
		scheduledStart: toDateTimeLocalValue(new Date()),
		durationMinutes: Math.max(15, Math.min(480, Number(durationMinutes) || 30)),
		attendeeEmails: splitEmails(attendees),
		notes: notes.trim() || "Instant meeting started from Office Connect.",
	});

	const handleCreateLink = () => {
		const invite = buildInviteFromForm();
		setCreatedInvite(invite);
		setNotice("Meeting link created. Copy it, email it, or add it to Google Calendar.");
		return invite;
	};

	const copyText = async (value: string) => {
		await navigator.clipboard.writeText(value);
		setNotice("Copied to clipboard.");
	};

	const openRoom = () => {
		const invite = createdInvite ?? handleCreateLink();
		router.push(buildMeetingPath(invite));
	};

	const startInstantMeeting = () => {
		const invite = buildInstantInvite();
		setCreatedInvite(invite);
		setNotice("Instant meeting created. You can join or share the room link right away.");
		router.push(buildMeetingPath(invite));
	};

	return (
		<WorkspaceShell>
			<div className="mt-5 rounded-2xl border border-[#dbe3f7] bg-white p-6 shadow-[0_18px_38px_-24px_rgba(29,65,157,0.35)]">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight text-[#111827]">Video Connect</h1>
						<p className="mt-2 text-sm text-[#4b5563]">Create a meeting link, share it by email or copy-paste, and add a Google Calendar reminder.</p>
					</div>
					<Link href="/dashboard" className="rounded-xl border border-[#dbe3f7] bg-[#f6f9ff] px-4 py-2 text-sm font-semibold text-[#35558e] hover:bg-[#edf3ff]">
						Back to dashboard
					</Link>
				</div>

				{notice && <p className="mt-4 rounded-xl border border-[#dbe3f7] bg-[#f6f9ff] px-3 py-2 text-sm text-[#35558e]">{notice}</p>}

				<div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
					<div className="space-y-4 rounded-2xl border border-[#dbe3f7] bg-[#fbfcff] p-5">
						<div className="grid gap-3 sm:grid-cols-2">
							<label className="space-y-1 text-sm font-medium text-[#111827]">
								<span>Meeting title</span>
								<input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-[#dbe3f7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1d419d]" />
							</label>
							<label className="space-y-1 text-sm font-medium text-[#111827]">
								<span>Host name</span>
								<input value={hostName} onChange={(event) => setHostName(event.target.value)} className="w-full rounded-xl border border-[#dbe3f7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1d419d]" />
							</label>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<label className="space-y-1 text-sm font-medium text-[#111827]">
								<span>Start time</span>
								<input type="datetime-local" value={scheduledStart} onChange={(event) => setScheduledStart(event.target.value)} className="w-full rounded-xl border border-[#dbe3f7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1d419d]" />
							</label>
							<label className="space-y-1 text-sm font-medium text-[#111827]">
								<span>Duration (minutes)</span>
								<input type="number" min={15} max={480} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="w-full rounded-xl border border-[#dbe3f7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1d419d]" />
							</label>
						</div>

						<label className="space-y-1 text-sm font-medium text-[#111827]">
							<span>Invite emails</span>
							<textarea value={attendees} onChange={(event) => setAttendees(event.target.value)} rows={3} className="w-full rounded-xl border border-[#dbe3f7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1d419d]" placeholder="team@company.com, client@company.com" />
						</label>

						<label className="space-y-1 text-sm font-medium text-[#111827]">
							<span>Notes</span>
							<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full rounded-xl border border-[#dbe3f7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1d419d]" />
						</label>

						<div className="flex flex-wrap gap-2">
							<button type="button" onClick={handleCreateLink} className="rounded-xl bg-[#1d419d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173784]">Create meeting link</button>
							<button type="button" onClick={startInstantMeeting} className="rounded-xl border border-[#1d419d] bg-[#edf3ff] px-4 py-2 text-sm font-semibold text-[#1d419d] hover:bg-[#dfe9ff]">Start instant meeting</button>
							<button type="button" onClick={openRoom} className="rounded-xl border border-[#dbe3f7] bg-white px-4 py-2 text-sm font-semibold text-[#35558e] hover:bg-[#edf3ff]">Open room</button>
						</div>
					</div>

					<div className="space-y-4 rounded-2xl border border-[#dbe3f7] bg-[#f6f9ff] p-5">
						<div>
							<p className="text-sm font-semibold text-[#111827]">Invite preview</p>
							<p className="mt-1 text-sm text-[#4b5563]">Generate one link and share it by email, copy-paste, or Google Calendar.</p>
						</div>

						{createdInvite ? (
							<>
								<div className="space-y-3 rounded-2xl border border-[#dbe3f7] bg-white p-4">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f84ad]">Meeting link</p>
										<p className="mt-2 break-all text-sm text-[#111827]">{meetingUrl}</p>
									</div>
									<div className="grid gap-2 text-sm text-[#4b5563]">
										<p><span className="font-semibold text-[#111827]">Title:</span> {createdInvite.title}</p>
										<p><span className="font-semibold text-[#111827]">Host:</span> {createdInvite.hostName}</p>
										<p><span className="font-semibold text-[#111827]">When:</span> {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(createdInvite.scheduledStart))}</p>
										<p><span className="font-semibold text-[#111827]">Attendees:</span> {createdInvite.attendeeEmails.length ? createdInvite.attendeeEmails.join(", ") : "None"}</p>
									</div>
								</div>

								<div className="flex flex-wrap gap-2">
									<button type="button" onClick={() => void copyText(meetingUrl)} className="rounded-xl border border-[#dbe3f7] bg-white px-4 py-2 text-sm font-semibold text-[#35558e] hover:bg-[#edf3ff]">Copy link</button>
									<button type="button" onClick={() => void copyText(buildInviteText(createdInvite, meetingUrl))} className="rounded-xl border border-[#dbe3f7] bg-white px-4 py-2 text-sm font-semibold text-[#35558e] hover:bg-[#edf3ff]">Copy invite text</button>
									<a href={buildMailtoUrl(createdInvite, meetingUrl)} className="rounded-xl border border-[#dbe3f7] bg-white px-4 py-2 text-sm font-semibold text-[#35558e] hover:bg-[#edf3ff]">Open email draft</a>
									<a href={calendarLink} target="_blank" rel="noreferrer" className="rounded-xl bg-[#1d419d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173784]">Add to Google Calendar</a>
								</div>
							</>
						) : (
							<div className="rounded-2xl border border-dashed border-[#b9c9eb] bg-white p-5 text-sm text-[#4b5563]">
								Create a meeting link to reveal the share actions.
							</div>
						)}
					</div>
				</div>
			</div>
		</WorkspaceShell>
	);
}
