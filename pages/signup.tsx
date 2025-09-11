// pages/signup.tsx
import { useState } from 'react';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Signup() {
  const supabase = createClientComponentClient();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      // 1) Sign up (no email confirmation — Supabase Auth > “Confirm email” OFF)
      const { data: sign, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signErr) throw signErr;

      // Ensure we have a session (if confirm-email were ON, this would be null)
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        throw new Error('No active session after signup. Please try again.');
      }

      const user = sign.user ?? sess.session.user;

      // 2) Create/update profile
      const { error: pErr } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: fullName, phone }, { onConflict: 'id' });
      if (pErr) throw pErr;

      // 3) DO NOT add a member here. The user will add members later on Dashboard.

      // 4) Go to Stripe checkout (monthly default; change query if you have a toggle)
      const plan = 'monthly';
      const res = await fetch(`/api/checkout/start?plan=${plan}`, { method: 'POST' });
      if (!res.ok) {
        const t = await res.json().catch(() => ({}));
        throw new Error(t.error || `Checkout failed (${res.status})`);
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head><title>Create your account • Boroma</title></Head>

      <main className="mx-auto max-w-xl px-4 pb-16">
        <h1 className="mt-10 text-4xl font-extrabold">Create your account</h1>
        <p className="mt-3 text-gray-600">
          <strong>Enter your own information</strong> so you can manage your plan.
          You’ll add members for Boroma support later on your dashboard.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input className="mt-1 w-full rounded border p-2"
              value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone (US)</label>
            <input className="mt-1 w-full rounded border p-2"
              value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium">Email address</label>
            <input type="email" className="mt-1 w-full rounded border p-2"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input type="password" minLength={8} className="mt-1 w-full rounded border p-2"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded bg-orange-500 px-4 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {busy ? 'Working…' : 'Continue to payment'}
          </button>
        </form>
      </main>
    </>
  );
}
