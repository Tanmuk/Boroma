import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function Signup(){
  const router = useRouter()
  const plan = useMemo(() => {
    const p = (router.query.plan as string) || 'monthly'
    return p === 'annual' ? 'annual' : 'monthly'
  }, [router.query.plan])

  const [fullName,setFullName]=useState('')
  const [phone,setPhone]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false)

  async function onSubmit(e:any){
    e.preventDefault()
    setLoading(true)

    // 1) Create the user account
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, phone } }
    })
    if (error) { setLoading(false); alert(error.message); return }

    const userId = data.user?.id
    if (!userId) { setLoading(false); alert('Could not create account'); return }

    // 2) Open Stripe Checkout (server creates the session)
    const r = await fetch('/api/checkout/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, email, userId })
    })
    const j = await r.json()
    setLoading(false)

    if (!j.url) { alert('Could not start checkout'); return }
    window.location.href = j.url // to Stripe
  }

  return (
    <main className="container py-16">
      <h1>Create your account</h1>
      <form onSubmit={onSubmit} className="card mt-6 max-w-md p-6">
        <input className="w-full border rounded-xl p-3 mb-3" placeholder="Full name"
               value={fullName} onChange={e=>setFullName(e.target.value)} required />
        <input className="w-full border rounded-xl p-3 mb-3" placeholder="Your phone"
               value={phone} onChange={e=>setPhone(e.target.value)} required />
        <input className="w-full border rounded-xl p-3 mb-3" type="email" placeholder="Email"
               value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full border rounded-xl p-3 mb-3" type="password" placeholder="Password"
               value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Please wait' : 'Continue to payment'}
        </button>
        <p className="text-xs text-slate-500 mt-2">
          Plan: {plan === 'annual' ? 'Annual (save 30%)' : 'Monthly'}
        </p>
      </form>
    </main>
  )
}
