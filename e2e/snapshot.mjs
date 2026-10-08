// Regression check: renders every screen with a frozen clock and fixed
// randomness and compares the HTML with e2e/baseline.json. Any difference
// means something visible changed.
//   npm run e2e -- http://localhost:3000            compare with the baseline
//   npm run e2e -- http://localhost:3000 --update   accept changes as the new baseline
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const update = args.includes("--update");
const url = args.find((a) => !a.startsWith("--")) || "http://localhost:3000";
const baselinePath = new URL("./baseline.json", import.meta.url);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, timezoneId: "UTC", locale: "en-US", reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.clock.setFixedTime(new Date("2026-10-07T12:00:00"));
await page.addInitScript(() => {
  let s = 42;
  Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  try { localStorage.clear(); } catch {}
});
await page.goto(url);
await page.waitForSelector("#app *");

const shots = {};
const grab = async (name) => {
  await page.waitForTimeout(150);
  shots[name] = await page.$eval("#app", (el) => el.innerHTML);
};
const go = (view) =>
  page.evaluate((v) => {
    const b = document.createElement("button");
    b.dataset.go = v;
    document.getElementById("app").appendChild(b);
    b.click();
    b.remove();
  }, view);

await grab("home");
await page.click("[data-dashmore]");
await grab("home-more");
for (const v of ["trends", "goals", "activity", "accounts", "close", "config", "help", "guide", "unassigned", "log"]) {
  await go(v);
  await grab(v);
}

// Log a $12.50 food expense and re-check the screens that depend on it.
await go("home");
await page.click("#addBtn");
for (const k of ["1", "2", ".", "5"]) await page.click(`#sheet button[data-k="${k}"]`);
await page.click("#aSave");
await page.waitForTimeout(400);
await grab("home-after-expense");
await go("accounts");
await grab("accounts-after-expense");
await go("trends");
await grab("trends-after-expense");

await browser.close();

if (errors.length) {
  console.error("Page errors:\n" + errors.join("\n"));
  process.exit(1);
}
if (update) {
  writeFileSync(baselinePath, JSON.stringify(shots, null, 1) + "\n");
  console.log(`Baseline updated: ${Object.keys(shots).length} screens.`);
} else {
  const base = JSON.parse(readFileSync(baselinePath, "utf8"));
  const changed = Object.keys({ ...base, ...shots }).filter((k) => base[k] !== shots[k]);
  if (changed.length) {
    console.error(`Changed screens: ${changed.join(", ")}`);
    process.exit(1);
  }
  console.log(`All ${Object.keys(shots).length} screens match the baseline.`);
}
