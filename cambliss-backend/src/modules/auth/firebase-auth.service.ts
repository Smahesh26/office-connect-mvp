const isJestRuntime = Boolean(process.env.JEST_WORKER_ID);
import { AuthError } from "./auth.service";

const getFirebaseProjectId = () => process.env.FIREBASE_PROJECT_ID;
const getFirebaseClientEmail = () => process.env.FIREBASE_CLIENT_EMAIL;
const getFirebasePrivateKey = () => process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

type FirebaseAdminAppModule = typeof import("firebase-admin/app");
type FirebaseAdminAuthModule = typeof import("firebase-admin/auth");

let firebaseAdminAppModule: FirebaseAdminAppModule | null = null;
let firebaseAdminAuthModule: FirebaseAdminAuthModule | null = null;

const getFirebaseAppModule = () => {
	if (!firebaseAdminAppModule) {
		firebaseAdminAppModule = require("firebase-admin/app") as FirebaseAdminAppModule;
	}

	return firebaseAdminAppModule;
};

const getFirebaseAuthModule = () => {
	if (!firebaseAdminAuthModule) {
		firebaseAdminAuthModule = require("firebase-admin/auth") as FirebaseAdminAuthModule;
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
		throw new AuthError(500, "Firebase auth is not configured");
	}

	initializeApp({
		credential: cert({
			projectId,
			clientEmail,
			privateKey,
		}),
	});
};

export const isFirebaseOtpEnabled = () => {
	if (isJestRuntime) {
		return false;
	}

	return (process.env.AUTH_OTP_PROVIDER || "LOCAL").toUpperCase() === "FIREBASE";
};

export const verifyFirebasePhoneToken = async (idToken: string) => {
	if (!isFirebaseOtpEnabled()) {
		throw new AuthError(400, "Firebase OTP is not enabled");
	}

	const token = idToken?.trim();
	if (!token) {
		throw new AuthError(400, "Firebase ID token is required");
	}

	ensureFirebaseAdmin();
	const { getAuth } = getFirebaseAuthModule();
	const decoded = await getAuth().verifyIdToken(token);
	if (!decoded.phone_number) {
		throw new AuthError(400, "Firebase token does not contain a verified phone number");
	}

	return {
		phoneNumber: decoded.phone_number,
		uid: decoded.uid,
	};
};
