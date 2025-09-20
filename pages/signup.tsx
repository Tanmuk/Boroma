import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function SignUpPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const strength = getPasswordStrength(password)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search)
    const p = q.get('plan')
    if (p === 'annual') setPlan('annual')
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1) Create auth user with metadata (first/last)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    })
    if (signUpError || !signUpData.user) {
      setLoading(false)
      setError(signUpError?.message || 'Unable to sign up.')
      return
    }

    // IMPORTANT:
    // Do NOT upsert into public.profiles on the client here.
    // The database trigger (handle_new_user) will insert the profile safely,
    // even if the user isn't signed in yet (avoids RLS/role issues).

    // 2) Start Stripe checkout through backend (token if available)
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    try {
      const res = await fetch('/api/checkout/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      if (json?.url) {
        window.location.href = json.url
      } else {
        throw new Error('No checkout URL returned.')
      }
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'Checkout initialization failed.')
    }
  }

  return (
    <>
      <Head><title>Sign up — Boroma</title></Head>

      <section className="container mx-auto px-4 py-16 min-h-[70vh] grid place-items-center">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-4xl font-semibold tracking-tight" style={{ fontFamily: 'Mona Sans, ui-sans-serif' }}>
            Create your account
          </h1>
          <p className="text-slate-600 mt-1">
            Enter your <strong>own</strong> details to manage billing. You can add members later from your dashboard.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800">First name</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">Last name</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800">Email address</label>
              <input
                type="email"
                autoComplete="email"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Create a strong password"
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
              {loading ? 'Continuing…' : 'Continue to payment'}
            </button>

            <p className="text-xs text-slate-600">
              Plan: <span className="font-semibold capitalize">{plan}</span>. You can add members after checkout.
            </p>
          </form>

          <p className="mt-4 text-sm text-slate-700">
            Already have an account?{' '}
            <Link href="/signin" className="text-[#FF5B04] hover:underline">Sign in</Link>
          </p>
        </div>
      </section>
    </>
  )
}

/* ---- password helpers (same as signin) ---- */
type Strength = 0 | 1 | 2 | 3 | 4
function getPasswordStrength(pw: string): Strength {
  let score = 0
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
