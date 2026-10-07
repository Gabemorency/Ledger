/**
 * Loads app state from Supabase and keeps it saved there.
 *
 * Local-first: every change is written to this device straight away, then
 * uploaded a moment later as just the rows that changed. If the upload
 * fails (offline, server down) the change stays marked as pending on this
 * device and is retried, including on the next visit.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { TABLES, diff, rowsToState, stateToRows } from "./rows";

type Obj = Record<string, unknown>;
type Saved = ReturnType<typeof stateToRows>;

export type SyncStatus = "saved" | "saving" | "offline" | "error";

const PAGE = 1000; // Supabase returns at most 1000 rows per request
const CHUNK = 500;

/** Fetch every row of a table for the signed-in user (RLS limits it to theirs). */
async function fetchAll(sb: SupabaseClient, table: string): Promise<Obj[]> {
  const out: Obj[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from(table)
      .select("*")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data as Obj[]));
    if (data.length < PAGE) return out;
  }
}

/** The user's saved state, or null for a brand-new user. */
export async function loadCloud(sb: SupabaseClient): Promise<{ state: Obj | null; rev: string }> {
  const [settingsRes, ...lists] = await Promise.all([
    sb.from("settings").select("data, rev").maybeSingle(),
    ...TABLES.map((t) => fetchAll(sb, t.table)),
  ]);
  if (settingsRes.error) throw settingsRes.error;
  const rows = Object.fromEntries(TABLES.map((t, i) => [t.table, lists[i]]));
  const empty = lists.every((l) => l.length === 0);
  if (!settingsRes.data && empty) return { state: null, rev: "" };
  return { state: rowsToState(rows, (settingsRes.data?.data as Obj) || {}), rev: settingsRes.data?.rev || "" };
}

interface Cached {
  state: Obj;
  pending: boolean;
  rev: string;
}

const cacheKey = (userId: string) => `ledger-cloud:${userId}`;

export function readCache(userId: string): Cached | null {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(userId)) || "null");
  } catch {
    return null;
  }
}

function writeCache(userId: string, c: Cached) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(c, (k, v) => (k.startsWith("_") ? undefined : v)));
  } catch {
    // storage full or blocked: the upload still happens
  }
}

export function clearCache(userId: string) {
  try {
    localStorage.removeItem(cacheKey(userId));
  } catch {}
}

const newRev = () => `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;

export class CloudSync {
  private saved: Saved | null;
  private latest: Obj | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running: Promise<void> | null = null;
  private again = false;
  private retryMs = 2000;
  rev: string;
  pending = false;
  /** Another device saved since this one loaded; reload before trusting this copy. */
  behind = false;
  private stopped = false;

  constructor(
    private sb: SupabaseClient,
    private userId: string,
    /** What the database holds now (null if unknown, e.g. loaded offline). */
    savedState: Obj | null,
    rev: string,
    private onStatus: (s: SyncStatus) => void = () => {},
  ) {
    this.saved = savedState ? stateToRows(savedState) : null;
    this.rev = rev;
    if (typeof window !== "undefined") window.addEventListener("online", () => this.pending && this.flush());
  }

  /**
   * The app's starting state once it has filled in defaults. When it came
   * straight from the cloud, treat it as already saved: filling in defaults
   * is not a change worth uploading.
   */
  adopt(state: Obj) {
    if (this.saved && !this.pending) this.saved = stateToRows(state);
  }

  /** The app started from this device's unsent changes: they must be uploaded. */
  markPending() {
    this.pending = true;
  }

  /** Stop saving (signing out): nothing more is written to the device or the cloud. */
  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  /** Called on every app save: keep it on the device now, upload shortly. */
  schedule(state: Obj, delay = 700) {
    if (this.stopped) return;
    this.latest = state;
    writeCache(this.userId, { state, pending: true, rev: this.rev });
    this.pending = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), delay);
  }

  /** Upload changes now. Safe to call repeatedly; runs one upload at a time. */
  flush(): Promise<void> {
    if (this.stopped) return Promise.resolve();
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = this.push().finally(() => {
      this.running = null;
      if (this.again) {
        this.again = false;
        void this.flush();
      }
    });
    return this.running;
  }

  private async push() {
    if (!this.latest) return;
    const state = this.latest;
    const next = stateToRows(state);
    const changes = diff(this.saved, next);
    if (changes.count === 0) {
      this.done(state);
      return;
    }
    this.onStatus("saving");
    try {
      const remote = await this.sb.from("settings").select("rev").maybeSingle();
      if (remote.error) throw remote.error;
      if (remote.data && remote.data.rev !== this.rev) this.behind = true;
      for (const [table, rows] of Object.entries(changes.upserts)) {
        for (let i = 0; i < rows.length; i += CHUNK) {
          const batch = rows.slice(i, i + CHUNK).map((r) => ({ ...r, user_id: this.userId }));
          const { error } = await this.sb.from(table).upsert(batch, { onConflict: "user_id,id" });
          if (error) throw error;
        }
      }
      for (const [table, ids] of Object.entries(changes.deletes)) {
        for (let i = 0; i < ids.length; i += CHUNK) {
          const { error } = await this.sb.from(table).delete().eq("user_id", this.userId).in("id", ids.slice(i, i + CHUNK));
          if (error) throw error;
        }
      }
      // Always bump rev so other devices notice the change, but only rewrite
      // the settings document when it changed here, so this device never
      // overwrites settings another device just saved.
      const rev = newRev();
      const { error } =
        changes.settings || !remote.data
          ? await this.sb.from("settings").upsert({ user_id: this.userId, data: next.settings, rev }, { onConflict: "user_id" })
          : await this.sb.from("settings").update({ rev }).eq("user_id", this.userId);
      if (error) throw error;
      this.saved = next;
      this.rev = rev;
      this.retryMs = 2000;
      if (this.latest === state) this.done(state);
      else this.again = true; // more edits arrived during the upload
    } catch (e) {
      console.warn("Ledger: upload failed, will retry", e);
      this.onStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), this.retryMs);
      this.retryMs = Math.min(this.retryMs * 2, 60000);
    }
  }

  private done(state: Obj) {
    this.pending = false;
    if (this.stopped) return;
    writeCache(this.userId, { state, pending: false, rev: this.rev });
    this.onStatus("saved");
  }

  /** True when another device saved since this one loaded. */
  async changedElsewhere(): Promise<boolean> {
    if (this.running) await this.running;
    if (this.pending) return false;
    if (this.behind) return true;
    const { data, error } = await this.sb.from("settings").select("rev").maybeSingle();
    return !error && !!data && data.rev !== this.rev;
  }
}
