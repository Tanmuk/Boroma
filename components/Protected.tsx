import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'
export default function Protected({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login?next=/dashboard')
      else setLoading(false)
    })
  }, [router])
  if (loading) return <div className="container py-10">Loading…</div>
  return <>{children}</>
}
