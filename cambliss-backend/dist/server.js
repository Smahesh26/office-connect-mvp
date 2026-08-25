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
require("dotenv/config");
const http_1 = require("http");
const index_1 = __importDefault(require("./index"));
const chat_socket_1 = require("./modules/chat/chat.socket");
const chat_files_service_1 = require("./modules/chat/chat-files.service");
const subscription_service_1 = require("./modules/subscription/subscription.service");
const port = Number(process.env.PORT) || 5000;
const httpServer = (0, http_1.createServer)(index_1.default);
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    httpServer.listen(port, "0.0.0.0", () => {
        console.log(`Cambliss backend server running on http://0.0.0.0:${port}`);
    });
    try {
        yield (0, chat_socket_1.initChatSocket)(httpServer);
    }
    catch (error) {
        console.error("[startup] chat socket init warning:", error);
    }
    try {
        (0, chat_files_service_1.startChatTransferCleanupJob)();
        (0, subscription_service_1.startTrialReminderJob)();
    }
    catch (error) {
        console.error("[startup] background jobs warning:", error);
    }
});
void startServer();
