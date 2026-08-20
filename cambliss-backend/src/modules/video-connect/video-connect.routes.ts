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

type RoomState = {
	meetingId: string;
	participants: Map<string, RoomParticipant>;
	messages: RoomChatMessage[];
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

const router = Router();

// Heartbeat & Presence Sync Route
router.post("/room/:meetingId/sync", (req: Request, res: Response) => {
	const { meetingId } = req.params;
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
	const { meetingId } = req.params;
	const { participantId } = req.body as { participantId?: string };

	if (meetingId && participantId && rooms.has(meetingId)) {
		const room = rooms.get(meetingId)!;
		room.participants.delete(participantId);
	}

	res.json({ success: true });
});

// Fetch & Send Chat Messages
router.get("/room/:meetingId/chat", (req: Request, res: Response) => {
	const { meetingId } = req.params;
	const room = getOrCreateRoom(meetingId);
	res.json({ messages: room.messages });
});

router.post("/room/:meetingId/chat", (req: Request, res: Response) => {
	const { meetingId } = req.params;
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
