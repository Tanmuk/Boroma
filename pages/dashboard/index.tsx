import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type SubRow = {
  status: string | null
  current_period_end: string | null
  plan: string | null
}
type Member = { id: string; name: string; phone: string }

export default function Dashboard(){
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [sub, setSub] = useState<SubRow | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [mName, setMName] = useState('')
  const [mPhone, setMPhone] = useState('')
  const phone = process.env.NEXT_PUBLIC_PRIMARY_PHONE || '+1-555-0100'

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)

      // subscription status
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('status,current_period_end,plan')
        .eq('user_id', user.id)
        .order('current_period_end', { ascending: false })
        .limit(1)
      setSub(subs?.[0] ?? null)

      // members list
      await refreshMembers(user.id)

      setLoading(false)
    })()
  }, [])

  async function refreshMembers(uid: string){
    const { data } = await supabase.from('members').select('id,name,phone').eq('user_id', uid).order('created_at', { ascending: true })
    setMembers(data || [])
  }

  async function addMember(e:any){
    e.preventDefault()
    if (!userId) return
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

  const active = sub?.status === 'active' || sub?.status === 'trialing'

  if (loading) return <main className="container py-16"><div className="card p-6">Loading…</div></main>

  return (
    <main className="container py-8 space-y-10">
      {/* Top banner with number and magnet */}
      <section className="card p-6">
        <div className="text-sm text-slate-600">Your support number</div>
        <div className="text-3xl md:text-4xl font-extrabold" style={{color:'#FF5B04'}}>{phone}</div>
        <div className="mt-3 flex gap-3">
          <a className="btn btn-primary" href="/api/fridge-magnet">Download fridge magnet</a>
          <span className="text-sm text-slate-500 self-center">Print and stick on the fridge</span>
        </div>
      </section>

      {/* Plan status */}
      <section className="card p-6">
        <h2>Plan</h2>
        <p className="mt-2">
          Status: <b className={active ? 'text-green-700' : 'text-red-700'}>{active ? 'Active' : 'Inactive'}</b>
        </p>
        {sub?.current_period_end && (
          <p className="text-slate-600 mt-1 text-sm">
            Renews: {new Date(sub.current_period_end).toLocaleDateString()}
          </p>
        )}
        <div className="mt-4">
          <a className="btn btn-outline" href={process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL || '#'}>Open billing portal</a>
        </div>
      </section>

      {/* Members management */}
      <section className="card p-6">
        <h2>Members</h2>
        <p className="text-slate-600 mt-1">Add the phone numbers that are allowed unlimited support</p>
        <form onSubmit={addMember} className="mt-4 grid md:grid-cols-[1fr_280px_auto] gap-3">
          <input className="border rounded-xl p-3" placeholder="Name" value={mName} onChange={e=>setMName(e.target.value)} />
          <input className="border rounded-xl p-3" placeholder="Phone e.g. +15550100" value={mPhone} onChange={e=>setMPhone(e.target.value)} />
          <button className="btn btn-primary">Add member</button>
        </form>

        <div className="mt-4">
          {members.length === 0 ? (
            <div className="text-slate-600">No members yet</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {members.map(m => (
                <li key={m.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{m.name || 'Member'}</div>
                    <div className="text-sm text-slate-600">{m.phone}</div>
                  </div>
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
