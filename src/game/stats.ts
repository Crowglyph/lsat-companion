import type { Session, Attempt } from '../db'

export interface LifetimeStats {
  totalStudyMin: number
  sessionCount: number
  drillCount: number
  lrMin: number
  rcMin: number
  pomodoroMin: number
  externalMin: number
  lifetimeAccuracyPct: number | null
}

export function deriveLifetimeStats(
  sessions: Session[],
  attempts: Attempt[],
): LifetimeStats {
  let totalStudyMin = 0
  let lrMin = 0
  let rcMin = 0
  let pomodoroMin = 0
  let externalMin = 0
  for (const s of sessions) {
    totalStudyMin += s.durationMin
    if (s.sectionTag === 'LR') lrMin += s.durationMin
    else if (s.sectionTag === 'RC') rcMin += s.durationMin
    if (s.type === 'pomodoro') pomodoroMin += s.durationMin
    else if (s.type === 'external') externalMin += s.durationMin
  }
  let lifetimeAccuracyPct: number | null = null
  if (attempts.length) {
    const correct = attempts.filter(a => a.chosenIdx === a.correctIdx).length
    lifetimeAccuracyPct = Math.round((correct / attempts.length) * 100)
  }
  return {
    totalStudyMin,
    sessionCount: sessions.length,
    drillCount: attempts.length,
    lrMin,
    rcMin,
    pomodoroMin,
    externalMin,
    lifetimeAccuracyPct,
  }
}

/** Last interaction = most recent session end time. */
export function lastInteractionAt(sessions: Pick<Session, 'endedAt'>[]): number | null {
  if (!sessions.length) return null
  let max = 0
  for (const s of sessions) if (s.endedAt > max) max = s.endedAt
  return max || null
}
