import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPassword(){
  const [email,setEmail]=useState('')
  const [msg,setMsg]=useState<string| null>(null)
  const [err,setErr]=useState<string| null>(null)

  async function onSubmit(e:any){
    e.preventDefault()
    setMsg(null); setErr(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    })
    if (error) { setErr(error.message); return }
    setMsg('Check your email for a reset link')
  }

  return (
    <main className="container py-16">
      <div className="max-w-md mx-auto card p-6">
        <h1>Reset password</h1>
        <p className="text-slate-600 mt-1">We will email you a link to reset it</p>
        {msg && <div className="mt-3 text-sm text-green-700">{msg}</div>}
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
        <form onSubmit={onSubmit} className="mt-4">
          <label className="block text-sm font-medium">Email address</label>
          <input className="w-full border rounded-xl p-3 mt-1 mb-2" type="email"
                 value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/>
          <button className="btn btn-primary w-full mt-2">Send reset link</button>
        </form>
      </div>
    </main>
  )
}
