"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnGhost, btnPrimary, Card, Field, inputCls, Notice } from "@/components/admin/ui";

type Mode = "login" | "forgot" | "sent";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "not-admin" ? "This account is not an admin." : null,
  );
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      return setError(
        /invalid login/i.test(error.message)
          ? "Wrong email or password. Check for typos, or use \"Forgot password?\" below."
          : error.message,
      );
    }
    router.push("/admin");
    router.refresh();
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setBusy(false);
    // Unknown emails get the same answer, so this page never reveals who has an account.
    if (error && (error.status === 429 || /rate/i.test(error.message))) {
      return setError("Too many requests. Please wait a few minutes and try again.");
    }
    setMode("sent");
  }

  if (mode === "sent") {
    return (
      <Card className="mx-auto max-w-sm space-y-3">
        <h1 className="text-2xl font-extrabold text-brand-blue">Check your email</h1>
        <p className="text-slate-700">
          If <b>{email.trim()}</b> has an admin account, we have sent a link to set a new password. It can take a minute, so also look in spam.
          The link works once.
        </p>
        <button type="button" className={`${btnGhost} w-full`} onClick={() => { setMode("login"); setError(null); }}>
          Back to sign in
        </button>
      </Card>
    );
  }

  if (mode === "forgot") {
    return (
      <Card className="mx-auto max-w-sm">
        <h1 className="mb-1 text-2xl font-extrabold text-brand-blue">Forgot password</h1>
        <p className="mb-4 text-sm text-slate-600">Enter your admin email and we will send you a link to set a new password.</p>
        <form onSubmit={sendLink} className="space-y-3">
          <Field label="Email">
            <input className={inputCls} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Notice error={error} />
          <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
          <button type="button" className={`${btnGhost} w-full`} onClick={() => { setMode("login"); setError(null); }}>
            Back to sign in
          </button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-extrabold text-brand-blue">Admin login</h1>
      <form onSubmit={signIn} className="space-y-3">
        <Field label="Email">
          <input className={inputCls} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <div className="flex gap-2">
            <input
              className={inputCls} type={show ? "text" : "password"} required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className={`${btnGhost} flex-none`} aria-pressed={show} onClick={() => setShow((s) => !s)}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </Field>
        <Notice error={error} />
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <button type="button" className="min-h-[44px] w-full text-sm font-semibold text-brand-blue underline" onClick={() => { setMode("forgot"); setError(null); }}>
          Forgot password?
        </button>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
