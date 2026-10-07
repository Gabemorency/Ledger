"use client";

import { useEffect } from "react";

/** Boots the original app script once the static shell is on the page. */
export default function LegacyApp() {
  useEffect(() => {
    // Module imports run once, so this is safe under React's double effects.
    import("@/legacy/ledger");
  }, []);
  return null;
}
