"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnPrimary, Card, Field, inputCls, Notice } from "@/components/admin/ui";

type State = "checking" | "ready" | "invalid" | "done";

/** Opened from the reset email. The link signs the person in briefly so they can choose a new password. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("checking");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = createClient();
    let alive = true;
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setState((s) => (s === "done" ? s : "ready"));
      }
    });
    // getSession waits for the link's code to be exchanged for a session.
    sb.auth.getSession().then(({ data: d }) => {
      if (alive) setState((s) => (s === "checking" ? (d.session ? "ready" : "invalid") : s));
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== again) return setError("The two passwords do not match.");
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    setState("done");
  }

  if (state === "checking") {
    return <p role="status" className="py-10 text-center text-slate-600">Checking your link…</p>;
  }

  if (state === "invalid") {
    return (
      <Card className="mx-auto max-w-sm space-y-3">
        <h1 className="text-2xl font-extrabold text-brand-red">This link did not work</h1>
        <p className="text-slate-700">It may have expired or already been used. Reset links work once. Request a new one from the sign-in page.</p>
        <Link href="/admin/login" className={`${btnPrimary} flex w-full items-center justify-center`}>Back to sign in</Link>
      </Card>
    );
  }

  if (state === "done") {
    return (
      <Card className="mx-auto max-w-sm space-y-3">
        <h1 className="text-2xl font-extrabold text-brand-blue">Password updated</h1>
        <p className="text-slate-700">You are signed in. Use the new password next time.</p>
        <button className={`${btnPrimary} w-full`} onClick={() => { router.push("/admin"); router.refresh(); }}>Go to admin</button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-extrabold text-brand-blue">Set a new password</h1>
      <p className="mb-4 text-sm text-slate-600">Choose something at least 8 characters long that you do not use anywhere else.</p>
      <form onSubmit={save} className="space-y-3">
        <Field label="New password">
          <input className={inputCls} type={show ? "text" : "password"} autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Type it again">
          <input className={inputCls} type={show ? "text" : "password"} autoComplete="new-password" required value={again} onChange={(e) => setAgain(e.target.value)} />
        </Field>
        <label className="flex min-h-[44px] items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords
        </label>
        <Notice error={error} />
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
      </form>
    </Card>
  );
}
