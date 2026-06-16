import multer from "multer";
import path from "path";
import fs from "fs";

const ensureDirectory = (directoryPath: string) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const uploadsRoot = path.join(process.cwd(), "uploads");
const chatTransfersRoot = path.join(uploadsRoot, "chat-transfers");

ensureDirectory(uploadsRoot);
ensureDirectory(chatTransfersRoot);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsRoot);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const upload = multer({ storage });

const chatTransferStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, chatTransfersRoot);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`);
  },
});

export const uploadChatTransfer = multer({
  storage: chatTransferStorage,
  limits: {
    fileSize: 1024 * 1024 * 500,
  },
});