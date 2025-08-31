import Protected from '@/components/Protected'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Members(){
  const [rows,setRows]=useState<any[]>([])
  const [name,setName]=useState(''); const [phone,setPhone]=useState(''); const [relationship,setRel]=useState('')
  async function load(){ const { data:{ user } }=await supabase.auth.getUser(); if(!user) return
    const { data } = await supabase.from('members').select('*').eq('user_id', user.id).order('created_at',{ascending:false}); setRows(data||[]) }
  useEffect(()=>{ load() },[])
  async function addMember(e:any){ e.preventDefault(); const { data:{ user } }=await supabase.auth.getUser(); if(!user) return
    await supabase.from('members').insert({ user_id:user.id, name, phone, relationship }); setName(''); setPhone(''); setRel(''); load() }
  return (
    <Protected>
      <main className="container py-16">
        <h1>Members</h1>
        <form onSubmit={addMember} className="card p-6 max-w-lg mt-6">
          <input className="w-full border rounded-xl p-3 mb-3" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />
          <input className="w-full border rounded-xl p-3 mb-3" placeholder="Phone (+1…)" value={phone} onChange={e=>setPhone(e.target.value)} required />
          <input className="w-full border rounded-xl p-3 mb-3" placeholder="Relationship (self, spouse, parent…)" value={relationship} onChange={e=>setRel(e.target.value)} />
          <button className="btn btn-primary">Add member</button>
        </form>
        <div className="mt-6 grid gap-3">
          {rows.map(r=>(<div key={r.id} className="card p-5 flex justify-between"><div><div className="font-medium">{r.name}</div><div className="text-sm text-slate-500">{r.phone} • {r.relationship||'—'}</div></div></div>))}
        </div>
      </main>
    </Protected>
  )
}
