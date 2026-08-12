/**
 * OWASP / Burp-style automated security probe for the OfficeConnect backend.
 *
 * Read-only, non-destructive checks against a locally running instance.
 * Usage:
 *   node scripts/security-probe.mjs                 # defaults to http://localhost:4000
 *   BASE_URL=http://localhost:4000 node scripts/security-probe.mjs
 *   PROBE_TOKEN=<jwt> node scripts/security-probe.mjs   # enables authenticated checks
 *
 * It NEVER attempts real exploitation or data modification.
 */

const BASE_URL = (process.env.BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const TOKEN = process.env.PROBE_TOKEN || "";

// Load JWT_SECRET locally (self-test only) to mint tokens for authenticated /
// authorization probes. Never printed. Falls back gracefully if unavailable.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
	require("dotenv").config({ path: join(__dirname, "..", ".env") });
} catch {
	// dotenv not resolvable; login-based checks will be skipped
}

const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || process.env.DEMO_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "";

const results = [];
const record = (id, name, status, detail) => {
	results.push({ id, name, status, detail });
};

const PASS = "PASS";
const FAIL = "FAIL";
const WARN = "WARN";
const INFO = "INFO";

const safeFetch = async (path, init = {}) => {
	try {
		const res = await fetch(`${BASE_URL}${path}`, init);
		return res;
	} catch (error) {
		return { networkError: error?.message || String(error) };
	}
};

// --- A05: Security headers (helmet) -------------------------------------
const checkSecurityHeaders = async () => {
	const res = await safeFetch("/api/tools/daily-catalog");
	if (res.networkError) {
		record("A05-headers", "Security headers (helmet)", FAIL, `No response: ${res.networkError}`);
		return;
	}
	const expected = [
		"content-security-policy",
		"x-content-type-options",
		"x-frame-options",
		"strict-transport-security",
	];
	const missing = expected.filter((h) => !res.headers.get(h));
	if (missing.length === 0) {
		record("A05-headers", "Security headers (helmet)", PASS, "CSP, nosniff, frame-options, HSTS all present");
	} else {
		record("A05-headers", "Security headers (helmet)", missing.length === expected.length ? FAIL : WARN, `Missing: ${missing.join(", ")}`);
	}
	// X-Powered-By should be hidden by helmet
	if (res.headers.get("x-powered-by")) {
		record("A05-powered-by", "X-Powered-By hidden", WARN, `Leaks: ${res.headers.get("x-powered-by")}`);
	} else {
		record("A05-powered-by", "X-Powered-By hidden", PASS, "Header not exposed");
	}
};

// --- A01: Tools endpoints require authentication ------------------------
const checkToolsAuth = async () => {
	const endpoints = [
		["/api/tools/daily-catalog", "GET"],
		["/api/tools/currency/convert?amount=1&from=USD&to=INR", "GET"],
	];
	for (const [path, method] of endpoints) {
		const res = await safeFetch(path, { method });
		if (res.networkError) {
			record(`A01-${path}`, `Unauth blocked: ${path}`, FAIL, res.networkError);
			continue;
		}
		if (res.status === 401) {
			record(`A01-${path}`, `Unauth blocked: ${path}`, PASS, "Returns 401 without token");
		} else {
			record(`A01-${path}`, `Unauth blocked: ${path}`, FAIL, `Expected 401, got ${res.status}`);
		}
	}
};

// --- A02/A07: JWT tampering ---------------------------------------------
const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const checkJwtTampering = async () => {
	const forgedClaims = { id: "attacker", email: "a@a.com", organizationId: "victim-org", role: "SUPER_ADMIN" };
	const cases = [
		["alg:none forged", `${b64url({ alg: "none", typ: "JWT" })}.${b64url(forgedClaims)}.`],
		["garbage token", "not.a.jwt"],
		["empty bearer", ""],
	];
	for (const [label, token] of cases) {
		const res = await safeFetch("/api/tools/daily-catalog", {
			headers: token ? { Authorization: `Bearer ${token}` } : { Authorization: "Bearer " },
		});
		if (res.networkError) {
			record(`A02-${label}`, `JWT rejected: ${label}`, FAIL, res.networkError);
			continue;
		}
		if (res.status === 401) {
			record(`A02-${label}`, `JWT rejected: ${label}`, PASS, "Rejected with 401");
		} else {
			record(`A02-${label}`, `JWT rejected: ${label}`, FAIL, `Accepted/other: ${res.status}`);
		}
	}
};

