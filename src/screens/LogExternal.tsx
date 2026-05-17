import { useState } from 'react'
import { db, type SectionTag } from '../db'
import { NumberStepper } from '../components/ui/NumberStepper'
import { EXTERNAL_MIN_CAP, EXTERNAL_MIN_STEP } from '../game/balance'

interface Props {
  onDone: () => void
  onCancel: () => void
}

export function LogExternal({ onDone, onCancel }: Props) {
  const [section, setSection] = useState<SectionTag>('LR')
  const [minutes, setMinutes] = useState(25)
  const [notes, setNotes] = useState('')

  async function save() {
    const now = Date.now()
    await db.sessions.add({
      startedAt: now - minutes * 60_000,
      endedAt: now,
      type: 'external',
      durationMin: minutes,
      sectionTag: section,
      notes: notes.trim() || undefined,
    })
    onDone()
  }

  return (
    <div
      className="h-full w-full overflow-y-auto bg-ink text-paper px-5 pt-safe pb-safe"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}
    >
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 mt-2">Log a session</h1>

        <label className="block text-sm text-paper/70 mb-2">Section</label>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {(['LR', 'RC'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSection(s)}
              className={`py-3 rounded-xl font-semibold transition active:scale-[0.98] ${
                section === s ? 'bg-lamp text-ink' : 'bg-wood-dark text-paper'
              }`}
            >
              {s === 'LR' ? 'Logical Reasoning' : 'Reading Comprehension'}
            </button>
          ))}
        </div>

        <label className="block text-sm text-paper/70 mb-2">Minutes</label>
        <div className="mb-6">
          <NumberStepper
            value={minutes}
            onChange={setMinutes}
            min={5}
            max={EXTERNAL_MIN_CAP}
            step={EXTERNAL_MIN_STEP}
            unit="min"
          />
        </div>

        <label className="block text-sm text-paper/70 mb-2">Notes (optional)</label>
        <textarea
          className="w-full px-3 py-2 rounded-xl bg-ink-soft text-paper border border-wood/40 mb-8 min-h-[80px]"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="What did you work on?"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-wood-dark text-paper font-semibold active:scale-[0.98] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-1 py-3 rounded-xl bg-lamp text-ink font-bold active:scale-[0.98] transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
