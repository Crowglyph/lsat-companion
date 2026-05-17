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
  subtype: string           // see SUBTYPE_LABELS below
  stimulus: string
  stem: string
  choices: string[]         // exactly 5
  correctIdx: number        // 0-4
  explanationUrl?: string
}

interface Bundle {
  generatedAt: string
  source: string
  counts: {
    lr: number
    rc: number
    total: number
    lrSubtypes: Record<string, number>
    rcSubtypes: Record<string, number>
  }
  drills: Drill[]
}

export const DRILL_COUNTS = meta.counts as Bundle['counts']
export const DRILLS_AVAILABLE = meta.counts.total > 0

// Display labels for the subtype slugs the seed script emits. Order in each
// list is the order they render in the filter UI.
export const LR_SUBTYPES: { key: string; label: string }[] = [
  { key: 'strengthen', label: 'Strengthen' },
  { key: 'weaken', label: 'Weaken' },
  { key: 'flaw', label: 'Flaw' },
  { key: 'necessary-assumption', label: 'Necessary Assumption' },
  { key: 'sufficient-assumption', label: 'Sufficient Assumption' },
  { key: 'parallel', label: 'Parallel Reasoning' },
  { key: 'parallel-flaw', label: 'Parallel Flaw' },
  { key: 'main-point', label: 'Main Point' },
  { key: 'must-be-true', label: 'Must Be True' },
  { key: 'most-strongly-supported', label: 'Most Strongly Supported' },
  { key: 'inference', label: 'Inference' },
  { key: 'method', label: 'Method of Reasoning' },
  { key: 'role', label: 'Role in Argument' },
  { key: 'principle-identify', label: 'Identify the Principle' },
  { key: 'principle-strengthen', label: 'Apply a Principle' },
  { key: 'resolve-paradox', label: 'Resolve the Paradox' },
  { key: 'point-at-issue', label: 'Point at Issue' },
  { key: 'cannot-be-true', label: 'Cannot Be True / Except' },
  { key: 'other', label: 'Other / unsorted' },
]

export const RC_SUBTYPES: { key: string; label: string }[] = [
  { key: 'main-point', label: 'Main Point' },
  { key: 'detail', label: 'Specific Detail' },
  { key: 'inference', label: 'Inference' },
  { key: 'attitude', label: "Author's Attitude" },
  { key: 'function', label: 'Function / Purpose' },
  { key: 'application', label: 'Application' },
  { key: 'comparative', label: 'Comparative Reading' },
  { key: 'other', label: 'Other / unsorted' },
]

export interface DrillFilter {
  type: 'LR' | 'RC' | 'mix'
  subtype: string | null   // null = all subtypes within type
}

export function matchesFilter(d: Drill, f: DrillFilter): boolean {
  if (f.type !== 'mix' && d.type !== f.type) return false
  if (f.subtype && d.subtype !== f.subtype) return false
  return true
}

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
