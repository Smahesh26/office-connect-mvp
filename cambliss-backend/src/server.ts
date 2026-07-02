import "dotenv/config";
import { createServer } from "http";
import app from "./index";
import { initChatSocket } from "./modules/chat/chat.socket";
import { startChatTransferCleanupJob } from "./modules/chat/chat-files.service";
import { startTrialReminderJob } from "./modules/subscription/subscription.service";

const port = Number(process.env.PORT) || 4000;

const httpServer = createServer(app);

const startServer = async () => {
	httpServer.listen(port, () => {
		console.log(`Cambliss backend running on http://localhost:${port}`);
	});

	void initChatSocket(httpServer).catch((error) => {
		console.error("[startup] chat socket init failed:", error);
	});

	startChatTransferCleanupJob();
	startTrialReminderJob();
};

void startServer();