// Local stand-in for a Supabase project: a fake email sign-in service on
// /auth/v1 (code is always 123456) and the real PostgREST on /rest/v1.
import http from "node:http";
import crypto from "node:crypto";

export const SECRET = "local-test-secret-at-least-32-characters-long";
const USERS = { "me@example.com": "aaaaaaaa-0000-4000-8000-000000000001", "other@example.com": "bbbbbbbb-0000-4000-8000-000000000002" };
const CODE = "123456";
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
export const sign = (payload) => {
  const h = b64({ alg: "HS256", typ: "JWT" }), p = b64(payload);
  return `${h}.${p}.${crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url")}`;
};
const verify = (tok) => {
  const [h, p, s] = (tok || "").split(".");
  if (!s || crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url") !== s) return null;
  return JSON.parse(Buffer.from(p, "base64url").toString());
};
const userFor = (email) => ({ id: USERS[email], aud: "authenticated", role: "authenticated", email, app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-10-01T00:00:00Z" });
const TTL = 3 * 86400; // long, because tests freeze the browser clock
const session = (email) => {
  const now = Math.floor(Date.now() / 1000);
  const user = userFor(email);
  return { access_token: sign({ sub: user.id, email, role: "authenticated", aud: "authenticated", iat: now, exp: now + TTL, session_id: crypto.randomUUID() }), token_type: "bearer", expires_in: TTL, expires_at: now + TTL, refresh_token: `rt-${email}`, user };
};
export const anonKey = sign({ role: "anon", iss: "supabase", iat: 1, exp: 4102444800 });

const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "access-control-expose-headers": "content-range" };
const body = (req) => new Promise((r) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => r(d ? JSON.parse(d) : {})); });
const json = (res, code, o) => { res.writeHead(code, { "content-type": "application/json", ...cors }); res.end(o === undefined ? "" : JSON.stringify(o)); };

export const sent = [];
// Sign-in links (PKCE): the link carries a one-time code that only the
// browser holding the matching verifier can exchange for a session.
const links = new Map(); // auth code -> { email, challenge }
const lastLink = new Map(); // email -> link the email would contain
if (process.argv[2] === "--anon") {
  console.log(anonKey);
  process.exit(0);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  if (url.pathname.startsWith("/rest/v1/")) {
    const up = http.request({ host: "127.0.0.1", port: Number(process.env.PGRST_PORT || 54330), path: req.url.slice("/rest/v1".length), method: req.method, headers: { ...req.headers, host: `127.0.0.1:${process.env.PGRST_PORT || 54330}` } }, (r) => { res.writeHead(r.statusCode, { ...r.headers, ...cors }); r.pipe(res); });
    return req.pipe(up);
  }
  const p = url.pathname.replace(/^\/auth\/v1/, "");
  if (p === "/__test/link") return json(res, 200, { link: lastLink.get(url.searchParams.get("email")) || null });
  if (p === "/otp" && req.method === "POST") { const b = await body(req); sent.push(b.email);
    if (b.code_challenge) { const code = crypto.randomUUID(); links.set(code, { email: b.email, challenge: b.code_challenge }); lastLink.set(b.email, `${url.searchParams.get("redirect_to")}?code=${code}`); } console.log("OTP requested for", b.email); return USERS[b.email] ? json(res, 200, {}) : json(res, 422, { code: 422, error_code: "signup_disabled", msg: "Signups not allowed" }); }
  if (p === "/verify" && req.method === "POST") { const b = await body(req); return b.token === CODE && USERS[b.email] ? json(res, 200, session(b.email)) : json(res, 403, { code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" }); }
  if (p === "/token" && url.searchParams.get("grant_type") === "pkce") {
    const b = await body(req); const l = links.get(b.auth_code); links.delete(b.auth_code);
    const ok = l && crypto.createHash("sha256").update(b.code_verifier || "").digest("base64url") === l.challenge;
    return ok ? json(res, 200, session(l.email)) : json(res, 400, { code: 400, error_code: "bad_code_verifier", msg: "code challenge does not match previously saved code verifier" });
  }
  if (p === "/token") { const b = await body(req); const email = String(b.refresh_token || "").replace(/^rt-/, ""); return USERS[email] ? json(res, 200, session(email)) : json(res, 400, { error: "invalid_grant" }); }
  if (p === "/user") { const c = verify((req.headers.authorization || "").replace(/^Bearer /, "")); return c?.email ? json(res, 200, userFor(c.email)) : json(res, 401, { code: 401, msg: "invalid JWT" }); }
  if (p === "/logout") return json(res, 204);
  if (p === "/.well-known/jwks.json") return json(res, 200, { keys: [] });
  console.log("unhandled", req.method, req.url);
  json(res, 404, { msg: "not found" });
}).listen(Number(process.env.FAKE_PORT || 54321), () => console.log("fake supabase listening"));
