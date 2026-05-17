import { useEffect, useState } from 'react'
import { Home } from './screens/Home'
import { Pomodoro } from './screens/Pomodoro'
import { LogExternal } from './screens/LogExternal'
import { Settings } from './screens/Settings'
import { ensureMeta } from './db'

type Screen =
  | { kind: 'home' }
  | { kind: 'pomodoro'; minutes: number }
  | { kind: 'log-external' }
  | { kind: 'settings' }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'home' })

  // Belt-and-suspenders meta seed. The populate hook handles fresh installs;
  // this catches any edge case where meta was wiped but DB exists.
  useEffect(() => {
    ensureMeta().catch(e => console.error('ensureMeta failed:', e))
  }, [])

  return (
    <div className="h-full w-full bg-ink">
      {screen.kind === 'home' && (
        <Home
          onStartPomodoro={(minutes) => setScreen({ kind: 'pomodoro', minutes })}
          onOpenLog={() => setScreen({ kind: 'log-external' })}
          onOpenSettings={() => setScreen({ kind: 'settings' })}
        />
      )}
      {screen.kind === 'pomodoro' && (
        <Pomodoro
          minutes={screen.minutes}
          onDone={() => setScreen({ kind: 'home' })}
        />
      )}
      {screen.kind === 'log-external' && (
        <LogExternal
          onDone={() => setScreen({ kind: 'home' })}
          onCancel={() => setScreen({ kind: 'home' })}
        />
      )}
      {screen.kind === 'settings' && (
        <Settings onClose={() => setScreen({ kind: 'home' })} />
      )}
    </div>
  )
}
