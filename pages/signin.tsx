import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const strength = getPasswordStrength(password)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/dashboard')
  }

  return (
    <>
      <Head><title>Sign in — Boroma</title></Head>

      <section className="container mx-auto px-4 py-16 min-h-[70vh] grid place-items-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-4xl font-semibold tracking-tight" style={{ fontFamily: 'Mona Sans, ui-sans-serif' }}>
            Sign in
          </h1>
          <p className="text-slate-600 mt-1">Please enter your details</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-800">Email address</label>
              <input
                type="email"
                autoComplete="email"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-800">Password</label>
                <Link href="/forgot-password" className="text-sm text-[#FF5B04] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 my-auto rounded px-2 text-sm text-slate-600 hover:text-slate-900"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <StrengthHints strength={strength} password={password} />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-[#FF7A1A] to-[#FF5B04] px-4 py-3 font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-700">
            Don’t have an account?{' '}
            <Link href="/signup" className="text-[#FF5B04] hover:underline">Sign up</Link>
          </p>
        </div>
      </section>
    </>
  )
}

/* ---- shared helpers ---- */
type Strength = 0 | 1 | 2 | 3 | 4
function getPasswordStrength(pw: string): Strength {
  let score: number = 0
  if (pw.length >= 8) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4) as Strength
}
function StrengthHints({ strength, password }: { strength: Strength; password: string }) {
  const pct = [0, 25, 50, 75, 100][strength]
  const color = strength <= 1 ? 'bg-rose-500' : strength === 2 ? 'bg-amber-500' : strength === 3 ? 'bg-lime-500' : 'bg-emerald-600'
  const unmet = [
    { ok: password.length >= 8, text: 'At least 8 characters' },
    { ok: /[a-z]/.test(password) && /[A-Z]/.test(password), text: 'Both upper and lower case' },
    { ok: /\d/.test(password), text: 'A number (0-9)' },
    { ok: /[^A-Za-z0-9]/.test(password), text: 'A symbol (!@#$%)' },
  ]
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full rounded-full bg-slate-200"><div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
        {unmet.map((i, idx) => (
          <li key={idx} className={`flex items-center gap-1 ${i.ok ? 'text-emerald-700' : ''}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${i.ok ? 'bg-emerald-600' : 'bg-slate-300'}`} />
            {i.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
