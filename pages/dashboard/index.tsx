import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type SubRow = {
  status: string | null
  current_period_end: string | null
  plan: string | null
  seat_count: number | null
  stripe_customer_id?: string | null
}
type Member = { id: string; name: string; phone: string }
type CallRow = { id: string; seconds: number | null; created_at: string }

export default function Dashboard(){
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [sub, setSub] = useState<SubRow | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [calls, setCalls] = useState<CallRow[]>([])
  const [mName, setMName] = useState('')
  const [mPhone, setMPhone] = useState('')
  const phone = process.env.NEXT_PUBLIC_PRIMARY_PHONE || '+1-555-0100'
  const portal = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL || 'https://billing.stripe.com/p/login/5kA7tX49H7PNbAs288'

  useEffect(() => {
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!user || error) { window.location.href = '/login'; return }
      setUserId(user.id)

      const { data: sess } = await supabase.auth.getSession()
      setSessionToken(sess?.session?.access_token || null)

      const { data: subs } = await supabase
        .from('subscriptions')
        .select('status,current_period_end,plan,seat_count,stripe_customer_id')
        .eq('user_id', user.id)
        .order('current_period_end', { ascending: false })
        .limit(1)
      setSub(subs?.[0] ?? null)

      await refreshMembers(user.id)
      await refreshCalls(user.id)

      setLoading(false)
    })()
  }, [])

  async function refreshMembers(uid: string){
    const { data } = await supabase.from('members').select('id,name,phone').eq('user_id', uid).order('created_at', { ascending: true })
    setMembers(data || [])
  }
  async function refreshCalls(uid: string){
    const { data } = await supabase.from('calls').select('id,seconds,created_at').eq('user_id', uid).order('created_at', { ascending: false })
    setCalls(data || [])
  }

  async function addMember(e:any){
    e.preventDefault()
    if (!userId) return
    const seatLimit = sub?.seat_count ?? 1
    if (members.length >= seatLimit) {
      alert('Member limit reached. Use “Buy another member slot” to add more.')
      return
    }
    const cleaned = mPhone.replace(/[^\d+]/g, '')
    if (!/^\+?\d{10,15}$/.test(cleaned)) { alert('Enter a valid phone'); return }
    const { error } = await supabase.from('members').insert({ user_id: userId, name: mName || 'Family member', phone: cleaned })
    if (!error){ setMName(''); setMPhone(''); refreshMembers(userId) }
  }

  async function removeMember(id: string){
    if (!userId) return
    await supabase.from('members').delete().eq('id', id).eq('user_id', userId)
    refreshMembers(userId)
  }

  async function openPortalForSeats(){
    if (!sessionToken) { window.location.href = portal; return }
    const r = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    })
    const j = await r.json()
    if (j.url) window.location.href = j.url
    else alert(j.error || 'Could not open billing portal')
  }

  // Analytics
  const totalCalls = calls.length
  const totalMinutes = useMemo(() => Math.round(calls.reduce((s,c)=>s+(c.seconds||0),0)/60), [calls])
  const monthMinutes = useMemo(() => {
    const first = new Date(); first.setDate(1); first.setHours(0,0,0,0)
    return Math.round(calls.filter(c => new Date(c.created_at) >= first).reduce((s,c)=>s+(c.seconds||0),0)/60)
  }, [calls])

  const active = sub?.status === 'active' || sub?.status === 'trialing'
  const seatLimit = sub?.seat_count ?? 1
  const seatsUsed = members.length
  const full = seatsUsed >= seatLimit

  if (loading) return <main className="container py-16"><div className="card p-6">Loading…</div></main>

  return (
    <main className="container py-8 space-y-10">
      {/* Support number + magnet */}
      <section className="card p-6">
        <div className="text-sm text-slate-600">Your support number</div>
        <div className="text-3xl md:text-4xl font-extrabold" style={{color:'#FF5B04'}}>{phone}</div>
        <div className="mt-3 flex gap-3">
          <a className="btn btn-primary" href="/api/fridge-magnet">Download fridge magnet</a>
          <span className="text-sm text-slate-500 self-center">Print and stick on the fridge</span>
        </div>
      </section>

      {/* Plan */}
      <section className="card p-6">
        <h2>Plan</h2>
        <p className="mt-2">Status: <b className={active ? 'text-green-700' : 'text-red-700'}>{active ? 'Active' : 'Inactive'}</b></p>
        {sub?.current_period_end && (<p className="text-slate-600 mt-1 text-sm">Renews: {new Date(sub.current_period_end).toLocaleDateString()}</p>)}
        <div className="mt-4 flex gap-3 flex-wrap">
          <button className="btn btn-outline" onClick={openPortalForSeats}>Buy another member slot</button>
          <a className="btn btn-outline" href={portal}>Manage billing</a>
          <button className="btn btn-outline" onClick={()=>window.location.reload()}>Refresh status</button>
        </div>
      </section>

      {/* Analytics */}
      <section className="card p-6">
        <h2>Analytics</h2>
        <div className="grid md:grid-cols-3 gap-4 mt-3">
          <div className="border rounded-xl p-4"><div className="text-sm text-slate-600">Calls this month</div><div className="text-2xl font-semibold">{calls.filter(c => new Date(c.created_at).getMonth() === new Date().getMonth()).length}</div></div>
          <div className="border rounded-xl p-4"><div className="text-sm text-slate-600">Minutes this month</div><div className="text-2xl font-semibold">{monthMinutes}</div></div>
          <div className="border rounded-xl p-4"><div className="text-sm text-slate-600">Total minutes</div><div className="text-2xl font-semibold">{totalMinutes}</div></div>
        </div>
      </section>

      {/* Members */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2>Members</h2>
          <div className="text-sm text-slate-600"> {seatsUsed} of {seatLimit}</div>
        </div>
        <p className="text-slate-600 mt-1">Add the phone numbers that are allowed unlimited support</p>

        <form onSubmit={addMember} className="mt-4 grid md:grid-cols-[1fr_280px_auto] gap-3">
          <input className="border rounded-xl p-3" placeholder="Name" value={mName} onChange={e=>setMName(e.target.value)} />
          <input className="border rounded-xl p-3" placeholder="Phone e.g. +15550100" value={mPhone} onChange={e=>setMPhone(e.target.value)} />
          <button className="btn btn-primary" disabled={full}>{ full ? 'Limit reached' : 'Add member' }</button>
        </form>

        {full && (
          <div className="mt-3 text-sm text-slate-600">
            You’ve used all your member slots. Click <button className="btn-link" onClick={openPortalForSeats}>Buy another member slot</button> to add more.
          </div>
        )}

        <div className="mt-4">
          {members.length === 0 ? <div className="text-slate-600">No members yet</div> : (
            <ul className="divide-y divide-slate-200">
              {members.map(m => (
                <li key={m.id} className="py-3 flex items-center justify-between">
                  <div><div className="font-semibold">{m.name || 'Member'}</div><div className="text-sm text-slate-600">{m.phone}</div></div>
                  <button className="btn btn-outline" onClick={()=>removeMember(m.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
