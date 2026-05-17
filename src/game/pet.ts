import { HI_BUMP, HUNGER_DECAY_HOURS, MOOD_HALFLIFE_HOURS } from './balance'

export type PetExpression = 'sleepy' | 'content' | 'happy' | 'studying'

const HOUR = 1000 * 60 * 60

/** Hunger: 1.0 = just fed, 0.0 = starving. Linear decay. */
export function hungerNow(lastFedAt: number | null, now: number = Date.now()): number {
  if (lastFedAt == null) return 0
  const hours = (now - lastFedAt) / HOUR
  return Math.max(0, Math.min(1, 1 - hours / HUNGER_DECAY_HOURS))
}

/** Mood: 1.0 = thriving, 0.0 = neglected. Exponential decay since last interaction. */
export function moodNow(
  lastInteractionAt: number | null,
  lastSayHiAt: number | null,
  now: number = Date.now(),
): number {
  if (lastInteractionAt == null) return 0.3   // a fresh hatchling is unsure
  const hours = (now - lastInteractionAt) / HOUR
  const decay = Math.pow(0.5, hours / MOOD_HALFLIFE_HOURS)
  // Optional Hi bump if used today and still recent
  let bump = 0
  if (lastSayHiAt != null) {
    const hoursSinceHi = (now - lastSayHiAt) / HOUR
    if (hoursSinceHi < 4) bump = HI_BUMP * (1 - hoursSinceHi / 4)
  }
  return Math.max(0, Math.min(1, decay + bump))
}

/** Pick a face expression from derived hunger + mood. */
export function expressionFor(hunger: number, mood: number, isStudying = false): PetExpression {
  if (isStudying) return 'studying'
  if (mood < 0.2 || hunger < 0.15) return 'sleepy'
  if (mood > 0.7 && hunger > 0.5) return 'happy'
  return 'content'
}
