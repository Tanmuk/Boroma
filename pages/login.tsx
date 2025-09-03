import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function Login(){
  const router = useRouter()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState<string| null>(null)
  const [loading,setLoading]=useState(false)

  async function onSubmit(e:any){
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/dashboard')
  }

  return (
    <main className="container py-16">
      <div className="max-w-md mx-auto card p-6">
        <h1>Sign in</h1>
        <p className="text-slate-600 mt-1">Please enter your details</p>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={onSubmit} className="mt-4">
          <label className="block text-sm font-medium">Email address</label>
          <input className="w-full border rounded-xl p-3 mt-1 mb-2" type="email"
                 value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>

          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Password</label>
            <Link className="btn-link text-sm" href="/forgot-password">Forgot password?</Link>
          </div>
          <input className="w-full border rounded-xl p-3 mt-1 mb-2" type="password"
                 value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/>

          <button className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Please wait' : 'Sign in'}
          </button>

          <p className="text-sm mt-4">
            Don’t have an account? <Link className="btn-link" href="/signup">Sign up</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