// --- A05: CORS reflection -----------------------------------------------
const checkCors = async () => {
	const res = await safeFetch("/api/tools/daily-catalog", {
		headers: { Origin: "https://evil.example.com" },
	});
	if (res.networkError) {
		record("A05-cors", "CORS does not reflect arbitrary origin", INFO, res.networkError);
		return;
	}
	const acao = res.headers.get("access-control-allow-origin");
	if (acao === "https://evil.example.com") {
		record("A05-cors", "CORS does not reflect arbitrary origin", FAIL, "Reflects evil origin with credentials");
	} else {
		record("A05-cors", "CORS does not reflect arbitrary origin", PASS, `ACAO=${acao ?? "(none)"}`);
	}
};

// --- A04: Rate limiting on tools ----------------------------------------
const checkRateLimit = async () => {
	let sawLimit = false;
	let count = 0;
	for (let i = 0; i < 45; i++) {
		const res = await safeFetch("/api/tools/daily-catalog");
		count++;
		if (!res.networkError && res.status === 429) {
			sawLimit = true;
			break;
		}
	}
	if (sawLimit) {
		record("A04-ratelimit", "Tools rate limiting active", PASS, `429 after ~${count} requests`);
	} else {
		record("A04-ratelimit", "Tools rate limiting active", WARN, `No 429 within ${count} requests (limit may be higher)`);
	}
};

// --- A05/A09: Error handling does not leak stack traces -----------------
const checkErrorLeak = async () => {
	const res = await safeFetch("/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: "{ this is : not valid json",
	});
	if (res.networkError) {
		record("A05-errorleak", "No stack trace on bad input", INFO, res.networkError);
		return;
	}
	const text = await res.text();
	if (/at\s+\w+.*\(.*\.(ts|js):\d+:\d+\)/.test(text) || text.includes("node_modules")) {
		record("A05-errorleak", "No stack trace on bad input", FAIL, "Response contains a stack trace");
	} else {
		record("A05-errorleak", "No stack trace on bad input", PASS, `Status ${res.status}, no stack trace leaked`);
	}
};

// --- A07: Auth login rate limiting (bogus creds only) -------------------
const checkLoginRateLimit = async () => {
	let sawLimit = false;
	let count = 0;
	for (let i = 0; i < 15; i++) {
		const res = await safeFetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: `probe${i}@invalid.test`, password: "wrong-password" }),
		});
		count++;
		if (!res.networkError && res.status === 429) {
			sawLimit = true;
			break;
		}
	}
	if (sawLimit) {
		record("A07-loginlimit", "Login brute-force throttled", PASS, `429 after ~${count} attempts`);
	} else {
		record("A07-loginlimit", "Login brute-force throttled", WARN, `No 429 within ${count} attempts`);
	}
};

// --- Authenticated checks (only if PROBE_TOKEN provided) -----------------
const checkAuthenticated = async () => {
	if (!TOKEN) {
		record("auth-note", "Authenticated checks (IDOR etc.)", INFO, "Set PROBE_TOKEN=<jwt> to enable IDOR / access-control probes");
		return;
	}
	const res = await safeFetch("/api/tools/daily-catalog", { headers: { Authorization: `Bearer ${TOKEN}` } });
	if (res.networkError) {
		record("auth-valid", "Valid token accepted", FAIL, res.networkError);
		return;
	}
	record("auth-valid", "Valid token accepted", res.status === 200 ? PASS : WARN, `Status ${res.status}`);
};

