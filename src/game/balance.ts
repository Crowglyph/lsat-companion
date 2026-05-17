// All tunable constants in one place.

// Hunger decays linearly from 1.0 → 0 over this many hours since lastFedAt.
// At ~36h with no interaction, the pet looks fully hungry.
export const HUNGER_DECAY_HOURS = 36

// Mood is a slower curve over multiple days; missing a day drops it noticeably.
export const MOOD_HALFLIFE_HOURS = 18

// "Hi" chip mood bump (additive to derived mood, clamped to 1).
export const HI_BUMP = 0.15

// Session minute caps
export const POMODORO_LENGTHS = [15, 25] as const
export const EXTERNAL_MIN_CAP = 90
export const EXTERNAL_MIN_STEP = 5

// Tier thresholds in total study minutes — deferred UI for tiers, but stored
// here so visual evolution can read them when added.
export const TIER_THRESHOLDS = {
  hatchling: 0,
  studious: 60,
  robed: 600,
  barred: 3000,
} as const

export type TierKey = keyof typeof TIER_THRESHOLDS

export function tierFor(totalMin: number): TierKey {
  if (totalMin >= TIER_THRESHOLDS.barred) return 'barred'
  if (totalMin >= TIER_THRESHOLDS.robed) return 'robed'
  if (totalMin >= TIER_THRESHOLDS.studious) return 'studious'
  return 'hatchling'
}
