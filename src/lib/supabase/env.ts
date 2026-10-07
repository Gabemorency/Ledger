// Set by Vercel's Supabase integration. NEXT_PUBLIC_ values are inlined at
// build time, so they must be referenced literally.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Without Supabase settings (local dev, CI) the app runs in on-device demo mode. */
export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);
