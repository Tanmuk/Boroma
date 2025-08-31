import Protected from '@/components/Protected'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Calls(){
  const [rows,setRows]=useState<any[]>([])
  useEffect(()=>{ supabase.auth.getUser().then(async({data:{user}})=>{
    if(!user) return; const { data } = await supabase.from('calls').select('*').eq('user_id', user.id).order('started_at',{ascending:false}); setRows(data||[])
  }) },[])
  return (
    <Protected>
      <main className="container py-16">
        <h1>Call history</h1>
        <div className="mt-6 grid gap-3">
          {rows.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{r.issue_type || 'General help'}</div>
                  <div className="text-sm text-slate-500">{new Date(r.started_at).toLocaleString()} • {r.phone||'unknown'}</div>
                </div>
                <div className="text-right text-sm">{r.duration_seconds?Math.round(r.duration_seconds/60):0} min</div>
              </div>
              {r.transcript_url && <a className="text-xs text-primary-500" href={r.transcript_url} target="_blank">Transcript</a>}
            </div>
          ))}
        </div>
      </main>
    </Protected>
  )
}
