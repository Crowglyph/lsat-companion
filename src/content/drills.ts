// Drill content lives here. MVP ships with zero drills — the Quick Drill
// option in the Study sheet is hidden until this array has rows.
//
// Each drill targets short, low-friction practice (LR-style stimulus + question
// + 5 choices, or a tiny RC fragment + a single question). Paste real content
// from free LSAT sources and structure it to match the Drill shape below.

export type DrillType = 'LR' | 'RC'

export interface Drill {
  id: string
  source: string            // e.g. "PT June 2007 §1 Q3"
  type: DrillType
  stimulus: string
  stem: string
  choices: [string, string, string, string, string]
  correctIdx: 0 | 1 | 2 | 3 | 4
  explanationUrl?: string
}

export const drills: Drill[] = []
