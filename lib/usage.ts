import { SupabaseClient } from '@supabase/supabase-js'

export async function getMinutesUsed(
  supabase: SupabaseClient,
  window: { start: Date; end: Date }
): Promise<number> {
  // Preferred: Edge function (auth-aware)
  try {
    const { data, error } = await supabase.functions.invoke('minutes-used', {
      body: {
        start: window.start.toISOString(),
        end: window.end.toISOString(),
      },
    })
    if (!error && data && typeof data.minutes === 'number') {
      return Math.max(0, Math.round(data.minutes))
    }
  } catch (_) { /* fallback below */ }

  // Fallback: sum calls within window
  const { data: rows } = await supabase
    .from('calls')
    .select('duration_seconds, started_at')
    .gte('started_at', window.start.toISOString())
    .lte('started_at', window.end.toISOString())

  const sec = (rows || []).reduce((a: number, r: any) => a + (r?.duration_seconds || 0), 0)
  return Math.max(0, Math.round(sec / 60))
}

export async function getCallsUsed(
  supabase: SupabaseClient,
  window: { start: Date; end: Date }
): Promise<number> {
  const { count } = await supabase
    .from('calls')
    .select('id', { count: 'exact' })
    .gte('started_at', window.start.toISOString())
    .lte('started_at', window.end.toISOString())
  return count || 0
}
