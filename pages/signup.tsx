// pages/signup.tsx
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

type Plan = 'monthly' | 'annual'

function normalizeUSPhone(input: string) {
  // keep digits only
  const d = (input || '').replace(/\D/g, '')
  // 10 digits -> +1XXXXXXXXXX
  if (d.length === 10) return { e164: `+1${d}`, digits: d }
  // 11 digits starting with 1 -> +1XXXXXXXXXX
  if (d.length === 11 && d.startsWith('1')) return { e164: `+${d}`, digits: d.slice(1) }
  // already looks like +E164 US?
  if (input.startsWith('+1') && d.length === 11) return { e164: input, digits: d.slice(1) }
  return { e164: '', digits: '' }
}

export default function Signup() {
  const router = useRouter()
  const plan = useMemo<Plan>(() => {
    const p = (router.query.plan as string) || 'monthly'
    return p === 'annual' ? 'annual' : 'monthly'
  }, [router.query.plan])

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // tiny password strength check – you asked to avoid “repeat password” field
  const pwWeak =
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)

  useEffect(() => {
    // if already signed in, just go pay
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) startCheckout().catch(() => {})
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCheckout() {
    // called only after a session exists
    const res = await fetch(`/api/checkout/start?plan=${plan}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, phone })
    })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(txt || 'Failed to create checkout session')
    }
    const { url } = await res.json()
    window.location.href = url
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // basic client validation
    if (!name.trim()) return setError('Please enter your full name')
    const normalized = normalizeUSPhone(phone)
    if (!normalized.e164) return setError('Enter a valid US phone number (e.g., +1 555 555 0100)')
    if (pwWeak) return setError('Password must be 8+ chars and include upper, lower and a number')

    try {
      setLoading(true)

      // 1) create account (if already exists Supabase returns error)
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password
      })
      if (signUpErr && !/already registered/i.test(signUpErr.message)) {
        throw signUpErr
      }

      // 2) if the email was already registered, sign in; else sign in the new user
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) throw signInErr

      // 3) save the user profile (allowed by your RLS as the user themselves)
      const { data: userRes } = await supabase.auth.getUser()
      const userId = userRes.user?.id
      if (userId) {
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: name.trim(),
          phone: normalized.e164,
          phone_digits: normalized.digits
        })
      }

      // 4) go to Stripe Checkout
      await startCheckout()
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'Something went wrong, please try again')
      return
    }
  }

  return (
    <main className="container py-16">
      <div className="max-w-xl mx-auto card p-6">
        <h1 className="mb-1">Create your account</h1>
        <p className="text-slate-600">
          Enter your own information so you can manage your plan and add members later
        </p>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input
              className="w-full border rounded-xl p-3 mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone (US)</label>
            <input
              className="w-full border rounded-xl p-3 mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 555 0100"
              inputMode="tel"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email address</label>
            <input
              className="w-full border rounded-xl p-3 mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Password</label>
              <button
                type="button"
                className="btn-link text-sm"
                onClick={() => setShowPwd((s) => !s)}
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              className="w-full border rounded-xl p-3 mt-1"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 chars, with A-Z, a-z and 0-9"
              required
            />
            <p className={`text-xs mt-1 ${pwWeak ? 'text-amber-600' : 'text-green-700'}`}>
              {pwWeak ? 'Weak password' : 'Looks good'}
            </p>
          </div>

          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait…' : 'Continue to payment'}
          </button>

          <p className="text-xs text-slate-600">
            Plan: <strong>{plan === 'annual' ? 'Annual' : 'Monthly'}</strong>. By continuing you
            agree to our{' '}
            <Link className="btn-link" href="/terms">
              Terms
            </Link>{' '}
            and{' '}
            <Link className="btn-link" href="/privacy">
              Privacy
            </Link>
            .
          </p>

          <p className="text-sm">
            Already have an account? <Link className="btn-link" href="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
