import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/** Supabase client for the browser. The publishable key is safe to expose; Row Level Security protects the data. */
export const createClient = () => createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
