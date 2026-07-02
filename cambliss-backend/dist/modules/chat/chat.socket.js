"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChatSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const chat_service_1 = require("./chat.service");
const CHAT_ROOM_PREFIX = "org:";
const ADMIN_CHAT_ROOM = "chat:admins";
const getTokenFromSocketAuth = (socket) => {
    var _a;
    const authToken = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
    if (typeof authToken === "string" && authToken.trim()) {
        return authToken.trim();
    }
    const header = socket.handshake.headers.authorization;
    if (typeof header === "string") {
        const [scheme, token] = header.trim().split(" ");
        if (scheme === "Bearer" && token) {
            return token;
        }
    }
    return null;
};
const resolveUserFromToken = (token) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined");
    }
    const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
    if (!(0, auth_middleware_1.isAuthenticatedUser)(decoded)) {
        throw new Error("Invalid auth token");
    }
    return decoded;
};
const initChatSocket = (httpServer) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, chat_service_1.ensureChatStorage)();
    const io = new socket_io_1.Server(httpServer, {
        path: "/socket.io",
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    io.use((socket, next) => {
        try {
            const token = getTokenFromSocketAuth(socket);
            if (!token) {
                next(new Error("Unauthorized"));
                return;
            }
            const user = resolveUserFromToken(token);
            socket.data.user = user;
            next();
        }
        catch (error) {
            next(new Error(error instanceof Error ? error.message : "Unauthorized"));
        }
    });
    io.on("connection", (socket) => {
        const user = socket.data.user;
        const room = `${CHAT_ROOM_PREFIX}${user.organizationId}`;
        socket.join(room);
        const isAdmin = user.role === client_1.RoleName.ADMIN || user.role === client_1.RoleName.SUPER_ADMIN;
        if (isAdmin) {
            socket.join(ADMIN_CHAT_ROOM);
        }
        socket.on("chat:send", (payload, ack) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const targetOrganizationId = isAdmin && (payload === null || payload === void 0 ? void 0 : payload.organizationId) && payload.organizationId.trim()
                    ? payload.organizationId.trim()
                    : user.organizationId;
                const created = yield (0, chat_service_1.createChatMessage)({
                    organizationId: targetOrganizationId,
                    senderUserId: user.id,
                    senderEmail: user.email,
                    senderRole: user.role,
                    senderName: null,
                    message: (payload === null || payload === void 0 ? void 0 : payload.message) || "",
                });
                io.to(`${CHAT_ROOM_PREFIX}${targetOrganizationId}`).emit("chat:new", created);
                io.to(ADMIN_CHAT_ROOM).emit("chat:new", created);
                ack === null || ack === void 0 ? void 0 : ack({ ok: true });
            }
            catch (error) {
                if (error instanceof chat_service_1.ChatError) {
                    ack === null || ack === void 0 ? void 0 : ack({ ok: false, message: error.message });
                    return;
                }
                ack === null || ack === void 0 ? void 0 : ack({ ok: false, message: "Unable to send message" });
            }
        }));
    });
    return io;
});
exports.initChatSocket = initChatSocket;
