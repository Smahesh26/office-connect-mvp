import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { RoleName } from "@prisma/client";
import { isAuthenticatedUser, type AuthenticatedUser } from "../../middleware/auth.middleware";
import { ChatError, createChatMessage, ensureChatStorage } from "./chat.service";

type ChatPayload = {
	message: string;
	organizationId?: string;
};

const CHAT_ROOM_PREFIX = "org:";
const ADMIN_CHAT_ROOM = "chat:admins";

const getTokenFromSocketAuth = (socket: { handshake: { auth?: { token?: unknown }; headers: { authorization?: string } } }): string | null => {
	const authToken = socket.handshake.auth?.token;
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

const resolveUserFromToken = (token: string): AuthenticatedUser => {
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		throw new Error("JWT_SECRET is not defined");
	}

	const decoded = jwt.verify(token, jwtSecret);
	if (!isAuthenticatedUser(decoded)) {
		throw new Error("Invalid auth token");
	}

	return decoded;
};

export const initChatSocket = async (httpServer: HttpServer): Promise<SocketIOServer> => {
	await ensureChatStorage();

	const io = new SocketIOServer(httpServer, {
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
		} catch (error) {
			next(new Error(error instanceof Error ? error.message : "Unauthorized"));
		}
	});

	io.on("connection", (socket) => {
		const user = socket.data.user as AuthenticatedUser;
		const room = `${CHAT_ROOM_PREFIX}${user.organizationId}`;
		socket.join(room);

		const isAdmin = user.role === RoleName.ADMIN || user.role === RoleName.SUPER_ADMIN;
		if (isAdmin) {
			socket.join(ADMIN_CHAT_ROOM);
		}

		socket.on("chat:send", async (payload: ChatPayload, ack?: (response: { ok: boolean; message?: string }) => void) => {
			try {
				const targetOrganizationId =
					isAdmin && payload?.organizationId && payload.organizationId.trim()
						? payload.organizationId.trim()
						: user.organizationId;

				const created = await createChatMessage({
					organizationId: targetOrganizationId,
					senderUserId: user.id,
					senderEmail: user.email,
					senderRole: user.role,
					senderName: null,
					message: payload?.message || "",
				});

				io.to(`${CHAT_ROOM_PREFIX}${targetOrganizationId}`).emit("chat:new", created);
				io.to(ADMIN_CHAT_ROOM).emit("chat:new", created);
				ack?.({ ok: true });
			} catch (error) {
				if (error instanceof ChatError) {
					ack?.({ ok: false, message: error.message });
					return;
				}

				ack?.({ ok: false, message: "Unable to send message" });
			}
		});
	});

	return io;
};
