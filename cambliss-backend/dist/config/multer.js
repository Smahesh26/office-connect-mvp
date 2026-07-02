"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadChatTransfer = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ensureDirectory = (directoryPath) => {
    if (!fs_1.default.existsSync(directoryPath)) {
        fs_1.default.mkdirSync(directoryPath, { recursive: true });
    }
};
const uploadsRoot = path_1.default.join(process.cwd(), "uploads");
const chatTransfersRoot = path_1.default.join(uploadsRoot, "chat-transfers");
ensureDirectory(uploadsRoot);
ensureDirectory(chatTransfersRoot);
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsRoot);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
exports.upload = (0, multer_1.default)({ storage });
const chatTransferStorage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, chatTransfersRoot);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`);
    },
});
exports.uploadChatTransfer = (0, multer_1.default)({
    storage: chatTransferStorage,
    limits: {
        fileSize: 1024 * 1024 * 500,
    },
});
