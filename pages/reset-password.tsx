import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Supabase will set a recovery session on this page (via the link in email).
  useEffect(() => {
    // no-op, but ensures client-side hydration before updateUser
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setMsg(null)

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }

    setMsg('Password updated. You can now sign in.')
    setTimeout(() => router.push('/signin'), 1500)
  }

  return (
    <>
      <Head><title>Set a new password — Boroma</title></Head>
      <main className="container mx-auto px-4 py-16 min-h-[70vh] grid place-items-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif' }}>Set a new password</h1>
          <p className="text-slate-600 mt-1">Enter your new password below.</p>

          {msg && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</div>}
          {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium">New password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-xl border border-slate-300 p-3 pr-10 outline-none focus:ring-2 focus:ring-orange-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 my-auto rounded px-2 text-sm text-slate-600 hover:text-slate-900"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Confirm password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-orange-400"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <button
              className="w-full rounded-full bg-gradient-to-r from-[#FF7A1A] to-[#FF5B04] px-4 py-3 font-semibold text-white shadow-sm disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Updating…' : 'Update password'}
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
