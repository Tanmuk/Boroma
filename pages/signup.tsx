// pages/signup.tsx
import { useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

type Plan = 'monthly' | 'annual'

function toE164US(raw: string) {
  const d = (raw || '').replace(/\D/g, '')
  if (!d) return ''
  const core = d.length === 11 && d.startsWith('1') ? d.slice(1) : d
  return core.length === 10 ? `+1${core}` : `+${d}`
}

export default function SignUp() {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const plan = (router.query.plan as Plan) || 'monthly'

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const canSubmit =
    fullName.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 8 &&
    toE164US(phone).length >= 11

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)
    setNotice(null)

    try {
      // 1) sign up (if “Confirm email” is ON, no session will be returned here)
      const { data, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone: toE164US(phone) },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (signErr) throw signErr

      if (!data.session) {
        // email confirmation required
        setNotice(
          'We sent a confirmation email. Open it to finish sign-in, then come back here and click the orange button again to continue to payment.'
        )
        return
      }

      const userId = data.user?.id
      if (!userId) throw new Error('Missing user id')

      // 2) profile
      const { error: profErr } = await supabase
        .from('profiles')
        .upsert({ id: userId, full_name: fullName, email, phone: toE164US(phone) }, { onConflict: 'id' })
      if (profErr) throw profErr

      // 3) first member (primary)
      const { error: memErr } = await supabase.from('members').insert({
        user_id: userId,
        name: fullName,
        phone: toE164US(phone),
        is_primary: true,
      })
      if (memErr && !/duplicate|unique/i.test(memErr.message)) throw memErr

      // 4) Stripe checkout – requires the auth cookie that the provider sets
      const res = await fetch(`/api/checkout/start?plan=${plan}`, { method: 'POST' })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(`Checkout failed (${res.status}) ${t}`)
      }
      const { url } = await res.json()
      window.location.href = url
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Create your account – Boroma</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-[#fde7c0] to-white">
        <div className="max-w-xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold">Create your account</h1>
          <p className="mt-2 text-slate-600">
            Enter your own information so that you can manage your plan and add members later
          </p>

          {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-red-700 text-sm">{error}</div>}
          {notice && <div className="mt-4 rounded-md bg-amber-50 p-3 text-amber-800 text-sm">{notice}</div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm mb-1">Full name</label>
              <input className="w-full rounded-md border px-3 py-2" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm mb-1">Phone (US)</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 010 0100"
                inputMode="tel"
                required
              />
              <p className="mt-1 text-xs text-slate-500">Stored as {toE164US(phone) || '—'}.</p>
            </div>

            <div>
              <label className="block text-sm mb-1">Email address</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Password</label>
              <div className="relative">
                <input
                  className="w-full rounded-md border px-3 py-2 pr-20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? 'text' : 'password'}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-600"
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full rounded-md bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 font-medium shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {submitting ? 'Working…' : 'Continue to payment'}
            </button>

            <p className="text-xs text-slate-500">
              Plan: {plan === 'annual' ? 'Annual' : 'Monthly'}. By continuing you agree to our{' '}
              <a className="underline" href="/terms" target="_blank">Terms</a> and{' '}
              <a className="underline" href="/privacy" target="_blank">Privacy</a>.
            </p>

            <p className="text-sm">
              Already have an account? <a className="text-orange-600 underline" href="/login">Sign in</a>
            </p>
          </form>
        </div>
      </main>
    </>
  )
}
