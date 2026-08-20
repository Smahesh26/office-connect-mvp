import { Router, Request, Response } from "express";

type RoomParticipant = {
	id: string;
	name: string;
	isHost: boolean;
	audioEnabled: boolean;
	videoEnabled: boolean;
	lastSeen: number;
};

type RoomChatMessage = {
	id: string;
	sender: string;
	text: string;
	time: string;
};

type SignalPayload = {
	id: string;
	senderId: string;
	targetId: string;
	signal: any;
};

type RoomState = {
	meetingId: string;
	participants: Map<string, RoomParticipant>;
	messages: RoomChatMessage[];
	signals: SignalPayload[];
};

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(meetingId: string): RoomState {
	let room = rooms.get(meetingId);
	if (!room) {
		room = {
			meetingId,
			participants: new Map<string, RoomParticipant>(),
			messages: [
				{ id: "1", sender: "System", text: "Welcome to the meeting room!", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
			],
			signals: [],
		};
		rooms.set(meetingId, room);
	}
	return room;
}

function cleanupStaleParticipants(room: RoomState) {
	const now = Date.now();
	for (const [id, participant] of room.participants.entries()) {
		if (now - participant.lastSeen > 8000) {
			room.participants.delete(id);
		}
	}
}

function extractMeetingId(param: string | string[] | undefined): string {
	if (Array.isArray(param)) return param[0] || "";
	return param || "";
}

const router = Router();

// Heartbeat & Presence Sync Route
router.post("/room/:meetingId/sync", (req: Request, res: Response) => {
	const meetingId = extractMeetingId(req.params.meetingId);
	const { participantId, name, isHost, audioEnabled, videoEnabled } = req.body as {
		participantId?: string;
		name?: string;
		isHost?: boolean;
		audioEnabled?: boolean;
		videoEnabled?: boolean;
	};

	if (!meetingId || !participantId) {
		res.status(400).json({ message: "Missing meetingId or participantId" });
		return;
	}

	const room = getOrCreateRoom(meetingId);

	room.participants.set(participantId, {
		id: participantId,
		name: name || (isHost ? "Host" : "Guest"),
		isHost: Boolean(isHost),
		audioEnabled: audioEnabled !== false,
		videoEnabled: videoEnabled !== false,
		lastSeen: Date.now(),
	});

	cleanupStaleParticipants(room);

	const activeList = Array.from(room.participants.values()).map((p) => ({
		id: p.id,
		name: p.name,
		isHost: p.isHost,
		audioEnabled: p.audioEnabled,
		videoEnabled: p.videoEnabled,
	}));

	res.json({
		meetingId,
		participants: activeList,
	});
});

// Leave Meeting Route
router.post("/room/:meetingId/leave", (req: Request, res: Response) => {
	const meetingId = extractMeetingId(req.params.meetingId);
	const { participantId } = req.body as { participantId?: string };

	if (meetingId && participantId && rooms.has(meetingId)) {
		const room = rooms.get(meetingId)!;
		room.participants.delete(participantId);
	}

	res.json({ success: true });
});

// WebRTC Signaling Routes (Peer-to-Peer Video & Audio Exchange)
router.post("/room/:meetingId/signal", (req: Request, res: Response) => {
	const meetingId = extractMeetingId(req.params.meetingId);
	const { senderId, targetId, signal } = req.body as {
		senderId?: string;
		targetId?: string;
		signal?: any;
	};

	if (!meetingId || !senderId || !targetId || !signal) {
		res.status(400).json({ message: "Missing signal parameters" });
		return;
	}

	const room = getOrCreateRoom(meetingId);
	room.signals.push({
		id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
		senderId,
		targetId,
		signal,
	});

	// Keep max 100 signals in memory
	if (room.signals.length > 100) {
		room.signals = room.signals.slice(-100);
	}

	res.json({ success: true });
});

router.get("/room/:meetingId/signal/:myId", (req: Request, res: Response) => {
	const meetingId = extractMeetingId(req.params.meetingId);
	const myId = extractMeetingId(req.params.myId);

	if (!meetingId || !myId || !rooms.has(meetingId)) {
		res.json({ signals: [] });
		return;
	}

	const room = rooms.get(meetingId)!;
	const mySignals = room.signals.filter((s) => s.targetId === myId);

	// Remove consumed signals
	room.signals = room.signals.filter((s) => s.targetId !== myId);

	res.json({ signals: mySignals });
});

// Fetch & Send Chat Messages
router.get("/room/:meetingId/chat", (req: Request, res: Response) => {
	const meetingId = extractMeetingId(req.params.meetingId);
	const room = getOrCreateRoom(meetingId);
	res.json({ messages: room.messages });
});

router.post("/room/:meetingId/chat", (req: Request, res: Response) => {
	const meetingId = extractMeetingId(req.params.meetingId);
	const { sender, text } = req.body as { sender?: string; text?: string };

	if (!text || !text.trim()) {
		res.status(400).json({ message: "Text is required" });
		return;
	}

	const room = getOrCreateRoom(meetingId);
	const newMsg: RoomChatMessage = {
		id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
		sender: sender || "Participant",
		text: text.trim(),
		time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
	};

	room.messages.push(newMsg);
	res.json({ message: newMsg, messages: room.messages });
});

export default router;
