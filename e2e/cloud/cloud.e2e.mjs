// End-to-end test of cloud mode: sign-in, upload, reload from the cloud,
// row-level isolation, a second device, offline saving and sign-out.
// Run through e2e/cloud/run.sh, which starts the database, API and app.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const APP = process.env.APP_URL || "http://localhost:3128";
const HERE = new URL(".", import.meta.url).pathname;
const OUT = process.env.SCREENSHOTS || null;
const U1 = "aaaaaaaa-0000-4000-8000-000000000001";
const sql = (q) => execSync(`psql -Atc "${q}"`).toString().trim();
const baseline = JSON.parse(readFileSync(`${HERE}../baseline.json`, "utf8"));
const seed = JSON.parse(readFileSync(`${HERE}seed.json`, "utf8"));
let passed = 0, failed = 0;
const check = (name, ok, extra = "") => { ok ? passed++ : failed++; console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? "  " + extra : ""}`); };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
async function device() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "UTC", locale: "en-US" });
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|ERR_INTERNET_DISCONNECTED/.test(m.text()) && page.errors.push(m.text()));
  await page.clock.setFixedTime(new Date("2026-10-07T12:00:00"));
  return { ctx, page };
}
async function signIn(page, email, code = "123456") {
  await page.goto(APP + "/");
  await page.waitForURL("**/login");
  await page.fill('input[type=email]', email);
  await page.click("button:has-text('Email me a code')");
  await page.waitForSelector("input[autocomplete=one-time-code]");
  await page.fill("input[autocomplete=one-time-code]", code);
  await page.click("button:has-text('Continue')");
}
const PIN = "135790";
const typePin = async (page, pin = PIN) => {
  for (const d of pin) await page.click(`#lock button[data-lk="${d}"]`);
};
const lockTitle = (page) => page.$eval("#lock", (e) => (e.hidden ? "" : e.querySelector("h2")?.textContent || ""));
/** Get past the PIN screen: choose a PIN on a newly confirmed device, else enter it. */
async function getPastPin(page) {
  await page.waitForSelector("#app *");
  await page.waitForTimeout(200);
  const t = await lockTitle(page);
  if (t.startsWith("Choose")) {
    await typePin(page);
    await typePin(page);
  } else if (t.startsWith("Enter your PIN")) await typePin(page);
  await page.waitForFunction(() => document.getElementById("lock").hidden);
}
const go = (page, v) => page.evaluate((v) => { const b = document.createElement("button"); b.dataset.go = v; document.getElementById("app").appendChild(b); b.click(); b.remove(); }, v);
const saved = (page) => page.waitForFunction(() => document.getElementById("syncPill")?.dataset.s === "saved", null, { timeout: 15000 });
const appHTML = (page) => page.$eval("#app", (e) => e.innerHTML);
// Change this device's stored copy while the app isn't running (leaving the app saves it).
async function setDeviceCopy(page, value) {
  await page.goto(APP + "/robots.txt");
  await page.evaluate(([uid, v]) => (v === null ? localStorage.removeItem(`ledger-cloud:${uid}`) : localStorage.setItem(`ledger-cloud:${uid}`, JSON.stringify(v))), [U1, value]);
  await page.goto(APP + "/");
}

sql("truncate accounts, categories, fixed_costs, goals, entries, snapshots, settings");

// 1. sign-in
const A = await device();
await A.page.goto(APP + "/");
check("signed-out visitor is sent to /login", A.page.url().endsWith("/login"));
await A.page.waitForTimeout(600); if (OUT) await A.page.screenshot({ path: `${OUT}/cloud-login.png` });
await signIn(A.page, "me@example.com", "000000");
await A.page.waitForSelector("text=That code didn’t work");
check("wrong code is rejected", A.page.url().endsWith("/login"));
await A.page.fill("input[autocomplete=one-time-code]", "123456");
await A.page.click("button:has-text('Continue')");
await A.page.waitForURL(APP + "/");
await A.page.waitForSelector("#app *");
await A.page.waitForTimeout(200);
check("a newly confirmed device must choose a PIN", (await lockTitle(A.page)).startsWith("Choose a 6-digit PIN"));
check("…with no way to skip it", (await A.page.$$("#lock [data-lka=cancel]")).length === 0);
await typePin(A.page, "111111");
check("too-easy PINs are refused", (await A.page.$eval("#lock", (e) => e.textContent)).includes("too easy"));
await getPastPin(A.page);
await saved(A.page);
check("new account opens setup", (await appHTML(A.page)).includes("Set"), "");
check("new account gets a settings row", sql(`select count(*) from settings where user_id='${U1}'`) === "1");
if (OUT) await A.page.screenshot({ path: `${OUT}/cloud-setup.png` });

