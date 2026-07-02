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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebasePhoneToken = exports.isFirebaseOtpEnabled = void 0;
const isJestRuntime = Boolean(process.env.JEST_WORKER_ID);
const auth_service_1 = require("./auth.service");
const getFirebaseProjectId = () => process.env.FIREBASE_PROJECT_ID;
const getFirebaseClientEmail = () => process.env.FIREBASE_CLIENT_EMAIL;
const getFirebasePrivateKey = () => { var _a; return (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, "\n"); };
let firebaseAdminAppModule = null;
let firebaseAdminAuthModule = null;
const getFirebaseAppModule = () => {
    if (!firebaseAdminAppModule) {
        firebaseAdminAppModule = require("firebase-admin/app");
    }
    return firebaseAdminAppModule;
};
const getFirebaseAuthModule = () => {
    if (!firebaseAdminAuthModule) {
        firebaseAdminAuthModule = require("firebase-admin/auth");
    }
    return firebaseAdminAuthModule;
};
const ensureFirebaseAdmin = () => {
    const { getApps, initializeApp, cert } = getFirebaseAppModule();
    if (getApps().length > 0) {
        return;
    }
    const projectId = getFirebaseProjectId();
    const clientEmail = getFirebaseClientEmail();
    const privateKey = getFirebasePrivateKey();
    if (!projectId || !clientEmail || !privateKey) {
        throw new auth_service_1.AuthError(500, "Firebase auth is not configured");
    }
    initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
};
const isFirebaseOtpEnabled = () => {
    if (isJestRuntime) {
        return false;
    }
    return (process.env.AUTH_OTP_PROVIDER || "LOCAL").toUpperCase() === "FIREBASE";
};
exports.isFirebaseOtpEnabled = isFirebaseOtpEnabled;
const verifyFirebasePhoneToken = (idToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, exports.isFirebaseOtpEnabled)()) {
        throw new auth_service_1.AuthError(400, "Firebase OTP is not enabled");
    }
    const token = idToken === null || idToken === void 0 ? void 0 : idToken.trim();
    if (!token) {
        throw new auth_service_1.AuthError(400, "Firebase ID token is required");
    }
    ensureFirebaseAdmin();
    const { getAuth } = getFirebaseAuthModule();
    const decoded = yield getAuth().verifyIdToken(token);
    if (!decoded.phone_number) {
        throw new auth_service_1.AuthError(400, "Firebase token does not contain a verified phone number");
    }
    return {
        phoneNumber: decoded.phone_number,
        uid: decoded.uid,
    };
});
exports.verifyFirebasePhoneToken = verifyFirebasePhoneToken;
