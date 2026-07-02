export type VideoMeetingInvite = {
	meetingId: string;
	title: string;
	hostName: string;
	scheduledStart: string;
	durationMinutes: number;
	attendeeEmails: string[];
	notes: string;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

export const createVideoMeetingId = () => {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return `meeting-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const splitEmails = (value: string) =>
	value
		.split(/[\n,;]+/)
		.map((email) => email.trim())
		.filter(Boolean);

export const formatDateTime = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
};

export const toDateTimeLocalValue = (date: Date) => {
	const year = date.getFullYear();
	const month = pad2(date.getMonth() + 1);
	const day = pad2(date.getDate());
	const hours = pad2(date.getHours());
	const minutes = pad2(date.getMinutes());
	return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toCalendarStamp = (date: Date) => {
	const year = date.getUTCFullYear();
	const month = pad2(date.getUTCMonth() + 1);
	const day = pad2(date.getUTCDate());
	const hours = pad2(date.getUTCHours());
	const minutes = pad2(date.getUTCMinutes());
	const seconds = pad2(date.getUTCSeconds());
	return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

export const buildMeetingPath = (invite: VideoMeetingInvite) => {
	const params = new URLSearchParams({
		title: invite.title,
		host: invite.hostName,
		start: invite.scheduledStart,
		duration: String(invite.durationMinutes),
		notes: invite.notes,
		attendees: invite.attendeeEmails.join(","),
	});

	return `/video-connect/room/${invite.meetingId}?${params.toString()}`;
};

export const buildMeetingUrl = (origin: string, invite: VideoMeetingInvite) => {
	return `${origin}${buildMeetingPath(invite)}`;
};

export const buildInviteText = (invite: VideoMeetingInvite, meetingUrl: string) => {
	const lines = [
		`Meeting: ${invite.title}`,
		`Host: ${invite.hostName}`,
		`When: ${formatDateTime(invite.scheduledStart)}`,
		`Duration: ${invite.durationMinutes} minutes`,
		`Join link: ${meetingUrl}`,
	];

	if (invite.notes) {
		lines.push(`Notes: ${invite.notes}`);
	}

	return lines.join("\n");
};

export const buildGoogleCalendarUrl = (invite: VideoMeetingInvite, meetingUrl: string) => {
	const start = new Date(invite.scheduledStart);
	const end = new Date(start.getTime() + invite.durationMinutes * 60 * 1000);
	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: invite.title,
		dates: `${toCalendarStamp(start)}/${toCalendarStamp(end)}`,
		details: buildInviteText(invite, meetingUrl),
		location: meetingUrl,
		ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const buildMailtoUrl = (invite: VideoMeetingInvite, meetingUrl: string) => {
	const recipients = invite.attendeeEmails.join(",");
	const params = new URLSearchParams({
		subject: `${invite.title} - Office Connect Meeting`,
		body: buildInviteText(invite, meetingUrl),
	});

	return `mailto:${recipients}?${params.toString()}`;
};