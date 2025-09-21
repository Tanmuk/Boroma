import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { TOLLFREE_DISPLAY, CALLS_LIMIT, PER_CALL_MAX_MIN, SOFT_REMINDER_MIN } from '@/lib/env.client'
import { getBillingWindow, type BillingWindow } from '@/lib/billing'
import { getMinutesUsed, getCallsUsed } from '@/lib/usage'

const PORTAL_HREF = '/api/billing/portal'
const BUY_SLOT_HREF = PORTAL_HREF // keep upsell consistent with portal

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
  const [showWarning, setShowWarning] = useState(false)
  const [addName, setAddName] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addRelationship, setAddRelationship] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (mounted) window.location.href = '/login'; return }

      // Welcome label: profile full_name preferred, then first/last, then email fallback (small size)
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle()
      const nameFromProfile =
        (prof?.full_name && String(prof.full_name).trim()) ||
        ([prof?.first_name, prof?.last_name].filter(Boolean).join(' ').trim()) ||
        ''
      if (mounted) setDisplayName(nameFromProfile || '')

      // Billing window (subscription) or calendar fallback
      const bw = await getBillingWindow(supabase)
      if (mounted) setWindowInfo(bw)

      // Members list
      const { data: memRows } = await supabase
        .from('members')
        .select('id, name, phone, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (mounted) setMembers(memRows || [])

      // Usage: minutes (via edge fn) and calls (table count) within billing window
      const minutes = await getMinutesUsed(supabase, { start: bw.start, end: bw.end })
      const calls = await getCallsUsed(supabase, { start: bw.start, end: bw.end })
      if (mounted) { setMinutesUsed(minutes); setCallsUsed(calls) }

      // Recent calls (last 5)
      const { data: callRows } = await supabase
        .from('calls')
        .select('id, duration_seconds, started_at, issue_type, phone')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(5)
      if (mounted) setRecentCalls(callRows || [])

      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const callPct = useMemo(() => Math.min(100, Math.round((callsUsed / Math.max(CALLS_LIMIT, 1)) * 100)), [callsUsed])
  const perCallCap = `${PER_CALL_MAX_MIN} min cap • ${SOFT_REMINDER_MIN}-min reminder`

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const beforeCount = members.length
    const { error } = await supabase.from('members').insert({
      user_id: user.id,
      name: addName,
      phone: addPhone,
      relationship: addRelationship || null,
      status: 'active',
      is_primary: false,
    } as any)

    if (!error) {
      setAddName(''); setAddPhone(''); setAddRelationship('')
      const { data: memRows } = await supabase
        .from('members')
        .select('id, name, phone, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setMembers(memRows || [])
      if (beforeCount === 0) setShowWarning(true)
    }
  }

  return (
    <>
      <Head>
        <title>Boroma — Dashboard</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <div className="text-sm text-slate-500">Welcome{displayName ? `, ${displayName}` : ''}</div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Your Boroma dashboard</h1>
          <p className="text-slate-600 mt-2">Manage your plan, members and support number.</p>
          {windowInfo?.source === 'calendar_fallback' && (
            <div className="mt-3 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
              Usage is shown for calendar month until your subscription period is available.
            </div>
          )}
        </header>

        {/* Top analytics */}
        <section className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="border rounded-xl p-5">
            <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Calls used</div>
            <div className="text-2xl font-semibold">{callsUsed} <span className="text-slate-500 text-base">/ {CALLS_LIMIT}</span></div>
            <div className="h-2 bg-slate-100 rounded mt-3">
              <div className="h-2 rounded bg-gradient-to-r from-orange-400 to-orange-500" style={{ width: `${callPct}%` }} />
            </div>
            <a href={BUY_SLOT_HREF} className="inline-block text-sm mt-3 text-[#FF5B04] font-semibold">Buy another member slot →</a>
          </div>

          <div className="border rounded-xl p-5">
            <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Minutes used</div>
            <div className="text-2xl font-semibold">{minutesUsed}<span className="text-slate-500 text-base"> min</span></div>
            <div className="text-slate-600 text-sm mt-1">{perCallCap}</div>
          </div>

          <div className="border rounded-xl p-5">
            <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Billing</div>
            <div className="text-slate-700">
              {windowInfo?.start && windowInfo?.end ? (
                <>
                  Period:{' '}
                  <span className="font-medium">
                    {new Date(windowInfo.start).toLocaleDateString()} — {new Date(windowInfo.end).toLocaleDateString()}
                  </span>
                </>
              ) : '—'}
            </div>
            <a href={PORTAL_HREF} target="_blank" rel="noreferrer" className="btn btn-light mt-3">Manage billing</a>
          </div>
        </section>

        {/* Support number & magnet */}
        <section className="grid md:grid-cols-3 gap-5 mb-8">
          <div className="md:col-span-2 border rounded-xl p-5">
            <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Your support number</div>
            <div className="text-3xl font-bold tracking-tight">{TOLLFREE_DISPLAY}</div>
            <p className="text-slate-600 mt-2">Share this number only with your approved members.</p>
            <div className="flex gap-3 mt-4">
              <button
                className="inline-flex items-center rounded-md border border-slate-300 bg-white text-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                onClick={() => navigator.clipboard?.writeText(TOLLFREE_DISPLAY)}
              >
                Copy number
              </button>
              <a href={PORTAL_HREF} target="_blank" className="inline-flex items-center rounded-md bg-[#111827] text-white px-4 py-2 text-sm font-semibold hover:opacity-95" rel="noreferrer">
                Manage billing
              </a>
            </div>
          </div>

          <div className="border rounded-xl p-5">
            <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Fridge magnet</div>
            <p className="text-slate-700">Print and stick near the phone so it’s always handy:</p>
            <div className="text-center mt-4 border rounded-lg p-4">
              <div className="text-[11px] uppercase text-slate-500">Boroma Support</div>
              <div className="text-2xl font-bold tracking-tight">{TOLLFREE_DISPLAY}</div>
              <div className="text-[12px] text-slate-500 mt-1">Call anytime — 24/7</div>
            </div>
            <a
              href="/boroma-fridge-magnet.pdf"
              download
              className="mt-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Download printable PDF
            </a>
          </div>
        </section>

        {/* Members */}
        <section className="mb-10">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide">Members</div>
              <h2 className="text-xl font-semibold tracking-tight mt-1">24/7 support for approved numbers</h2>
              <p className="text-slate-600 mt-1">Add family members who can call the toll-free number for help.</p>
            </div>
            <a href={BUY_SLOT_HREF} className="inline-flex items-center rounded-md bg-[#111827] text-white px-4 py-2 text-sm font-semibold hover:opacity-95">Buy another member slot</a>
          </div>

          <form onSubmit={addMember} className="border rounded-xl p-5 max-w-lg mt-4">
            <input className="w-full border rounded-xl p-3 mb-3" placeholder="Full name" value={addName} onChange={e=>setAddName(e.target.value)} required />
            <input className="w-full border rounded-xl p-3 mb-3" placeholder="Phone (digits only)" value={addPhone} onChange={e=>setAddPhone(e.target.value)} required />
            <input className="w-full border rounded-xl p-3 mb-3" placeholder="Relationship (optional)" value={addRelationship} onChange={e=>setAddRelationship(e.target.value)} />
            <button className="btn btn-primary">Add member</button>
          </form>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            {members.length === 0 ? (
              <div className="text-slate-500">No members yet.</div>
            ) : (
              members.map(m => (
                <div key={m.id} className="border rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{m.name || 'Member'}</div>
                      <div className="text-slate-600 text-sm">{m.phone}</div>
                    </div>
                    <span className="text-xs rounded-full px-2 py-1 bg-slate-100 border border-slate-200">{m.status || 'active'}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Created {new Date(m.created_at).toLocaleDateString()}</div>
                  {/* Editing disabled — locked until next billing period */}
                </div>
              ))
            )}
          </div>

          {/* First-add warning overlay */}
          {showWarning && (
            <div className="fixed inset-0 z-40 bg-black/50 grid place-items-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold tracking-tight">Number locked until next billing period</h3>
                <p className="text-slate-600 mt-2">
                  This member’s phone number can’t be edited or changed until your next billing period.
                  Double-check and confirm before you add additional members.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button className="btn btn-light" onClick={()=>setShowWarning(false)}>OK</button>
                  <a className="btn btn-primary" href={BUY_SLOT_HREF} onClick={()=>setShowWarning(false)}>Buy another member slot</a>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="mb-8">
          <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-2">Recent activity</div>
          <div className="grid gap-3">
            {recentCalls.length === 0 ? (
              <div className="text-slate-500">No recent calls.</div>
            ) : (
              recentCalls.map(r => (
                <div key={r.id} className="border rounded-xl p-4 flex items-center justify-between">
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

        {/* Bottom actions */}
        <div className="pt-6 border-t border-slate-200">
          <button onClick={handleLogout} className="text-slate-500 hover:text-slate-700 text-sm">
            log out
          </button>
        </div>
      </main>
    </>
  )
}
