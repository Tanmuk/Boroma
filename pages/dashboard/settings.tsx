import Protected from '@/components/Protected'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
export default function Settings(){
  const [name,setName]=useState(''); const [phone,setPhone]=useState('')
  useEffect(()=>{ supabase.auth.getUser().then(async({data:{user}})=>{
    if(!user) return; const { data } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle()
    setName(data?.full_name||''); setPhone(data?.phone||'')
  }) },[])
  async function save(e:any){ e.preventDefault(); const { data:{ user } }=await supabase.auth.getUser(); if(!user) return
    await supabase.from('profiles').update({ full_name:name, phone }).eq('id', user.id); alert('Saved') }
  return (
    <Protected>
      <main className="container py-16">
        <h1>Settings</h1>
        <form onSubmit={save} className="card p-6 max-w-lg mt-6">
          <input className="w-full border rounded-xl p-3 mb-3" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="w-full border rounded-xl p-3 mb-3" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
          <button className="btn btn-primary">Save</button>
        </form>
      </main>
    </Protected>
  )
}
