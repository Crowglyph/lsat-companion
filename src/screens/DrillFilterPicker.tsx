import { useMemo, useState } from 'react'
import {
  DRILL_COUNTS,
  LR_SUBTYPES,
  RC_SUBTYPES,
  type DrillFilter,
} from '../content/drills'

interface Props {
  onStart: (filter: DrillFilter) => void
  onCancel: () => void
}

type Selection = 'LR' | 'RC' | 'mix'

export function DrillFilterPicker({ onStart, onCancel }: Props) {
  const [type, setType] = useState<Selection>('LR')
  const [subtype, setSubtype] = useState<string | null>(null)

  // Reset subtype when switching the top-level type
  const handleType = (next: Selection) => {
    setType(next)
    setSubtype(null)
  }

  const subtypeList = type === 'LR' ? LR_SUBTYPES : RC_SUBTYPES
  const subtypeCounts =
    type === 'LR' ? DRILL_COUNTS.lrSubtypes : DRILL_COUNTS.rcSubtypes

  const total = useMemo(() => {
    if (type === 'mix') return DRILL_COUNTS.total
    const allOfType = type === 'LR' ? DRILL_COUNTS.lr : DRILL_COUNTS.rc
    if (!subtype) return allOfType
    return subtypeCounts[subtype] || 0
  }, [type, subtype, subtypeCounts])

  const start = () => {
    if (total === 0) return
    onStart({ type, subtype })
  }

  return (
    <div
      className="h-full w-full overflow-y-auto bg-ink text-paper px-4"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 0.75rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
      }}
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-paper/70 px-2 py-1 text-sm active:scale-95 transition"
          >
            ✕ Close
          </button>
          <span className="text-xs text-paper/40">Drill setup</span>
          <span className="w-12" />
        </div>

        <h1 className="text-xl font-bold mb-1">What do you want to drill?</h1>
        <p className="text-sm text-paper/60 mb-5">
          Pick a section, then optionally a question type.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <TypeChip
            label="LR"
            sub={`${DRILL_COUNTS.lr.toLocaleString()}`}
            active={type === 'LR'}
            onClick={() => handleType('LR')}
          />
          <TypeChip
            label="RC"
            sub={`${DRILL_COUNTS.rc.toLocaleString()}`}
            active={type === 'RC'}
            onClick={() => handleType('RC')}
          />
          <TypeChip
            label="Mix"
            sub={`${DRILL_COUNTS.total.toLocaleString()}`}
            active={type === 'mix'}
            onClick={() => handleType('mix')}
          />
        </div>

        {type !== 'mix' && (
          <>
            <div className="text-xs uppercase tracking-wider text-paper/50 mb-2">
              Subtype
            </div>
            <div className="space-y-1.5 mb-6">
              <SubtypeRow
                label={`All ${type}`}
                count={type === 'LR' ? DRILL_COUNTS.lr : DRILL_COUNTS.rc}
                active={subtype === null}
                onClick={() => setSubtype(null)}
              />
              {subtypeList.map(({ key, label }) => {
                const count = subtypeCounts[key] || 0
                if (count === 0) return null
                return (
                  <SubtypeRow
                    key={key}
                    label={label}
                    count={count}
                    active={subtype === key}
                    onClick={() => setSubtype(key)}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      <div
        className="sticky bottom-0 left-0 right-0 pt-4 pb-2 bg-gradient-to-t from-ink via-ink to-transparent"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
      >
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={start}
            disabled={total === 0}
            className="w-full py-4 rounded-2xl bg-lamp text-ink font-bold text-lg disabled:opacity-40 active:scale-[0.98] transition"
          >
            Start drill · {total.toLocaleString()} {total === 1 ? 'question' : 'questions'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TypeChip({
  label,
  sub,
  active,
  onClick,
}: {
  label: string
  sub: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-4 rounded-2xl font-bold text-lg flex flex-col items-center transition active:scale-[0.98] ${
        active ? 'bg-lamp text-ink' : 'bg-ink-soft/80 text-paper'
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs font-normal ${active ? 'text-ink/70' : 'text-paper/55'}`}>
        {sub}
      </span>
    </button>
  )
}

function SubtypeRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition active:scale-[0.99] ${
        active ? 'bg-lamp text-ink' : 'bg-ink-soft/65 text-paper'
      }`}
    >
      <span className="font-medium">{label}</span>
      <span
        className={`text-sm tabular-nums ${active ? 'text-ink/70' : 'text-paper/55'}`}
      >
        {count.toLocaleString()}
      </span>
    </button>
  )
}