// 2. a device with unsent changes (157 sample entries) uploads them
await setDeviceCopy(A.page, { state: { ...seed, view: "home" }, pending: true, rev: "" });
await getPastPin(A.page);
await saved(A.page);
check("all entries uploaded", sql(`select count(*) from entries where user_id='${U1}'`) === String(seed.tx.length), sql(`select count(*) from entries`));
check("accounts uploaded with exact balances", sql(`select balance from accounts where user_id='${U1}' and id='a1'`) === seed.accounts.find((a) => a.id === "a1").balance.toFixed(2));
check("goal order kept", sql(`select string_agg(id, ',' order by position) from goals`) === seed.goals.map((g) => g.id).join(","));

// 3. a fresh load comes entirely from the cloud and renders identically to the original app
await setDeviceCopy(A.page, null);
await getPastPin(A.page);
await A.page.waitForTimeout(300);
for (const v of ["home", "trends", "goals", "activity", "accounts", "config"]) {
  if (v !== "home") await go(A.page, v);
  await A.page.waitForTimeout(150);
  let html = await appHTML(A.page);
  const noSecurity = (h) => h.replace(/<h2 id="secsec">[\s\S]*?<\/div>\s*<\/div>\s*(?=<h2)/, "");
  if (v === "config") html = noSecurity(html).replace(/<p class="sub"[^>]*>Your data is saved[\s\S]*?<\/p>/, "").replace(/<p class="sub"[^>]*>This is a demo[\s\S]*?<button class="btn ghost full" id="reset">Reset sample data<\/button>/, "");
  let base = baseline[v];
  if (v === "config") base = noSecurity(base).replace(/<p class="sub"[^>]*>This is a demo[\s\S]*?<button class="btn ghost full" id="reset">Reset sample data<\/button>/, "");
  // Expected differences: setting the PIN ticks a getting-started step and writes change-log entries.
  const known = (h) =>
    h
      .replace(/\s+/g, " ")
      .replace(/<section class="dcard dc-start">[\s\S]*?<\/section>/, "GETTING STARTED")
      .replace(/\d+ changes? recorded/, "N changes recorded");
  const same = known(html) === known(base);
  if (!same && process.env.DUMP) (await import("node:fs")).writeFileSync(`${process.env.DUMP}/cloud-${v}.html`, html);
  check(`cloud-loaded "${v}" screen matches the original`, same);
}
await go(A.page, "home");

// 4. logging an expense saves just that change
await A.page.click("#addBtn");
for (const k of ["1", "2", ".", "5"]) await A.page.click(`#sheet button[data-k="${k}"]`);
await A.page.click("#aSave");
await saved(A.page);
check("new expense saved to the cloud", sql(`select count(*) from entries where user_id='${U1}'`) === String(seed.tx.length + 1));
check("its amount is exact", sql(`select amount from entries where user_id='${U1}' order by updated_at desc limit 1`) === "12.50");
check("new ids are random UUIDs", /^i[0-9a-f]{32}$/.test(sql(`select id from entries where user_id='${U1}' order by updated_at desc limit 1`)));

// 5. another user sees none of it
const B = await device();
await signIn(B.page, "other@example.com");
await B.page.waitForURL(APP + "/");
await getPastPin(B.page);
await saved(B.page);
check("second user starts empty (RLS)", !(await appHTML(B.page)).includes("Publix"));
check("second user's rows are separate", sql(`select count(*) from entries where user_id<>'${U1}'`) === "0");

