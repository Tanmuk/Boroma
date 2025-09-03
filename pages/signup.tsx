import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

const schema = z.object({
  fullName: z.string().min(2, 'Name looks too short'),
  phone: z.string()
    .transform(v => v.replace(/[^\d+]/g, ''))
    .refine(v => /^\+?\d{10,15}$/.test(v), 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email'),
  password: z.string()
    .min(8, 'Use at least 8 characters')
    .refine(v => /[A-Za-z]/.test(v) && /\d/.test(v), 'Use letters and numbers for a stronger password'),
})

export default function Signup(){
  const router = useRouter()
  const plan = useMemo(() => (router.query.plan === 'annual' ? 'annual' : 'monthly'), [router.query.plan])

  const [values, setValues] = useState({ fullName:'', phone:'', email:'', password:'' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(false)
  function set<K extends keyof typeof values>(k: K, v: string){ setValues(s => ({ ...s, [k]: v })) }

  async function onSubmit(e:any){
    e.preventDefault()
    setErrors({})
    const parsed = schema.safeParse(values)
    if (!parsed.success){
      const errs: Record<string,string> = {}
      for (const issue of parsed.error.issues) errs[(issue.path[0] as string)||'form'] = issue.message
      setErrors(errs); return
    }
    const { fullName, phone, email, password } = parsed.data

    setLoading(true)
    // Create the user account
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName, phone } }
    })
    if (error){
      setLoading(false)
      setErrors({ form: error.message })
      return
    }
    const userId = data.user?.id
    if (!userId){ setLoading(false); setErrors({ form: 'Could not create account' }); return }

    // Start Stripe Checkout
    const r = await fetch('/api/checkout/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, email, userId })
    })
    const j = await r.json()
    setLoading(false)

    if (!j.url){ setErrors({ form: j.error || 'Could not start checkout' }); return }
    window.location.href = j.url
  }

  return (
    <main className="container py-16">
      <div className="max-w-md mx-auto card p-6">
        <h1>Create your account</h1>
        <p className="text-slate-600 mt-1">Enter your own information so that you can manage your plan and add members later</p>

        {errors.form && <div className="mt-3 text-sm text-red-600">{errors.form}</div>}

        <form onSubmit={onSubmit} className="mt-4">
          <label className="block text-sm font-medium">Full name</label>
          <input className="w-full border rounded-xl p-3 mt-1 mb-2" value={values.fullName} onChange={e=>set('fullName', e.target.value)} placeholder="Jane Doe"/>
          {errors.fullName && <p className="text-red-600 text-xs mb-2">{errors.fullName}</p>}

          <label className="block text-sm font-medium">Phone</label>
          <input className="w-full border rounded-xl p-3 mt-1 mb-2" value={values.phone} onChange={e=>set('phone', e.target.value)} placeholder="+1 555 0100"/>
          {errors.phone && <p className="text-red-600 text-xs mb-2">{errors.phone}</p>}

          <label className="block text-sm font-medium">Email address</label>
          <input className="w-full border rounded-xl p-3 mt-1 mb-2" type="email" value={values.email} onChange={e=>set('email', e.target.value)} placeholder="you@example.com"/>
          {errors.email && <p className="text-red-600 text-xs mb-2">{errors.email}</p>}

          <label className="block text-sm font-medium">Password</label>
          <input className="w-full border rounded-xl p-3 mt-1 mb-1" type="password" value={values.password} onChange={e=>set('password', e.target.value)} placeholder="At least 8 chars with letters and numbers"/>
          {errors.password && <p className="text-red-600 text-xs mb-2">{errors.password}</p>}

          <button className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Please wait' : 'Continue to payment'}
          </button>

          <p className="text-xs text-slate-500 mt-3">
            By continuing you agree to our <Link className="btn-link" href="/legal/terms">Terms</Link> and <Link className="btn-link" href="/legal/privacy">Privacy</Link>
          </p>

          <p className="text-sm mt-4">
            Already have an account? <Link className="btn-link" href="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
