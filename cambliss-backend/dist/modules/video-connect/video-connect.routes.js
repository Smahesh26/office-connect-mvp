"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rooms = new Map();
function getOrCreateRoom(meetingId) {
    let room = rooms.get(meetingId);
    if (!room) {
        room = {
            meetingId,
            participants: new Map(),
            messages: [
                { id: "1", sender: "System", text: "Welcome to the meeting room!", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
            ],
        };
        rooms.set(meetingId, room);
    }
    return room;
}
function cleanupStaleParticipants(room) {
    const now = Date.now();
    for (const [id, participant] of room.participants.entries()) {
        if (now - participant.lastSeen > 8000) {
            room.participants.delete(id);
        }
    }
}
function extractMeetingId(param) {
    if (Array.isArray(param))
        return param[0] || "";
    return param || "";
}
const router = (0, express_1.Router)();
// Heartbeat & Presence Sync Route
router.post("/room/:meetingId/sync", (req, res) => {
    const meetingId = extractMeetingId(req.params.meetingId);
    const { participantId, name, isHost, audioEnabled, videoEnabled } = req.body;
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
router.post("/room/:meetingId/leave", (req, res) => {
    const meetingId = extractMeetingId(req.params.meetingId);
    const { participantId } = req.body;
    if (meetingId && participantId && rooms.has(meetingId)) {
        const room = rooms.get(meetingId);
        room.participants.delete(participantId);
    }
    res.json({ success: true });
});
// Fetch & Send Chat Messages
router.get("/room/:meetingId/chat", (req, res) => {
    const meetingId = extractMeetingId(req.params.meetingId);
    const room = getOrCreateRoom(meetingId);
    res.json({ messages: room.messages });
});
router.post("/room/:meetingId/chat", (req, res) => {
    const meetingId = extractMeetingId(req.params.meetingId);
    const { sender, text } = req.body;
    if (!text || !text.trim()) {
        res.status(400).json({ message: "Text is required" });
        return;
    }
    const room = getOrCreateRoom(meetingId);
    const newMsg = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: sender || "Participant",
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    room.messages.push(newMsg);
    res.json({ message: newMsg, messages: room.messages });
});
exports.default = router;
