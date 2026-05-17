import { useEffect, useRef, useState } from 'react'
import { db, type SectionTag } from '../db'
import {
  loadDrills,
  matchesFilter,
  type Drill,
  type DrillFilter,
} from '../content/drills'

interface Props {
  filter: DrillFilter
  onDone: () => void
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const

export function QuickDrill({ filter, onDone }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [queue, setQueue] = useState<Drill[] | null>(null)
  const [chosen, setChosen] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)

  const sessionIdRef = useRef<number | null>(null)
  const sessionStartedAtRef = useRef<number>(Date.now())
  const attemptStartedAtRef = useRef<number>(Date.now())

  useEffect(() => {
    let cancelled = false
    loadDrills()
      .then(drills => {
        if (cancelled) return
        const filtered = drills.filter(d => matchesFilter(d, filter))
        const shuffled = [...filtered]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        setQueue(shuffled)
        attemptStartedAtRef.current = Date.now()
      })
      .catch(e => setError(String(e)))
    return () => {
      cancelled = true
    }
  }, [filter])

  async function ensureSession(): Promise<number> {
    if (sessionIdRef.current !== null) return sessionIdRef.current
    // Tag the session with the section filter when it's a single section,
    // so per-section stats reflect what she actually drilled.
    const sectionTag: SectionTag | undefined =
      filter.type === 'LR' ? 'LR' : filter.type === 'RC' ? 'RC' : undefined
    const id = (await db.sessions.add({
      startedAt: sessionStartedAtRef.current,
      endedAt: Date.now(),
      type: 'drill',
      durationMin: 0,
      sectionTag,
    })) as number
    sessionIdRef.current = id
    return id
  }

  async function submitChoice(idx: number) {
    if (revealed || !queue || queue.length === 0) return
    setChosen(idx)
    setRevealed(true)
    const current = queue[0]
    if (idx === current.correctIdx) setCorrectCount(c => c + 1)
    setCompleted(c => c + 1)
    const sid = await ensureSession()
    await db.attempts.add({
      drillId: current.id,
      sessionId: sid,
      answeredAt: Date.now(),
      chosenIdx: idx,
      correctIdx: current.correctIdx,
      elapsedSec: Math.round((Date.now() - attemptStartedAtRef.current) / 1000),
    })
  }

  function nextDrill() {
    if (!queue) return
    setQueue(queue.slice(1))
    setChosen(null)
    setRevealed(false)
    attemptStartedAtRef.current = Date.now()
  }

  async function finish() {
    if (sessionIdRef.current !== null) {
      const endedAt = Date.now()
      const durationMin = Math.max(
        1,
        Math.round((endedAt - sessionStartedAtRef.current) / 60_000),
      )
      await db.sessions.update(sessionIdRef.current, { endedAt, durationMin })
    }
    onDone()
  }

  if (error) {
    return (
      <Frame onClose={onDone}>
        <p className="text-red-300 text-sm mb-2">Couldn't load drills:</p>
        <pre className="text-xs whitespace-pre-wrap bg-black/40 p-2 rounded">{error}</pre>
      </Frame>
    )
  }

  if (!queue) {
    return (
      <Frame onClose={onDone}>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-paper/70 mb-2">Loading drills…</p>
          <p className="text-paper/50 text-xs">First load takes a few seconds — cached after that.</p>
        </div>
      </Frame>
    )
  }

  const current = queue[0]
  if (!current) {
    return (
      <Frame onClose={finish}>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-paper text-xl mb-2">All done!</p>
          <p className="text-paper/70 text-sm mb-4">You worked through the whole pool. Try again for a fresh shuffle.</p>
          <button
            type="button"
            onClick={finish}
            className="px-6 py-3 rounded-xl bg-lamp text-ink font-bold"
          >
            Finish
          </button>
        </div>
      </Frame>
    )
  }

  return (
    <Frame
      onClose={finish}
      header={
        <div className="flex items-center justify-between text-xs text-paper/60">
          <span className="px-2 py-0.5 rounded bg-wood-dark/70 text-paper">{current.type}</span>
          <span>{current.source}</span>
          <span className="tabular-nums">
            {completed > 0 ? `${correctCount}/${completed}` : '—'}
          </span>
        </div>
      }
    >
      <div className="text-sm leading-relaxed text-paper/95 whitespace-pre-line mb-3">
        {current.stimulus}
      </div>
      <div className="text-base font-semibold text-paper mb-3">
        {current.stem}
      </div>
      <div className="space-y-2">
        {current.choices.map((choice, idx) => {
          const isChosen = chosen === idx
          const isCorrect = idx === current.correctIdx
          let stateClass = 'bg-ink-soft/80 text-paper'
          if (revealed) {
            if (isCorrect) stateClass = 'bg-emerald-700/70 text-paper'
            else if (isChosen) stateClass = 'bg-red-800/70 text-paper'
            else stateClass = 'bg-ink-soft/40 text-paper/55'
          }
          return (
            <button
              key={idx}
              type="button"
              onClick={() => submitChoice(idx)}
              disabled={revealed}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex gap-3 transition active:scale-[0.99] disabled:active:scale-100 ${stateClass}`}
            >
              <span className="font-bold text-paper/80 w-5">{LETTERS[idx]}</span>
              <span className="flex-1 text-sm leading-snug">{choice}</span>
            </button>
          )
        })}
      </div>
      {revealed && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={finish}
            className="flex-1 py-3 rounded-xl bg-wood-dark text-paper font-semibold active:scale-[0.98] transition"
          >
            Done
          </button>
          <button
            type="button"
            onClick={nextDrill}
            className="flex-[2] py-3 rounded-xl bg-lamp text-ink font-bold active:scale-[0.98] transition"
          >
            Next drill
          </button>
        </div>
      )}
    </Frame>
  )
}

function Frame({
  children,
  onClose,
  header,
}: {
  children: React.ReactNode
  onClose: () => void
  header?: React.ReactNode
}) {
  return (
    <div
      className="h-full w-full overflow-y-auto bg-ink text-paper px-4"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 0.75rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
      }}
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onClose}
            className="text-paper/70 active:scale-95 transition px-2 py-1 text-sm"
          >
            ✕ Close
          </button>
          <span className="text-xs text-paper/40">Quick drill</span>
          <span className="w-12" />
        </div>
        {header && <div className="mb-3">{header}</div>}
        {children}
      </div>
    </div>
  )
}
