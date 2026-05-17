import type { Session } from '../db'

/** Local-day key in user's TZ. Format: YYYY-MM-DD. */
export function localDayKey(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(now: number = Date.now()): string {
  return localDayKey(now)
}

/**
 * Derive streak from sessions + grace state.
 * Returns:
 *   - days: current streak (today inclusive if there was activity today,
 *     or yesterday if today is empty but grace covers it)
 *   - graceConsumedToday: whether grace is currently being held to keep the streak alive
 *   - todayCounted: whether today already has activity
 */
export function deriveStreak(
  sessions: Pick<Session, 'startedAt'>[],
  graceUsedOnDate: string | null,
  now: number = Date.now(),
): { days: number; graceHoldsToday: boolean; todayCounted: boolean } {
  const today = todayKey(now)
  const active = new Set<string>()
  for (const s of sessions) active.add(localDayKey(s.startedAt))

  const todayCounted = active.has(today)
  let cursor = new Date(now)
  let days = 0
  let graceHoldsToday = false

  // Walk backward from today
  // Step 1: handle today
  if (todayCounted) {
    days += 1
  } else if (graceUsedOnDate === today) {
    // Grace marks today as held — streak continues from yesterday
    graceHoldsToday = true
  } else {
    return { days: 0, graceHoldsToday: false, todayCounted: false }
  }

  // Step 2: walk back through previous days
  cursor.setDate(cursor.getDate() - 1)
  while (active.has(localDayKey(cursor.getTime()))) {
    days += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return { days, graceHoldsToday, todayCounted }
}

/**
 * Decide if pressing the Hi chip should consume the grace day.
 * Pure helper for higher-level UI to decide whether to update meta.graceUsedOnDate.
 */
export function shouldConsumeGrace(
  sessions: Pick<Session, 'startedAt'>[],
  graceUsedOnDate: string | null,
  now: number = Date.now(),
): boolean {
  const today = todayKey(now)
  if (graceUsedOnDate === today) return false                                  // already held
  if (sessions.some(s => localDayKey(s.startedAt) === today)) return false     // not needed
  // No activity today and grace not yet used → consume to hold streak
  return true
}
