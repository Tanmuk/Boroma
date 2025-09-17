import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { TOLLFREE_DISPLAY, CALLS_LIMIT, PER_CALL_MAX_MIN, SOFT_REMINDER_MIN } from '@/lib/env.client'

const BUY_SLOT_HREF = '/signup?plan=monthly&slot=1'
const PORTAL_HREF = '/api/billing/portal'

type Member = { id: string; full_name: string | null; phone: string | null; status?: string | null; created_at: string }
type CallRow = { id: string; duration_seconds: number | null; started_at: string }

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [callsThisMonth, setCallsThisMonth] = useState<CallRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (isMounted) window.location.href = '/login'
        return
      }
      if (!isMounted) return
      setUserEmail(user.email ?? null)

      // Load members
      try {
        const { data: rows } = await supabase
          .from('members')
          .select('id, full_name, phone, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (isMounted) setMembers(rows || [])
      } catch {}

      // Load call stats for current calendar month
      try {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const { data: callRows } = await supabase
          .from('calls')
          .select('id, duration_seconds, started_at')
          .eq('user_id', user.id)
          .gte('started_at', start.toISOString())
          .lte('started_at', now.toISOString())
          .order('started_at', { ascending: false })
        if (isMounted) setCallsThisMonth(callRows || [])
      } catch {
        if (isMounted) setCallsThisMonth([])
      }

      if (isMounted) setLoading(false)
    })()
    return () => { isMounted = false }
  }, [])

  const callsUsed = callsThisMonth.length
  const minutesUsed = useMemo(
    () => Math.round((callsThisMonth || []).reduce((acc, r) => acc + (r.duration_seconds || 0), 0) / 60),
    [callsThisMonth]
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      <Head>
        <title>Boroma — Dashboard</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="container max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Welcome{userEmail ? `, ${userEmail}` : ''}</h1>
          <p className="text-slate-600 mt-2">Manage your plan, members and support number.</p>
        </header>

        {/* Analytics cards */}
        <section className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="border rounded-xl p-5">
            <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Calls used</div>
            <div className="text-2xl font-semibold">{callsUsed} <span className="text-slate-500 text-base">/ {CALLS_LIMIT}</span></div>
            <div className="text-slate-600 text-sm mt-1">This month</div>
            <a href={BUY_SLOT_HREF} className="inline-block text-sm mt-3 text-[#FF5B04] font-semibold">Buy another member slot →</a>
          </div>
          <div className="border rounded-xl p-5">
            <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Minutes used</div>
            <div className="text-2xl font-semibold">{minutesUsed}<span className="text-slate-500 text-base"> min</span></div>
            <div className="text-slate-600 text-sm mt-1">Per call: {PER_CALL_MAX_MIN} min cap • {SOFT_REMINDER_MIN}-min reminder</div>
          </div>
          <div className="border rounded-xl p-5">
            <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Billing</div>
            <div className="text-slate-700">Manage payment method, plan, or cancel anytime.</div>
            <a href={PORTAL_HREF} target="_blank" rel="noreferrer" className="btn btn-light mt-3">Manage billing</a>
          </div>
        </section>

        {/* Top: support number + fridge magnet */}
        <section className="grid md:grid-cols-3 gap-5 mb-8">
          <div className="md:col-span-2 border rounded-xl p-5">
            <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Your support number</div>
            <div className="text-3xl font-bold tracking-tight">{TOLLFREE_DISPLAY}</div>
            <p className="text-slate-600 mt-2">Share this number with your approved members only.</p>

            <div className="flex gap-3 mt-4">
              <a
                href={PORTAL_HREF}
                target="_blank"
                className="inline-flex items-center rounded-md bg-[#111827] text-white px-4 py-2 text-sm font-semibold hover:opacity-95 transition"
                rel="noreferrer"
              >
                Manage billing
              </a>
              <Link
                href="/what-we-solve"
                className="inline-flex items-center rounded-md border border-slate-300 bg-white text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition"
              >
                View guides
              </Link>
            </div>
          </div>

          {/* Fridge magnet preview & download */}
          <div className="border rounded-xl p-5">
            <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide mb-1">Fridge magnet</div>
            <p className="text-slate-700">
              Print and stick near the phone so it’s always handy:
            </p>
            <div className="text-center mt-4 border rounded-lg p-4">
              <div className="text-[11px] uppercase text-slate-500">Boroma Support</div>
              <div className="text-2xl font-bold tracking-tight">{TOLLFREE_DISPLAY}</div>
              <div className="text-[12px] text-slate-500 mt-1">Call anytime — 24/7</div>
            </div>
            <a
              href="/api/fridge-magnet"
              className="mt-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Download printable SVG
            </a>
          </div>
        </section>

        {/* Members */}
        <MembersSection />

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

function MembersSection(){
  const [rows,setRows] = useState<Member[]>([])
  const [name,setName]=useState(''); const [phone,setPhone]=useState(''); const [relationship,setRel]=useState('')
  const [showWarning,setShowWarning]=useState(false)

  async function load(){
    const { data:{ user } } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase
      .from('members')
      .select('id, full_name, phone, status, created_at')
      .eq('user_id', user.id)
      .order('created_at',{ascending:false})
    setRows(data||[])
  }
  useEffect(()=>{ load() },[])

  async function addMember(e:any){
    e.preventDefault()
    const { data:{ user } } = await supabase.auth.getUser()
    if(!user) return
    const beforeCount = rows.length
    const { error } = await supabase.from('members').insert({ user_id:user.id, full_name:name, phone, status:'active', relationship })
    if(!error){
      setName(''); setPhone(''); setRel('')
      await load()
      if(beforeCount === 0){
        setShowWarning(true)
      }
    }
  }

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase text-[#FF5B04] font-semibold tracking-wide">Members</div>
          <h2 className="text-xl font-semibold tracking-tight mt-1">24/7 support for approved numbers</h2>
          <p className="text-slate-600 mt-1">Add family members who can call the toll-free number for help.</p>
        </div>
        <a
          href={BUY_SLOT_HREF}
          className="inline-flex items-center rounded-md bg-[#111827] text-white px-4 py-2 text-sm font-semibold hover:opacity-95"
        >
          Buy another member slot
        </a>
      </div>

      <form onSubmit={addMember} className="border rounded-xl p-5 max-w-lg mt-4">
        <input className="w-full border rounded-xl p-3 mb-3" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
        <input className="w-full border rounded-xl p-3 mb-3" placeholder="Phone (digits only)" value={phone} onChange={e=>setPhone(e.target.value)} required />
        <input className="w-full border rounded-xl p-3 mb-3" placeholder="Relationship (optional)" value={relationship} onChange={e=>setRel(e.target.value)} />
        <button className="btn btn-primary">Add member</button>
      </form>

      <div className="mt-4 grid md:grid-cols-2 gap-4">
        {rows.length === 0 ? (
          <div className="text-slate-500">No members yet.</div>
        ) : (
          rows.map((m) => (
            <div key={m.id} className="border rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{m.full_name || 'Member'}</div>
                  <div className="text-slate-600 text-sm">{m.phone}</div>
                </div>
                <span className="text-xs rounded-full px-2 py-1 bg-slate-100 border border-slate-200">{m.status || 'active'}</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">Created {new Date(m.created_at).toLocaleDateString()}</div>
              {/* No edit UI to prevent changes until next billing period */}
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
              This member&apos;s phone number can’t be edited or changed until your next billing period.
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
  )
}
