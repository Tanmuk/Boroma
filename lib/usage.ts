import { SupabaseClient } from '@supabase/supabase-js'

export async function getMinutesUsed(
  supabase: SupabaseClient,
  window: { start: Date; end: Date }
): Promise<number> {
  // Try edge function first (auth-aware). It should accept start/end in body.
  try {
    const { data, error } = await supabase.functions.invoke('minutes-used', {
      body: {
        start: window.start.toISOString(),
        end: window.end.toISOString(),
      },
    })
    if (!error && data && typeof data.minutes === 'number') {
      return Math.max(0, Math.round(data.minutes)) // normalize to whole minutes
    }
  } catch (_) {
    // fall through to table aggregation
  }

  // Fallback: sum call durations within window
  const { data: rows } = await supabase
    .from('calls')
    .select('duration_seconds, started_at')
    .gte('started_at', window.start.toISOString())
    .lte('started_at', window.end.toISOString())

  const totalSec = (rows || []).reduce((acc, r: any) => acc + (r.duration_seconds || 0), 0)
  return Math.max(0, Math.round(totalSec / 60))
}

export async function getCallsUsed(
  supabase: SupabaseClient,
  window: { start: Date; end: Date }
): Promise<number> {
  // Use count to avoid loading full rows
  const { count } = await supabase
    .from('calls')
    .select('id', { count: 'exact' })
    .gte('started_at', window.start.toISOString())
    .lte('started_at', window.end.toISOString())

  return count || 0
}
