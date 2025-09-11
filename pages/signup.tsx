import { useState, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function SignupPage() {
  const router = useRouter()
  const planFromUrl = useMemo<'monthly'|'annual'>(() =>
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('plan') === 'annual')
      ? 'annual'
      : 'monthly'
  , [router.asPath])

  const [fullName, setFullName]   = useState('')
  const [phone, setPhone]         = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 1) Create the auth user
    const { data: sign, error: signErr } = await supabase.auth.signUp({ email, password })
    if (signErr) {
      setLoading(false)
      setError(signErr.message)
      return
    }

    const session = sign.session
    if (!session) {
      // If you ever enable email confirmations in Supabase, this will be null.
      setLoading(false)
      setError('Check your email to confirm your account, then sign in to continue.')
      return
    }

    // 2) Store profile info (includes email so you can see it in the dashboard)
    await supabase.from('profiles').upsert({
      id: sign.user!.id,
      full_name: fullName,
      phone,
      email,
    })

    // 3) Start Stripe checkout (POST with Bearer token)
    try {
      const r = await fetch('/api/checkout/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: planFromUrl }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json?.error || 'Could not start checkout')
      window.location.href = json.url as string
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Create your account • Boroma</title>
      </Head>

      <div className="min-h-screen bg-orange-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-4xl font-extrabold text-orange-900">Create your account</h1>
          <p className="mt-2 text-slate-700">
            Enter <b>your own</b> details to manage billing and add members later from your dashboard.
          </p>

          {error && (
            <div className="mt-5 rounded-lg bg-red-50 text-red-800 border border-red-200 px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full name</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Phone (US)</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1XXXXXXXXXX"
              />
              <p className="mt-1 text-xs text-slate-500">
                This is for your account; members for Boroma service are added later.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 text-white font-semibold py-3 shadow hover:from-orange-600 hover:to-orange-700 disabled:opacity-60"
              >
                {loading ? 'Starting checkout…' : 'Continue to payment'}
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Plan: <b>{planFromUrl === 'annual' ? 'Annual' : 'Monthly'}</b>. You can add members after checkout.
            </p>
          </form>
        </div>
      </div>
    </>
  )
}
