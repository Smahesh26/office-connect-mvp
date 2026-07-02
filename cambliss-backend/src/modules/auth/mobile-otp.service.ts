import crypto from "crypto";

export class MobileOtpError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.name = "MobileOtpError";
		this.statusCode = statusCode;
	}
}

type OtpPurpose = "REGISTER";

type OtpSession = {
	requestId: string;
	phone: string;
	purpose: OtpPurpose;
	otpHash: string;
	expiresAt: number;
	sentAt: number;
	attemptsLeft: number;
	verified: boolean;
};

type SendRegisterOtpResult = {
	requestId: string;
	expiresInSeconds: number;
	resendAfterSeconds: number;
	otp?: string;
};

const OTP_EXPIRY_SECONDS = Number(process.env.MOBILE_OTP_EXPIRY_SECONDS || "300");
const OTP_RESEND_SECONDS = Number(process.env.MOBILE_OTP_RESEND_SECONDS || "60");
const OTP_MAX_ATTEMPTS = Number(process.env.MOBILE_OTP_MAX_ATTEMPTS || "5");
const isJestRuntime = Boolean(process.env.JEST_WORKER_ID);
const defaultOtpEnabled = process.env.NODE_ENV === "test" || isJestRuntime ? "false" : "true";
const OTP_ENABLED = isJestRuntime ? false : (process.env.MOBILE_OTP_ENABLED || defaultOtpEnabled).toLowerCase() === "true";
const OTP_PROVIDER = (process.env.SMS_PROVIDER || "CONSOLE").toUpperCase();
const OTP_PEPPER = process.env.MOBILE_OTP_PEPPER || "officeconnect-mobile-otp-pepper";
const OTP_RETURN_IN_RESPONSE =
	(process.env.MOBILE_OTP_RETURN_IN_RESPONSE || (process.env.NODE_ENV !== "production" ? "true" : "false")).toLowerCase() === "true";

const otpSessions = new Map<string, OtpSession>();
const latestRequestByPhoneAndPurpose = new Map<string, string>();

const toPhoneKey = (phone: string, purpose: OtpPurpose) => `${purpose}:${phone}`;

const normalizePhone = (phone: string) => phone.trim().replace(/\s+/g, "");

const isValidPhone = (phone: string) => /^\+?[1-9]\d{9,14}$/.test(phone);

const hashOtp = (phone: string, otp: string) => {
	return crypto.createHash("sha256").update(`${phone}:${otp}:${OTP_PEPPER}`).digest("hex");
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const cleanupExpired = () => {
	const now = Date.now();
	for (const [requestId, session] of otpSessions.entries()) {
		if (session.expiresAt <= now) {
			otpSessions.delete(requestId);
			const key = toPhoneKey(session.phone, session.purpose);
			if (latestRequestByPhoneAndPurpose.get(key) === requestId) {
				latestRequestByPhoneAndPurpose.delete(key);
			}
		}
	}
};

const sendViaConsole = async (phone: string, otp: string) => {
	console.log(`[MOBILE_OTP][CONSOLE] OTP ${otp} for ${phone}`);
};

const sendViaWebhook = async (phone: string, otp: string) => {
	const webhookUrl = process.env.SMS_WEBHOOK_URL;
	if (!webhookUrl) {
		throw new MobileOtpError(500, "SMS_WEBHOOK_URL is not configured");
	}

	const response = await fetch(webhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			to: phone,
			message: `Your Office Connect OTP is ${otp}. It is valid for ${OTP_EXPIRY_SECONDS / 60} minutes.`,
			otp,
		}),
	});

	if (!response.ok) {
		throw new MobileOtpError(502, "Failed to dispatch OTP SMS");
	}
};

const dispatchOtp = async (phone: string, otp: string) => {
	if (!OTP_ENABLED) {
		return;
	}

	if (OTP_PROVIDER === "WEBHOOK") {
		await sendViaWebhook(phone, otp);
		return;
	}

	await sendViaConsole(phone, otp);
};