// 6. a second device for the same user sees everything, and picks up later changes
const C = await device();
await signIn(C.page, "me@example.com");
await C.page.waitForURL(APP + "/");
await getPastPin(C.page);
await go(C.page, "activity");
check("second device loads the same data", (await appHTML(C.page)).includes("12.50"));
await A.page.click("#addBtn");
for (const k of ["7"]) await A.page.click(`#sheet button[data-k="${k}"]`);
await A.page.click("#aSave");
await saved(A.page);
await C.page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
await C.page.waitForTimeout(1000); // the phone sits in a pocket for a moment
await C.page.clock.setFixedTime(new Date("2026-10-07T12:01:00"));
const reloaded = C.page.waitForEvent("load", { timeout: 10000 }).then(() => true, () => false);
await C.page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
check("second device reloads when it comes back after another device saved", await reloaded);
check("…and asks for the PIN again", (await (async () => { await C.page.waitForSelector("#app *"); await C.page.waitForTimeout(200); return lockTitle(C.page); })()).startsWith("Enter your PIN"));
await getPastPin(C.page);
await go(C.page, "activity");
check("…and shows the new entry", (await appHTML(C.page)).includes("$7.00"));

// 7. offline: kept on the device, uploaded when back online
await A.ctx.setOffline(true);
await A.page.click("#addBtn");
for (const k of ["3"]) await A.page.click(`#sheet button[data-k="${k}"]`);
await A.page.click("#aSave");
await A.page.waitForFunction(() => ["offline", "error"].includes(document.getElementById("syncPill")?.dataset.s), null, { timeout: 15000 });
check("offline change shows a warning", true, await A.page.$eval("#syncPill", (e) => e.textContent));
if (OUT) await A.page.screenshot({ path: `${OUT}/cloud-offline.png` });
check("offline change kept on device as pending", await A.page.evaluate((uid) => JSON.parse(localStorage.getItem(`ledger-cloud:${uid}`)).pending, U1));
const before = sql(`select count(*) from entries where user_id='${U1}'`);
await A.ctx.setOffline(false);
await saved(A.page);
check("uploaded once back online", Number(sql(`select count(*) from entries where user_id='${U1}'`)) === Number(before) + 1);

// 8. PIN rules: can't be turned off; 5 wrong tries signs the device out
await go(C.page, "config");
check("settings can't turn the PIN off", !(await appHTML(C.page)).includes('data-act="pinOff"'));
await C.page.reload();
await C.page.waitForSelector("#app *");
await C.page.waitForTimeout(200);
for (let i = 0; i < 5; i++) await typePin(C.page, "246802");
check("5 wrong PINs lock the device out", (await lockTitle(C.page)).includes("signed out"));
await C.page.click("#lock [data-lka=send]");
await C.page.waitForURL("**/login");
check("…and confirming email again is the way back in", true);
await signIn(C.page, "me@example.com");
await C.page.waitForURL(APP + "/");
await C.page.waitForSelector("#app *");
await C.page.waitForTimeout(200);
check("…after which a new PIN is chosen", (await lockTitle(C.page)).startsWith("Choose"));
await getPastPin(C.page);

// 9. sign out
await A.page.click("[data-menu]");
check("menu shows who is signed in", (await appHTML(A.page)).includes("me@example.com"));
if (OUT) await A.page.screenshot({ path: `${OUT}/cloud-menu.png` });
await A.page.click("[data-signout]");
await A.page.waitForURL("**/login");
check("sign out returns to /login", true);
check("sign out clears this device's copy", await A.page.evaluate((uid) => localStorage.getItem(`ledger-cloud:${uid}`) === null, U1));
await A.page.goto(APP + "/");
check("signed-out device can't open the app", A.page.url().endsWith("/login"));

for (const [n, d] of [["A", A], ["B", B], ["C", C]]) check(`no page errors on device ${n}`, d.page.errors.length === 0, d.page.errors.slice(0, 3).join(" | "));
console.log(`\n${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
