import { useEffect, useRef, useState } from 'react'
import { db } from '../db'
import { PetScene } from '../components/pet/PetScene'

interface Props {
  minutes: number
  onDone: () => void
}

export function Pomodoro({ minutes, onDone }: Props) {
  const startedAtRef = useRef<number>(Date.now())
  const totalSec = minutes * 60
  const [remaining, setRemaining] = useState(totalSec)
  const [completedView, setCompletedView] = useState(false)

  useEffect(() => {
    if (completedView) return
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
      const left = Math.max(0, totalSec - elapsed)
      setRemaining(left)
      if (left === 0) {
        clearInterval(id)
        finish(true)
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSec, completedView])

  async function finish(completed: boolean) {
    const endedAt = Date.now()
    const actualSec = Math.floor((endedAt - startedAtRef.current) / 1000)
    // Round to nearest minute, but only count if at least 1 minute elapsed
    const durMin = Math.max(1, Math.round(actualSec / 60))
    if (actualSec >= 60) {
      await db.sessions.add({
        startedAt: startedAtRef.current,
        endedAt,
        type: 'pomodoro',
        durationMin: durMin,
      })
    }
    if (completed) {
      setCompletedView(true)
      setTimeout(onDone, 1800)
    } else {
      onDone()
    }
  }

  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0">
        <PetScene expression={completedView ? 'happy' : 'studying'} />
      </div>

      {!completedView ? (
        <>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-paper text-7xl font-bold tabular-nums drop-shadow-xl"
          >
            {mm}:{String(ss).padStart(2, '0')}
          </div>
          <div
            className="absolute bottom-0 inset-x-0 px-4 pb-4"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
          >
            <button
              type="button"
              onClick={() => finish(false)}
              className="w-full py-4 rounded-2xl bg-wood-dark text-paper text-lg font-semibold active:scale-[0.98] transition"
            >
              Stop
            </button>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-paper text-3xl font-bold animate-pop-in bg-ink-soft/85 backdrop-blur px-6 py-4 rounded-2xl">
            Nice work ✦
          </div>
        </div>
      )}
    </div>
  )
}
