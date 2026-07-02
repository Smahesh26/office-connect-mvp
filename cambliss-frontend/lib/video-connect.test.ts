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
} from "./video-connect";

describe("video-connect helpers", () => {
	const invite: VideoMeetingInvite = {
		meetingId: "meeting-123",
		title: "Weekly sync",
		hostName: "Cambliss Team",
		scheduledStart: "2026-07-10T10:30:00.000Z",
		durationMinutes: 45,
		attendeeEmails: ["alpha@example.com", "beta@example.com"],
		notes: "Review KPIs",
	};

	it("splits mixed email separators and trims values", () => {
		expect(splitEmails("a@x.com, b@y.com\n c@z.com;d@k.com")).toEqual([
			"a@x.com",
			"b@y.com",
			"c@z.com",
			"d@k.com",
		]);
	});

	it("creates deterministic meeting path payload", () => {
		const path = buildMeetingPath(invite);
		expect(path).toContain("/video-connect/room/meeting-123?");
		expect(path).toContain("title=Weekly+sync");
		expect(path).toContain("attendees=alpha%40example.com%2Cbeta%40example.com");
	});

	it("builds full meeting url from origin", () => {
		const url = buildMeetingUrl("https://officeconnect.example.com", invite);
		expect(url).toContain("https://officeconnect.example.com/video-connect/room/meeting-123");
	});

	it("includes required fields in invite text", () => {
		const text = buildInviteText(invite, "https://host/link");
		expect(text).toContain("Meeting: Weekly sync");
		expect(text).toContain("Host: Cambliss Team");
		expect(text).toContain("Duration: 45 minutes");
		expect(text).toContain("Join link: https://host/link");
		expect(text).toContain("Notes: Review KPIs");
	});

	it("generates valid google calendar template url", () => {
		const calendarUrl = buildGoogleCalendarUrl(invite, "https://host/link");
		expect(calendarUrl.startsWith("https://calendar.google.com/calendar/render?")).toBe(true);
		expect(calendarUrl).toContain("action=TEMPLATE");
		expect(calendarUrl).toContain("text=Weekly+sync");
		expect(calendarUrl).toContain("location=https%3A%2F%2Fhost%2Flink");
	});

	it("generates mailto link with recipients and encoded content", () => {
		const mailto = buildMailtoUrl(invite, "https://host/link");
		expect(mailto.startsWith("mailto:alpha@example.com,beta@example.com?")).toBe(true);
		expect(mailto).toContain("subject=Weekly+sync+-+Office+Connect+Meeting");
		expect(mailto).toContain("Join+link%3A+https%3A%2F%2Fhost%2Flink");
	});

	it("formats local datetime field for date picker", () => {
		const date = new Date("2026-07-10T10:30:00.000Z");
		const value = toDateTimeLocalValue(date);
		expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
	});

	it("creates meeting IDs when randomUUID is not available", () => {
		const originalCrypto = (globalThis as { crypto?: Crypto }).crypto;
		Object.defineProperty(globalThis, "crypto", {
			value: undefined,
			configurable: true,
		});

		const id = createVideoMeetingId();
		expect(id.startsWith("meeting-")).toBe(true);

		Object.defineProperty(globalThis, "crypto", {
			value: originalCrypto,
			configurable: true,
		});
	});
});
