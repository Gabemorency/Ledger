import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnabled } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Where the sign-in email link lands. Works with both link styles Supabase can send. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (!supabaseEnabled) return NextResponse.redirect(new URL("/", url.origin));
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const supabase = await createClient();

  let ok = false;
  if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  else if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;

  return NextResponse.redirect(new URL(ok ? "/" : "/login?error=link", url.origin));
}
