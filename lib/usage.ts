import { SupabaseClient } from '@supabase/supabase-js'

export async function getMinutesUsed(
  supabase: SupabaseClient,
  window: { start: Date; end: Date }
): Promise<number> {
  // Preferred: Edge function (auth-aware). It should already consider member ownership.
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
  } catch {
    /* fall back below */
  }

  // Fallback: aggregate by member ownership (no reliance on calls.user_id)
  // 1) get my member ids
  const { data: members, error: memErr } = await supabase
    .from('members')
    .select('id')
  if (memErr || !members?.length) return 0
  const memberIds = members.map((m: any) => m.id)

  // 2) sum durations for calls where member_id IN (my members) and within window
  const { data: rows } = await supabase
    .from('calls')
    .select('duration_seconds, started_at, member_id')
    .in('member_id', memberIds)
    .gte('started_at', window.start.toISOString())
    .lte('started_at', window.end.toISOString())

  const sec = (rows || []).reduce((a: number, r: any) => a + (r?.duration_seconds || 0), 0)
  return Math.max(0, Math.round(sec / 60))
}

export async function getCallsUsed(
  supabase: SupabaseClient,
  window: { start: Date; end: Date }
): Promise<number> {
  // Count by member ownership
  const { data: members, error: memErr } = await supabase
    .from('members')
    .select('id')
  if (memErr || !members?.length) return 0
  const memberIds = members.map((m: any) => m.id)

  const { count } = await supabase
    .from('calls')
    .select('id', { count: 'exact' })
    .in('member_id', memberIds)
    .gte('started_at', window.start.toISOString())
    .lte('started_at', window.end.toISOString())

  return count || 0
}
