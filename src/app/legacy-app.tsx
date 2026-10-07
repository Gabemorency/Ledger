"use client";

import { useEffect, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase/env";

type Obj = Record<string, unknown>;

declare global {
  interface Window {
    __ledgerBoot?: {
      state: Obj | null;
      email: string;
      /** The starting state after the app filled in defaults. */
      loaded: (state: Obj) => void;
      save: (state: Obj) => void;
      signOut: () => void;
    };
  }
}

const STATUS_TEXT = {
  saving: "Saving…",
  saved: "Saved",
  offline: "Saved offline",
  error: "Sync failed · retrying",
} as const;

/** Show the save status briefly; keep problems visible until they clear. */
function showStatus(s: keyof typeof STATUS_TEXT) {
  const el = document.getElementById("syncPill");
  if (!el) return;
  el.dataset.s = s;
  el.innerHTML = `<i></i>${STATUS_TEXT[s]}`;
  el.classList.add("show");
  clearTimeout(Number(el.dataset.t));
  if (s === "saved") el.dataset.t = String(window.setTimeout(() => el.classList.remove("show"), 1400));
}

/** Loads the signed-in user's data (or demo mode), then starts the app screens. */
export default function LegacyApp() {
  const [loading, setLoading] = useState(supabaseEnabled);

  useEffect(() => {
    if (!supabaseEnabled) {
      // On-device demo mode (no Supabase configured). Module imports run once,
      // so this is safe under React's double effects.
      import("@/legacy/ledger");
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ createClient }, cloud, { LOCAL_ONLY }] = await Promise.all([
        import("@/lib/supabase/client"),
        import("@/lib/sync/cloud"),
        import("@/lib/sync/rows"),
      ]);
      const sb = createClient();
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;
      if (!user) return location.replace("/login");

      const cached = cloud.readCache(user.id);
      let state: Obj | null = null;
      let remote: Awaited<ReturnType<typeof cloud.loadCloud>> | null = null;
      try {
        remote = await cloud.loadCloud(sb);
      } catch (e) {
        console.warn("Ledger: couldn't load from the cloud, using this device's copy", e);
      }
      if (cancelled) return;

      // Unsent changes on this device win; otherwise the cloud copy is the truth.
      if (cached?.pending) state = cached.state;
      else if (remote) state = remote.state;
      else state = cached?.state ?? null;
      // The PIN and open screen never leave this device: keep them from its copy.
      if (state && cached?.state && state !== cached.state)
        for (const k of LOCAL_ONLY) if (cached.state[k] !== undefined) state = { ...state, [k]: cached.state[k] };

      const sync = new cloud.CloudSync(sb, user.id, remote ? remote.state : null, remote?.rev ?? cached?.rev ?? "", showStatus);
      if (!remote) showStatus("offline");

      window.__ledgerBoot = {
        state,
        email: user.email ?? "",
        loaded: (s) => sync.adopt(s),
        save: (s) => sync.schedule(s),
        async signOut() {
          showStatus("saving");
          await sync.flush();
          if (sync.pending && !confirm("Some changes haven’t reached the cloud yet. Sign out anyway and lose them?"))
            return showStatus("error");
          sync.stop();
          cloud.clearCache(user.id);
          await sb.auth.signOut();
          location.replace("/login");
        },
      };
      if (cached?.pending) sync.markPending();

      // Coming back to the app: if another device saved meanwhile, reload to show it.
      let hiddenAt = 0;
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "hidden") {
          hiddenAt = Date.now();
          void sync.flush();
        } else if (Date.now() - hiddenAt > 15000 && (await sync.changedElsewhere())) location.reload();
      });
      window.addEventListener("pagehide", () => void sync.flush());

      await import("@/legacy/ledger");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return loading ? (
    <div className="boot" aria-live="polite">
      <div className="lbrand">Ledger</div>
    </div>
  ) : null;
}
