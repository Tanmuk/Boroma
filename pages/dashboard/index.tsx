import Protected from '@/components/Protected'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Call = { id:string; user_id:string|null; phone:string|null; started_at:string; ended_at:string|null; duration_seconds:number|null; issue_type:string|null; resolved:boolean|null }
type Member = { id:string; name:string; phone:string; relationship:string|null }

export default function Dashboard(){
  const [calls,setCalls]=useState<Call[]>([])
  const [members,setMembers]=useState<Member[]>([])
  const [plan,setPlan]=useState<string>('Unlimited Support')
  const [status,setStatus]=useState<string>('inactive')
  const [minutesMonth,setMinutesMonth]=useState<number>(0)
  const [totalCallsMonth,setTotalCallsMonth]=useState<number>(0)

  useEffect(()=>{(async()=>{
    const { data:{ user } } = await supabase.auth.getUser(); if(!user) return

    const { data: subs } = await supabase.from('subscriptions')
      .select('status, plan, current_period_end').eq('user_id', user.id).order('current_period_end', { ascending:false }).limit(1)
    if (subs && subs.length>0) { setPlan(subs[0].plan || 'Unlimited Support'); setStatus(subs[0].status || 'inactive') }

    const { data: callsData } = await supabase.from('calls').select('*').eq('user_id', user.id).order('started_at', { ascending:false })
    setCalls(callsData||[])

    const { data: mins } = await supabase.rpc('minutes_used_current_month')
    setMinutesMonth((mins as number)||0)

    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
    setTotalCallsMonth((callsData||[]).filter(c => new Date(c.started_at) >= monthStart).length)

    const { data: mems } = await supabase.from('members').select('*').eq('user_id', user.id).order('created_at', { ascending:false })
    setMembers(mems||[])
  })()},[])

  const memberStats = useMemo(()=>{
    const byPhone = new Map<string,{minutes:number,last?:string,scamCount:number,callCount:number}>()
    for (const m of members){ byPhone.set(m.phone, {minutes:0, last:undefined, scamCount:0, callCount:0}) }
    for (const c of calls){
      const p = c.phone||''; if(!byPhone.has(p)) continue
      const entry = byPhone.get(p)!
      entry.minutes += Math.round(((c.duration_seconds||0)/60))
      entry.callCount += 1
      if (!entry.last || new Date(c.started_at) > new Date(entry.last)) entry.last = c.started_at
      if ((c.issue_type||'').toLowerCase().includes('scam')) entry.scamCount += 1
    }
    return byPhone
  },[calls, members])

  return (
    <Protected>
      <main className="container py-10">
        <h1>Dashboard</h1>
        <div className="grid md:grid-cols-4 gap-6 mt-6">
          <div className="card p-6">
            <div className="text-sm text-slate-500">Plan</div>
            <div className="text-2xl font-semibold">{plan}</div>
            <div className="text-xs text-slate-500">Status: {status}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-slate-500">Minutes used this month</div>
            <div className="text-3xl font-semibold">{minutesMonth} min</div>
            <div className="text-xs text-slate-500">Friendly reminder at 25 min, cap at 35 min per call.</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-slate-500">Total calls this month</div>
            <div className="text-3xl font-semibold">{totalCallsMonth}</div>
            <div className="text-xs text-slate-500">Includes every member on your plan.</div>
          </div>
          <a href="/dashboard/billing" className="card p-6 hover:bg-slate-50">
            <div className="text-sm text-slate-500">Billing</div>
            <div className="text-3xl font-semibold">Manage</div>
            <div className="text-xs text-slate-500">Update payment & switch plans</div>
          </a>
        </div>

        <h2 className="mt-10">Loved ones</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {members.length===0? <div className="text-slate-500">No members yet. Add them on the Members page.</div> :
            members.map(m => {
              const s = memberStats.get(m.phone) || { minutes:0, last: undefined, scamCount:0, callCount:0 }
              return (
                <div key={m.id} className="card p-5">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{m.name} <span className="text-slate-400 text-sm">({m.relationship||'member'})</span></div>
                      <div className="text-sm text-slate-500">{m.phone}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div><b>{s.minutes}</b> min used</div>
                      <div>{s.callCount} calls</div>
                      <div className={s.scamCount>0?'text-red-600':'text-slate-500'}>{s.scamCount} scam checks</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Last call: {s.last? new Date(s.last).toLocaleString() : '—'}</div>
                </div>
              )
            })
          }
        </div>

        <h2 className="mt-10">Recent calls</h2>
        <div className="mt-4 grid gap-3">
          {calls.length===0? <div className="text-slate-500">No calls yet.</div> :
            calls.slice(0,8).map(c => (
              <div key={c.id} className="card p-5 flex justify-between">
                <div>
                  <div className="font-medium">{c.issue_type || 'General help'}</div>
                  <div className="text-sm text-slate-500">{new Date(c.started_at).toLocaleString()} • {c.phone||'unknown'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{c.duration_seconds?Math.round(c.duration_seconds/60):0} min</div>
                  <div className="text-xs text-slate-500">{c.resolved?'Resolved':'Pending'}</div>
                </div>
              </div>
            ))
          }
        </div>
      </main>
    </Protected>
  )
}
