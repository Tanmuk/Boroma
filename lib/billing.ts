import { SupabaseClient } from '@supabase/supabase-js'

export type BillingWindow = {
  start: Date
  end: Date
  source: 'subscription' | 'calendar_fallback'
  seat_count?: number | null
  plan?: string | null
  status?: string | null
}

export async function getBillingWindow(supabase: SupabaseClient): Promise<BillingWindow> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // caller should already gate auth, but keep a safe fallback
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start, end: now, source: 'calendar_fallback' }
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('current_period_start, current_period_end, seat_count, status, plan')
    .eq('user_id', user.id)
    .order('current_period_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data?.current_period_start || !data?.current_period_end) {
    // Fallback to calendar month if subscription row is not present yet
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start, end: now, source: 'calendar_fallback' }
  }

  return {
    start: new Date(data.current_period_start),
    end: new Date(data.current_period_end),
    source: 'subscription',
    seat_count: data.seat_count ?? null,
    plan: data.plan ?? null,
    status: data.status ?? null,
  }
}
