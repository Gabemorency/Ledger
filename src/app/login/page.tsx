import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseEnabled } from "@/lib/supabase/env";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Sign in · Ledger" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (!supabaseEnabled) redirect("/"); // demo mode has no accounts
  const { error } = await searchParams;
  return (
    <main className="auth">
      <div className="authcard">
        <div className="lbrand">Ledger</div>
        <LoginForm linkFailed={error === "link"} />
      </div>
    </main>
  );
}