// --- Cookie auth transport works (new httpOnly cookie) -------------------
const loginForToken = async (email, password) => {
	if (!email || !password) return null;
	const res = await safeFetch("/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	if (res.networkError || res.status !== 200) return null;
	const body = await res.json().catch(() => null);
	return body?.token || null;
};

const checkCookieAuth = async () => {
	const token = await loginForToken(ADMIN_EMAIL, ADMIN_PASSWORD);
	if (!token) {
		record("cookie-auth", "Cookie-based auth accepted", INFO, "No admin creds in .env or login failed; skipped");
		return;
	}
	const res = await safeFetch("/api/tools/daily-catalog", { headers: { Cookie: `authToken=${token}` } });
	if (res.networkError) {
		record("cookie-auth", "Cookie-based auth accepted", FAIL, res.networkError);
		return;
	}
	record("cookie-auth", "Cookie-based auth accepted", res.status === 200 ? PASS : FAIL, `authToken cookie -> ${res.status}`);
};

// --- A01: Role-based authorization (privilege escalation) ----------------
const checkPrivilegeEscalation = async () => {
	const lowEmail = process.env.PROBE_LOWPRIV_EMAIL || "";
	const lowPassword = process.env.PROBE_LOWPRIV_PASSWORD || "";
	const token = await loginForToken(lowEmail, lowPassword);
	if (!token) {
		record("A01-privesc", "Non-admin blocked from admin route", INFO, "Set PROBE_LOWPRIV_EMAIL/PASSWORD (a non-admin account) to test");
		return;
	}
	const res = await safeFetch("/api/admin/plans", { headers: { Authorization: `Bearer ${token}` } });
	if (res.networkError) {
		record("A01-privesc", "Non-admin blocked from admin route", FAIL, res.networkError);
		return;
	}
	if (res.status === 401 || res.status === 403) {
		record("A01-privesc", "Non-admin blocked from admin route", PASS, `non-admin -> /api/admin/plans = ${res.status}`);
	} else {
		record("A01-privesc", "Non-admin blocked from admin route", FAIL, `non-admin reached admin route: ${res.status}`);
	}
};

// --- A01: IDOR template (requires operator-supplied victim path) ----------
const checkIdorTemplate = async () => {
	const victimPath = process.env.PROBE_IDOR_PATH;
	if (!TOKEN || !victimPath) {
		record("A01-idor", "Cross-tenant IDOR (template)", INFO, "Set PROBE_TOKEN + PROBE_IDOR_PATH=/api/... (another tenant's resource) to test");
		return;
	}
	const res = await safeFetch(victimPath, { headers: { Authorization: `Bearer ${TOKEN}` } });
	if (res.networkError) {
		record("A01-idor", "Cross-tenant IDOR (template)", FAIL, res.networkError);
		return;
	}
	if (res.status === 403 || res.status === 404) {
		record("A01-idor", "Cross-tenant IDOR (template)", PASS, `Foreign resource denied: ${res.status}`);
	} else {
		record("A01-idor", "Cross-tenant IDOR (template)", FAIL, `Foreign resource returned ${res.status} - verify it is not another tenant's data`);
	}
};

const main = async () => {
	console.log(`\nOfficeConnect security probe -> ${BASE_URL}\n${"=".repeat(60)}`);
	await checkSecurityHeaders();
	await checkToolsAuth();
	await checkJwtTampering();
	await checkCors();
	await checkErrorLeak();
	// Login-based checks first, before the login rate-limit test throttles the bucket.
	await checkCookieAuth();
	await checkPrivilegeEscalation();
	await checkIdorTemplate();
	await checkAuthenticated();
	await checkLoginRateLimit();
	await checkRateLimit();

	const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
	let fails = 0;
	let warns = 0;
	for (const r of results) {
		if (r.status === FAIL) fails++;
		if (r.status === WARN) warns++;
		console.log(`${pad(r.status, 5)} | ${pad(r.name, 42)} | ${r.detail}`);
	}
	console.log("=".repeat(60));
	console.log(`Summary: ${results.length} checks, ${fails} FAIL, ${warns} WARN\n`);
	process.exit(fails > 0 ? 1 : 0);
};

main();
