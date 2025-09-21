import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import posthog from 'posthog-js'
import { supabase } from '@/lib/supabaseClient'
import { TOLLFREE_DISPLAY, CALLS_LIMIT } from '@/lib/env.client'
import { getBillingWindow, type BillingWindow } from '@/lib/billing'
import { getMinutesUsed, getCallsUsed } from '@/lib/usage'

const PORTAL_API = '/api/billing/portal'

// ---- PostHog safe init (client only)
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
let phInited = false
function phCapture(name: string, props?: Record<string, any>) {
  try {
    if (POSTHOG_KEY) posthog.capture(name, props)
  } catch { /* no-op */ }
}

type Member = { id: string; name: string; phone: string; status?: string | null; created_at: string }
type CallRow = { id: string; duration_seconds: number | null; started_at: string; issue_type?: string | null; phone?: string | null }

export default function Dashboard() {
  const [displayName, setDisplayName] = useState<string>('')
  const [members, setMembers] = useState<Member[]>([])
  const [recentCalls, setRecentCalls] = useState<CallRow[]>([])
  const [windowInfo, setWindowInfo] = useState<BillingWindow | null>(null)
  const [callsUsed, setCallsUsed] = useState<number>(0)
  const [minutesUsed, setMinutesUsed] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // First-member flow
  const [showConfirm, setShowConfirm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addRelationship, setAddRelationship] = useState('')

  // Solid white page background
  useEffect(() => {
    document.body.classList.add('bg-white')
    return () => document.body.classList.remove('bg-white')
  }, [])

  // Init PostHog (client) once
  useEffect(() => {
    if (typeof window !== 'undefined' && POSTHOG_KEY && !phInited) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: true,
        capture_pageview: false,
      })
      phInited = true
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (mounted) window.location.href = '/login'; return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, first_name, last_name, email')
        .eq('id', user.id)
        .maybeSingle()

      const name = (prof?.full_name?.trim()) || [prof?.first_name, prof?.last_name].filter(Boolean).join(' ').trim()
      if (mounted) setDisplayName(name || '')

      // Identify in PostHog
      if (POSTHOG_KEY && phInited) {
        try {
          posthog.identify(user.id, { email: prof?.email || user.email, name: name || undefined })
          phCapture('dashboard_viewed')
        } catch { /* no-op */ }
      }

      const bw = await getBillingWindow(supabase)
      if (mounted) setWindowInfo(bw)

      const { data: memRows } = await supabase
        .from('members')
        .select('id, name, phone, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (mounted) setMembers(memRows || [])

      // Usage
      const minutes = await getMinutesUsed(supabase, { start: bw.start, end: bw.end })
      const calls = await getCallsUsed(supabase, { start: bw.start, end: bw.end })
      if (mounted) { setMinutesUsed(minutes); setCallsUsed(calls) }

      // Recent activity (client-filtered to owned members)
      const { data: callRows } = await supabase
        .from('calls')
        .select('id, duration_seconds, started_at, issue_type, phone, member_id')
        .gte('started_at', bw.start.toISOString())
        .lte('started_at', bw.end.toISOString())
        .order('started_at', { ascending: false })
        .limit(5)
      const myMemberIds = new Set((memRows || []).map(m => m.id))
      const filtered = (callRows || []).filter((r: any) => !r.member_id || myMemberIds.has(r.member_id))
      if (mounted) setRecentCalls(filtered)

      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const callPct = useMemo(() => Math.min(100, Math.round((callsUsed / Math.max(CALLS_LIMIT, 1)) * 100)), [callsUsed])
  const hasAtLeastOneMember = members.length > 0

  // Stripe portal (and PostHog event)
  async function openStripePortal() {
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) { window.location.href = '/login'; return }
      phCapture('billing_portal_opened')
      const resp = await fetch(PORTAL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const json = await resp.json()
      if (!resp.ok || !json?.url) throw new Error(json?.error || 'Portal error')
      window.location.href = json.url
    } catch (e) {
      console.error(e)
      alert('Could not open billing portal. Please try again.')
    }
  }

  async function handleLogout() {
    phCapture('logout_clicked')
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  function openConfirm(e: React.FormEvent) {
    e.preventDefault()
    setShowConfirm(true)
  }

  async function confirmAddMember() {
    setShowConfirm(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: inserted, error } = await supabase
      .from('members')
      .insert({
        user_id: user.id,
        name: addName,
        phone: addPhone,
        relationship: addRelationship || null,
        status: 'active',
        is_primary: false,
      } as any)
      .select('id')
      .single()

    if (!error) {
      phCapture('member_added', { member_id: inserted?.id, phone_last4: addPhone?.slice(-4) })
      setAddName(''); setAddPhone(''); setAddRelationship('')
      const { data: memRows } = await supabase
        .from('members')
        .select('id, name, phone, status, created_at')
        .order('created_at', { ascending: false })
      setMembers(memRows || [])
    }
  }

  function statusPillClass(status?: string | null) {
    const s = (status || '').toLowerCase()
    if (s === 'active' || s === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (s === 'trialing') return 'bg-blue-50 text-blue-700 border-blue-200'
    if (s === 'past_due') return 'bg-amber-50 text-amber-700 border-amber-200'
    if (s === 'canceled') return 'bg-rose-50 text-rose-700 border-rose-200'
    return 'bg-slate-100 text-slate-600 border-slate-200' // inactive/unknown
  }

  return (
    <>
      <Head>
        <title>Boroma — Dashboard</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Welcome{displayName ? `, ${displayName}` : ''}
          </h1>
          <p className="text-slate-600 mt-2">Manage your plan, members and support number.</p>
          {windowInfo?.source === 'calendar_fallback' && (
            <div className="mt-3 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
              Usage is shown for calendar month until your subscription period is available.
            </div>
          )}
        </header>

        {/* Layout */}
        <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Support number */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Your support number</div>
              <div className="text-3xl font-bold tracking-tight">{TOLLFREE_DISPLAY}</div>
              <p className="text-slate-600 mt-2">Share this number only with your approved members.</p>
              <div className="flex gap-3 mt-4 flex-wrap">
                <button
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white text-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                  onClick={() => {
                    navigator.clipboard?.writeText(TOLLFREE_DISPLAY)
                    phCapture('support_number_copied')
                  }}
                >
                  Copy number
                </button>
                <a
                  href="/boroma-fridge-magnet.pdf"
                  download
                  onClick={() => phCapture('fridge_magnet_downloaded')}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Fridge magnet (PDF)
                </a>
              </div>
            </div>

            {/* Members */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide">Members</div>
              <h2 className="text-xl font-semibold tracking-tight mt-1">24/7 support for approved numbers</h2>
              <p className="text-slate-600 mt-1">Only these numbers can call the toll-free line.</p>

              {!hasAtLeastOneMember ? (
                <form onSubmit={openConfirm} className="border rounded-xl p-5 max-w-lg mt-4">
                  <input className="w-full border rounded-xl p-3 mb-3" placeholder="Full name" value={addName} onChange={e=>setAddName(e.target.value)} required />
                  <input className="w-full border rounded-xl p-3 mb-3" placeholder="Phone (digits only)" value={addPhone} onChange={e=>setAddPhone(e.target.value)} required />
                  <input className="w-full border rounded-xl p-3 mb-3" placeholder="Relationship (optional)" value={addRelationship} onChange={e=>setAddRelationship(e.target.value)} />
                  <button className="btn btn-primary">Add member</button>
                  <div className="text-xs text-slate-500 mt-2">You’ll be able to add more by purchasing additional member slots.</div>
                </form>
              ) : (
                <>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    {members.map(m => (
                      <div key={m.id} className="border rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{m.name || 'Member'}</div>
                            <div className="text-slate-600 text-sm">{m.phone}</div>
                          </div>
                          <span className={`text-xs rounded-full px-2 py-1 border ${statusPillClass(m.status)}`}>
                            {m.status || 'active'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-2">Created {new Date(m.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <button onClick={openStripePortal} className="btn btn-primary">Buy another member slot</button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <aside className="space-y-6">
            {/* Account */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Account</div>
              <div className="text-slate-700">
                {windowInfo?.start && windowInfo?.end ? (
                  <>Billing period: <span className="font-medium">{new Date(windowInfo.start).toLocaleDateString()} — {new Date(windowInfo.end).toLocaleDateString()}</span></>
                ) : '—'}
              </div>
              <div className="flex gap-3 mt-3 flex-wrap">
                {/* Swapped styles: Manage billing gets the outlined style; Log out becomes light button */}
                <button
                  onClick={openStripePortal}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white text-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Manage billing
                </button>
                <button onClick={handleLogout} className="btn btn-light">Log out</button>
              </div>
            </div>

            {/* Calls used */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Calls used</div>
              <div className="text-2xl font-semibold">
                {callsUsed} <span className="text-slate-500 text-base">/ {CALLS_LIMIT}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded mt-3">
                <div className="h-2 rounded bg-gradient-to-r from-orange-400 to-orange-500" style={{ width: `${callPct}%` }} />
              </div>
              <button onClick={openStripePortal} className="inline-block text-sm mt-3 text-[#FF5B04] font-semibold">
                Buy another member slot →
              </button>
            </div>

            {/* Minutes used */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Minutes used</div>
              <div className="text-2xl font-semibold">{minutesUsed}<span className="text-slate-500 text-base"> min</span></div>
              {/* Removed the "35 min cap • 25-min reminder" line as requested */}
            </div>
          </aside>
        </section>

        {/* Recent activity */}
        <section className="mt-8">
          <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-2">Recent activity</div>
          <div className="grid gap-3">
            {recentCalls.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-500">No recent calls.</div>
            ) : (
              recentCalls.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.issue_type || 'General help'}</div>
                    <div className="text-sm text-slate-500">
                      {new Date(r.started_at).toLocaleString()}
                      {r.phone ? ` • ${r.phone}` : ''}
                    </div>
                  </div>
                  <div className="text-right text-sm">{r.duration_seconds ? Math.round(r.duration_seconds/60) : 0} min</div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Confirm modal for first member add */}
      {showConfirm && (
        <div className="fixed inset-0 z-40 bg-black/50 grid place-items-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold tracking-tight">Double-check this member</h3>
            <p className="text-slate-600 mt-2">
              This number will be <span className="font-semibold">locked until your next billing period</span>. 
              You won’t be able to edit or replace it without buying another member slot.
            </p>
            <div className="mt-4 border rounded-lg p-3 text-sm">
              <div><span className="text-slate-500">Name:</span> {addName || '—'}</div>
              <div><span className="text-slate-500">Phone:</span> {addPhone || '—'}</div>
              {addRelationship ? <div><span className="text-slate-500">Relationship:</span> {addRelationship}</div> : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn btn-light" onClick={()=>setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmAddMember}>Confirm & add</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
