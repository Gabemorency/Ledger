"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "code";

const LINK_ERROR = "That sign-in link expired or was already used. Request a new code.";

export default function LoginForm({ linkFailed = false }: { linkFailed?: boolean }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(linkFailed ? LINK_ERROR : "");
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/confirm` },
    });
    setBusy(false);
    if (error) return setError(error.status === 429 ? "Too many requests. Wait a minute and try again." : error.message);
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return setError("Enter the code from the email.");
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.verifyOtp({ email: email.trim(), token, type: "email" });
    if (error) {
      setBusy(false);
      return setError("That code didn’t work. Check it, or send a new one.");
    }
    location.replace("/");
  }

  if (step === "email")
    return (
      <form onSubmit={sendCode} noValidate>
        <h1 className="authtitle">Sign in</h1>
        <p className="sub">We’ll email you a code. No password needed.</p>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <p className="lerr" role="alert">
          {error}
        </p>
        <button className="btn full" disabled={busy}>
          {busy ? "Sending…" : "Email me a code"}
        </button>
      </form>
    );

  return (
    <form onSubmit={verify} noValidate>
      <h1 className="authtitle">Check your email</h1>
      <p className="sub">
        We sent a code to <b>{email.trim()}</b>. Enter it here, or tap the link in the email.
      </p>
      <label className="field">
        <span>Code</span>
        <input
          ref={codeRef}
          className="codein num"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={10}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      <p className="lerr" role="alert">
        {error}
      </p>
      <button className="btn full" disabled={busy}>
        {busy ? "Checking…" : "Sign in"}
      </button>
      <div className="llinks">
        <button type="button" onClick={() => sendCode()} disabled={busy}>
          Send a new code
        </button>
        <button type="button" onClick={() => (setStep("email"), setCode(""), setError(""))}>
          Use a different email
        </button>
      </div>
    </form>
  );
}
