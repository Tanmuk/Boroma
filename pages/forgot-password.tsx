import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null); setErr(null); setLoading(true)
    const redirectTo = `${window.location.origin}/reset-password` // changed from /login → /reset-password
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setMsg('Check your email for a reset link.')
  }

  return (
    <>
      <Head><title>Forgot password — Boroma</title></Head>
      <main className="container mx-auto px-4 py-16 min-h-[70vh] grid place-items-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif' }}>Reset password</h1>
          <p className="text-slate-600 mt-1">We will email you a link to reset it.</p>

          {msg && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</div>}
          {err && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium">Email address</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-orange-400"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <button className="btn btn-primary w-full rounded-full bg-gradient-to-r from-[#FF7A1A] to-[#FF5B04] px-4 py-3 font-semibold text-white shadow-sm disabled:opacity-60" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-4 text-sm">
            Back to{' '}
            <Link href="/signin" className="text-[#FF5B04] hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    </>
  )
}
