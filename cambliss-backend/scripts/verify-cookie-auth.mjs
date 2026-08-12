// One-off: verifies login issues an httpOnly auth cookie and that the
// server-issued token authorizes both Bearer and Cookie transports.
// Reads credentials from .env; never prints secrets.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("dotenv").config();

const BASE_URL = (process.env.BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const email = process.env.SUPER_ADMIN_EMAIL || process.env.DEMO_ADMIN_EMAIL || "";
const password = process.env.SUPER_ADMIN_PASSWORD || "";

const main = async () => {
	if (!email || !password) {
		console.log("SKIP: no admin credentials in .env (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD)");
		return;
	}

	const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});

	console.log(`login status: ${loginRes.status}`);
	const setCookie = loginRes.headers.get("set-cookie") || "";
	const cookieRedacted = setCookie.replace(/authToken=[^;]+/i, "authToken=<redacted>");
	console.log(`set-cookie: ${cookieRedacted || "(none)"}`);
	console.log(`  httpOnly: ${/httponly/i.test(setCookie)}  sameSite=Strict: ${/samesite=strict/i.test(setCookie)}`);

	if (loginRes.status !== 200) {
		console.log("login failed; cannot continue transport checks");
		return;
	}

	const body = await loginRes.json();
	const token = body?.token;
	if (!token) {
		console.log("no token in login body");
		return;
	}

	const bearer = await fetch(`${BASE_URL}/api/tools/daily-catalog`, { headers: { Authorization: `Bearer ${token}` } });
	console.log(`bearer -> daily-catalog: ${bearer.status}`);

	const cookie = await fetch(`${BASE_URL}/api/tools/daily-catalog`, { headers: { Cookie: `authToken=${token}` } });
	console.log(`cookie -> daily-catalog: ${cookie.status}`);
};

main().catch((e) => console.error(e));