export const sendRegisterOtp = async (rawPhone: string): Promise<SendRegisterOtpResult> => {
	cleanupExpired();

	const phone = normalizePhone(rawPhone || "");
	if (!phone || !isValidPhone(phone)) {
		throw new MobileOtpError(400, "Enter a valid mobile number in international format");
	}

	const purpose: OtpPurpose = "REGISTER";
	const key = toPhoneKey(phone, purpose);
	const lastRequestId = latestRequestByPhoneAndPurpose.get(key);
	const lastSession = lastRequestId ? otpSessions.get(lastRequestId) : undefined;
	const now = Date.now();

	if (lastSession && now - lastSession.sentAt < OTP_RESEND_SECONDS * 1000) {
		const waitSeconds = Math.ceil((OTP_RESEND_SECONDS * 1000 - (now - lastSession.sentAt)) / 1000);
		throw new MobileOtpError(429, `Please wait ${waitSeconds}s before requesting a new OTP`);
	}

	const otp = generateOtp();
	const requestId = crypto.randomUUID();
	const session: OtpSession = {
		requestId,
		phone,
		purpose,
		otpHash: hashOtp(phone, otp),
		expiresAt: now + OTP_EXPIRY_SECONDS * 1000,
		sentAt: now,
		attemptsLeft: OTP_MAX_ATTEMPTS,
		verified: false,
	};

	otpSessions.set(requestId, session);
	latestRequestByPhoneAndPurpose.set(key, requestId);

	await dispatchOtp(phone, otp);

	return {
		requestId,
		expiresInSeconds: OTP_EXPIRY_SECONDS,
		resendAfterSeconds: OTP_RESEND_SECONDS,
		...(OTP_RETURN_IN_RESPONSE ? { otp } : {}),
	};
};

export const verifyRegisterOtp = (params: { phone: string; requestId: string; otp: string }) => {
	cleanupExpired();

	const phone = normalizePhone(params.phone || "");
	const requestId = params.requestId?.trim();
	const otp = params.otp?.trim();

	if (!phone || !requestId || !otp) {
		throw new MobileOtpError(400, "phone, requestId and otp are required");
	}

	const session = otpSessions.get(requestId);
	if (!session || session.phone !== phone || session.purpose !== "REGISTER") {
		throw new MobileOtpError(400, "OTP session not found for this phone");
	}

	if (session.expiresAt <= Date.now()) {
		otpSessions.delete(requestId);
		throw new MobileOtpError(400, "OTP expired. Please request a new OTP");
	}

	if (session.attemptsLeft <= 0) {
		otpSessions.delete(requestId);
		throw new MobileOtpError(429, "OTP attempt limit reached. Please request a new OTP");
	}

	if (hashOtp(phone, otp) !== session.otpHash) {
		session.attemptsLeft -= 1;
		otpSessions.set(requestId, session);
		throw new MobileOtpError(400, "Invalid OTP");
	}

	session.verified = true;
	otpSessions.set(requestId, session);

	return { verified: true };
};

export const consumeVerifiedRegisterOtp = (params: { phone: string; requestId: string }) => {
	if (!OTP_ENABLED) {
		return;
	}

	cleanupExpired();

	const phone = normalizePhone(params.phone || "");
	const requestId = params.requestId?.trim();
	if (!phone || !requestId) {
		throw new MobileOtpError(400, "phone and requestId are required");
	}

	const session = otpSessions.get(requestId);
	if (!session || session.phone !== phone || session.purpose !== "REGISTER") {
		throw new MobileOtpError(400, "OTP verification session is invalid");
	}

	if (!session.verified) {
		throw new MobileOtpError(400, "Please verify OTP before completing signup");
	}

	otpSessions.delete(requestId);
	latestRequestByPhoneAndPurpose.delete(toPhoneKey(phone, "REGISTER"));
};

export const isMobileOtpEnabled = () => OTP_ENABLED;
