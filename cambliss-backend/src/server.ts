import "dotenv/config";
import { createServer } from "http";
import app from "./index";
import { initChatSocket } from "./modules/chat/chat.socket";
import { startChatTransferCleanupJob } from "./modules/chat/chat-files.service";
import { startTrialReminderJob } from "./modules/subscription/subscription.service";

const port = Number(process.env.PORT) || 5000;

const httpServer = createServer(app);

const startServer = async () => {
	httpServer.listen(port, "0.0.0.0", () => {
		console.log(`Cambliss backend server running on http://0.0.0.0:${port}`);
	});

	try {
		await initChatSocket(httpServer);
	} catch (error) {
		console.error("[startup] chat socket init warning:", error);
	}

	try {
		startChatTransferCleanupJob();
		startTrialReminderJob();
	} catch (error) {
		console.error("[startup] background jobs warning:", error);
	}
};

void startServer();