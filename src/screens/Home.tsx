import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureMeta } from '../db'
import { PetScene } from '../components/pet/PetScene'
import { StreakBadge } from '../components/hud/StreakBadge'
import { HiChip } from '../components/hud/HiChip'
import { StudyCTA } from '../components/hud/StudyCTA'
import { Sheet } from '../components/ui/Sheet'
import { deriveStreak, shouldConsumeGrace, todayKey } from '../game/streak'
import { lastInteractionAt } from '../game/stats'
import { expressionFor, hungerNow, moodNow } from '../game/pet'
import { POMODORO_LENGTHS } from '../game/balance'
import { drills } from '../content/drills'

interface Props {
  onStartPomodoro: (minutes: number) => void
  onOpenLog: () => void
  onOpenSettings: () => void
}

export function Home({ onStartPomodoro, onOpenLog, onOpenSettings }: Props) {
  const meta = useLiveQuery(async () => ensureMeta(), [])
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? []

  const [sheetOpen, setSheetOpen] = useState(false)

  if (!meta) {
    return <div className="h-full flex items-center justify-center text-paper/60">Loading…</div>
  }

  const streak = deriveStreak(sessions, meta.graceUsedOnDate)
  const lastSession = lastInteractionAt(sessions)
  const hunger = hungerNow(lastSession)
  const mood = moodNow(lastSession, meta.lastSayHiAt)
  const expression = expressionFor(hunger, mood, false)

  const today = todayKey()
  const hiSaidToday = meta.lastSayHiAt
    ? todayKey(meta.lastSayHiAt) === today
    : false

  const sayHi = async () => {
    const now = Date.now()
    const consumeGrace = shouldConsumeGrace(sessions, meta.graceUsedOnDate, now)
    await db.meta.update(1, {
      lastSayHiAt: now,
      graceUsedOnDate: consumeGrace ? todayKey(now) : meta.graceUsedOnDate,
    })
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Pet canvas fills the screen */}
      <div className="absolute inset-0">
        <PetScene expression={expression} />
      </div>

      {/* Top-left streak */}
      <div className="absolute top-3 left-3 pt-safe">
        <StreakBadge days={streak.days} graceHold={streak.graceHoldsToday} />
      </div>

      {/* Top-right settings */}
      <div className="absolute top-3 right-3 pt-safe">
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full bg-ink-soft/85 backdrop-blur text-paper shadow-lg active:scale-95 transition flex items-center justify-center"
          aria-label="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Bottom action area */}
      <div
        className="absolute bottom-0 inset-x-0 px-4 pb-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
      >
        <div className="flex justify-center mb-3">
          <HiChip onSayHi={sayHi} disabled={hiSaidToday} petName={meta.petName} />
        </div>
        <StudyCTA onClick={() => setSheetOpen(true)} />
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Study with Lex">
        <div className="space-y-2">
          {POMODORO_LENGTHS.map(min => (
            <button
              key={min}
              type="button"
              className="w-full py-4 rounded-xl bg-wood text-paper text-lg font-semibold active:scale-[0.98] transition"
              onClick={() => {
                setSheetOpen(false)
                onStartPomodoro(min)
              }}
            >
              Pomodoro · {min} min
            </button>
          ))}
          <button
            type="button"
            className="w-full py-4 rounded-xl bg-wood-dark text-paper text-lg font-semibold active:scale-[0.98] transition"
            onClick={() => {
              setSheetOpen(false)
              onOpenLog()
            }}
          >
            Log external session
          </button>
          {drills.length > 0 && (
            <button
              type="button"
              className="w-full py-4 rounded-xl bg-lamp text-ink text-lg font-semibold active:scale-[0.98] transition"
              onClick={() => {
                setSheetOpen(false)
                // Quick drill will be wired when content lands
                alert('Quick drill coming soon')
              }}
            >
              Quick drill ({drills.length} available)
            </button>
          )}
        </div>
      </Sheet>
    </div>
  )
}
