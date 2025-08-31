import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [loading,setLoading]=useState(false)
  const router=useRouter()
  async function onSubmit(e:any){ e.preventDefault(); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if(error) alert(error.message); else router.push('/dashboard')
  }
  return (
    <main className="container py-16">
      <h1>Log in</h1>
      <form onSubmit={onSubmit} className="card mt-6 max-w-md p-6">
        <input className="w-full border rounded-xl p-3 mb-3" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full border rounded-xl p-3 mb-3" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="btn btn-primary w-full" disabled={loading}>{loading?'…':'Log in'}</button>
      </form>
    </main>
  )
}
