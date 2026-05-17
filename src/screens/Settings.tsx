import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureMeta, exportAll, importAll, type ExportBundle } from '../db'
import { deriveLifetimeStats } from '../game/stats'

interface Props {
  onClose: () => void
}

export function Settings({ onClose }: Props) {
  const meta = useLiveQuery(() => ensureMeta(), [])
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? []
  const attempts = useLiveQuery(() => db.attempts.toArray(), []) ?? []
  const [renameValue, setRenameValue] = useState('')
  const [importStatus, setImportStatus] = useState<string | null>(null)

  if (!meta) return null
  const stats = deriveLifetimeStats(sessions, attempts)

  async function saveName() {
    const trimmed = renameValue.trim()
    if (!trimmed) return
    await db.meta.update(1, { petName: trimmed })
    setRenameValue('')
  }

  async function doExport() {
    const bundle = await exportAll()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lex-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function doImport(file: File) {
    setImportStatus(null)
    try {
      const text = await file.text()
      const bundle = JSON.parse(text) as ExportBundle
      await importAll(bundle)
      setImportStatus(`Restored ${bundle.sessions.length} sessions, ${bundle.attempts.length} drills.`)
    } catch (e) {
      setImportStatus(`Import failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div
      className="h-full w-full overflow-y-auto bg-ink text-paper px-5"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 1rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
      }}
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mt-2 mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-ink-soft text-paper active:scale-95 transition"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <Section label="Pet">
          <p className="text-sm text-paper/70 mb-2">
            Current name: <span className="text-paper">{meta.petName}</span>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              placeholder="New name"
              className="flex-1 px-3 py-2 rounded-xl bg-ink-soft text-paper border border-wood/40"
              maxLength={20}
            />
            <button
              type="button"
              onClick={saveName}
              disabled={!renameValue.trim()}
              className="px-4 py-2 rounded-xl bg-lamp text-ink font-semibold disabled:opacity-40 active:scale-95 transition"
            >
              Rename
            </button>
          </div>
        </Section>

        <Section label="Lifetime stats">
          <Stat label="Study minutes" value={stats.totalStudyMin} />
          <Stat label="Sessions" value={stats.sessionCount} />
          <Stat label="LR minutes" value={stats.lrMin} />
          <Stat label="RC minutes" value={stats.rcMin} />
          <Stat label="Pomodoro min" value={stats.pomodoroMin} />
          <Stat label="External min" value={stats.externalMin} />
          {stats.lifetimeAccuracyPct !== null && (
            <Stat label="Drill accuracy" value={`${stats.lifetimeAccuracyPct}%`} />
          )}
        </Section>

        <Section label="Backup">
          <p className="text-sm text-paper/70 mb-3">
            Progress lives in this browser only. Export periodically — restore
            on a new device or after clearing site data.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={doExport}
              className="py-3 rounded-xl bg-wood text-paper font-semibold active:scale-[0.98] transition"
            >
              Export progress (JSON)
            </button>
            <label className="py-3 rounded-xl bg-wood-dark text-paper font-semibold text-center cursor-pointer active:scale-[0.98] transition">
              Import progress
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) doImport(f)
                }}
              />
            </label>
            {importStatus && <p className="text-sm text-paper/80 mt-1">{importStatus}</p>}
          </div>
        </Section>

        <Section label="About">
          <p className="text-sm text-paper/70">
            Lex is a tiny LSAT study companion. Built with care for one friend.
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-xs uppercase tracking-wider text-paper/50 mb-2">{label}</h2>
      <div className="bg-ink-soft/60 rounded-2xl p-4">{children}</div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-paper/70">{label}</span>
      <span className="text-paper font-semibold tabular-nums">{value}</span>
    </div>
  )
}
