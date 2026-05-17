// Drill content lives in /drills.json (a static asset in public/), generated
// by scripts/seed-from-hf.mjs from HuggingFace's tasksource/lsat-lr and
// tasksource/lsat-rc datasets.
//
// At ~14 MB raw, it's too large for the JS bundle — we lazy-fetch on demand
// and rely on the service worker to cache it after first load.

import meta from './drills-meta.json'

export type DrillType = 'LR' | 'RC'

export interface Drill {
  id: string
  source: string            // e.g. "PT 3 · LR1 Q1"
  type: DrillType
  stimulus: string
  stem: string
  choices: string[]         // exactly 5
  correctIdx: number        // 0-4
  explanationUrl?: string
}

interface Bundle {
  generatedAt: string
  source: string
  counts: { lr: number; rc: number; total: number }
  drills: Drill[]
}

export const DRILL_COUNTS = meta.counts
export const DRILLS_AVAILABLE = meta.counts.total > 0

let _cache: Drill[] | null = null
let _loading: Promise<Drill[]> | null = null

export function loadDrills(): Promise<Drill[]> {
  if (_cache) return Promise.resolve(_cache)
  if (_loading) return _loading
  _loading = (async () => {
    const r = await fetch('/drills.json')
    if (!r.ok) throw new Error(`Failed to load drills.json: ${r.status}`)
    const bundle = (await r.json()) as Bundle
    _cache = bundle.drills
    return _cache
  })()
  return _loading
}
