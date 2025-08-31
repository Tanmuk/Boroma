import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Signup(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('')
  const [fullName,setFullName]=useState(''); const [phone,setPhone]=useState('')
  const [loading,setLoading]=useState(false); const router=useRouter()
  async function onSubmit(e:any){ e.preventDefault(); setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ full_name: fullName, phone }}})
    setLoading(false); if(error) alert(error.message); else router.push('/dashboard')
  }
  return (
    <main className="container py-16">
      <h1>Create your account</h1>
      <form onSubmit={onSubmit} className="card mt-6 max-w-md p-6">
        <input className="w-full border rounded-xl p-3 mb-3" placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} required />
        <input className="w-full border rounded-xl p-3 mb-3" type="tel" placeholder="Phone number" value={phone} onChange={e=>setPhone(e.target.value)} required />
        <input className="w-full border rounded-xl p-3 mb-3" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full border rounded-xl p-3 mb-3" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="btn btn-primary w-full" disabled={loading}>{loading?'…':'Create account'}</button>
      </form>
    </main>
  )
}
