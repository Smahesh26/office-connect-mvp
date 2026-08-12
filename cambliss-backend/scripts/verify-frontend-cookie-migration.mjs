// Simulates the migrated frontend: real JWT only in httpOnly cookie, while the
// client still sends a placeholder "Bearer cookie-session" header. Verifies the
// cookie authenticates and the placeholder header does not break auth.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("dotenv").config();

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const email = process.env.SUPER_ADMIN_EMAIL || process.env.DEMO_ADMIN_EMAIL || "";
const password = process.env.SUPER_ADMIN_PASSWORD || "";

const main = async () => {
	if (!email || !password) {
		console.log("SKIP: no admin creds in .env");
		return;
	}

	const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	console.log(`login: ${loginRes.status}`);

	const rawCookie = loginRes.headers.get("set-cookie") || "";
	const match = rawCookie.match(/authToken=([^;]+)/i);
	const cookie = match ? `authToken=${match[1]}` : "";
	console.log(`cookie captured: ${cookie ? "yes" : "no"}`);

	// Frontend now sends a placeholder bearer + the browser auto-sends the cookie.
	const withPlaceholder = await fetch(`${BASE_URL}/api/tools/daily-catalog`, {
		headers: { Authorization: "Bearer cookie-session", Cookie: cookie },
	});
	console.log(`placeholder-bearer + cookie -> daily-catalog: ${withPlaceholder.status}`);

	// Cookie only (no auth header at all).
	const cookieOnly = await fetch(`${BASE_URL}/api/tools/daily-catalog`, { headers: { Cookie: cookie } });
	console.log(`cookie only -> daily-catalog: ${cookieOnly.status}`);

	// Logout should clear the cookie.
	const logout = await fetch(`${BASE_URL}/api/auth/logout`, { method: "POST", headers: { Cookie: cookie } });
	console.log(`logout: ${logout.status}`);
};

main().catch((e) => console.error(e));
