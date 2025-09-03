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
  password: z.string().min(8, 'Use at least 8 characters'),
  confirm: z.string().min(8, 'Confirm your password')
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

export default function Signup(){
  const router = useRouter()
  const plan = useMemo(() => {
    const p = (router.query.plan as string) || 'monthly'
    return p === 'annual' ? 'annual' : 'monthly'
  }, [router.query.plan])

  const [values, setValues] = useState({ fullName:'', phone:'', email:'', password:'', confirm:'' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  function set<K extends keyof typeof values>(k: K, v: string){
    setValues(s => ({ ...s, [k]: v }))
  }

  async function onSubmit(e:any){
    e.preventDefault()
    setErrors({})
    const parsed = schema.safeParse(values)
    if (!parsed.success){
      const errs: Record<string,string> = {}
      for (const issue of parsed.error.issues) {
        const key = (issue.path[0] as string) || 'form'
        errs[key] = issue.message
      }
      setErrors(errs); return
    }

    const { fullName, phone, email, password } = parsed.data
    setLoading(true)

    // Create account in Supabase
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName, phone } }
    })
    if (error) { setLoading(false); setErrors({ form: error.message }); return }

    const userId = data.user?.id
    if (!userId) { setLoading(false); setErrors({ form: 'Could not create account' }); return }

    // Start Stripe Checkout
    const r = await fetch('/api/checkout/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, email, userId })
    })
    const j = await r.json()
    setLoading(false)

    if (!j.url) { setErrors({ form: j.error || 'Could not start checkout' }); return }
    window.location.href = j.url
  }

  return (
    <main className="container py-16">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Left column: Sign up form */}
        <div className="card p-6">
          <button type="button" className="text-slate-500 text-sm mb-2" onClick={()=>router.back()} aria-label="Back">←</button>
          <h1>Sign up</h1>
          <p className="text-slate-600 mt-1">Please provide your details</p>

          {errors.form && <div className="mt-3 text-sm text-red-600">{errors.form}</div>}

          <form onSubmit={onSubmit} className="mt-4">
            <label className="block text-sm font-medium">Full name</label>
            <input className="w-full border rounded-xl p-3 mt-1 mb-2"
                   value={values.fullName} onChange={e=>set('fullName', e.target.value)} placeholder="Jane Doe"/>
            {errors.fullName && <p className="text-red-600 text-xs mb-2">{errors.fullName}</p>}

            <label className="block text-sm font-medium">Phone</label>
            <input className="w-full border rounded-xl p-3 mt-1 mb-2"
                   value={values.phone} onChange={e=>set('phone', e.target.value)} placeholder="+1 555 0100"/>
            {errors.phone && <p className="text-red-600 text-xs mb-2">{errors.phone}</p>}

            <label className="block text-sm font-medium">Email address</label>
            <input className="w-full border rounded-xl p-3 mt-1 mb-2" type="email"
                   value={values.email} onChange={e=>set('email', e.target.value)} placeholder="you@example.com"/>
            {errors.email && <p className="text-red-600 text-xs mb-2">{errors.email}</p>}

            <label className="block text-sm font-medium">Password</label>
            <div className="relative mt-1 mb-2">
              <input className="w-full border rounded-xl p-3 pr-10"
                     type={showPw ? 'text' : 'password'}
                     value={values.password} onChange={e=>set('password', e.target.value)} placeholder="At least 8 characters"/>
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"
                      onClick={()=>setShowPw(s=>!s)}>{showPw ? 'Hide' : 'Show'}</button>
            </div>
            {errors.password && <p className="text-red-600 text-xs mb-2">{errors.password}</p>}

            <label className="block text-sm font-medium">Repeat password</label>
            <input className="w-full border rounded-xl p-3 mt-1 mb-2" type="password"
                   value={values.confirm} onChange={e=>set('confirm', e.target.value)} placeholder="Repeat password"/>
            {errors.confirm && <p className="text-red-600 text-xs mb-2">{errors.confirm}</p>}

            <button className="btn btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Please wait' : 'Continue to payment'}
            </button>

            <p className="text-xs text-slate-500 mt-2">
              Plan, {plan === 'annual' ? 'Annual, save 30%' : 'Monthly'}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              By continuing you agree to our <Link className="btn-link" href="/legal/terms">Terms</Link> and <Link className="btn-link" href="/legal/privacy">Privacy</Link>
            </p>

            <p className="text-sm mt-4">
              Already have an account? <Link className="btn-link" href="/login">Sign in</Link>
            </p>
          </form>
        </div>

        {/* Right column: Sign in card to match the reference look */}
        <div className="card p-6">
          <h2>Sign in</h2>
          <p className="text-slate-600 mt-1">If you already have an account</p>
          <Link href="/login" className="btn btn-outline w-full mt-4">Go to Sign in</Link>
          <div className="text-sm text-slate-500 mt-3">
            Forgot your password? <Link className="btn-link" href="/forgot-password">Reset it</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
