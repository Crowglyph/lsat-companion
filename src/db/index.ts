import Dexie, { type EntityTable } from 'dexie'

export type SessionType = 'pomodoro' | 'drill' | 'external'
export type SectionTag = 'LR' | 'RC'

export interface Session {
  id?: number
  startedAt: number          // epoch ms
  endedAt: number            // epoch ms
  type: SessionType
  durationMin: number
  sectionTag?: SectionTag
  notes?: string
}

export interface Attempt {
  id?: number
  drillId: string
  sessionId: number
  answeredAt: number
  chosenIdx: number
  correctIdx: number
  elapsedSec: number
}

export interface Meta {
  id: 1                      // singleton row
  petName: string
  hatchedAt: number
  lastSayHiAt: number | null
  graceUsedOnDate: string | null   // localDayKey of last grace use
  version: number            // bumped on import/migration
}

export class LexDB extends Dexie {
  sessions!: EntityTable<Session, 'id'>
  attempts!: EntityTable<Attempt, 'id'>
  meta!: EntityTable<Meta, 'id'>

  constructor() {
    super('lex-lsat-companion')
    // v1 — initial schema.
    // When schema needs to change: add this.version(N).stores({...}).upgrade(tx => {...})
    // below this block. Never modify v1.
    this.version(1).stores({
      sessions: '++id, startedAt, type',
      attempts: '++id, drillId, sessionId, answeredAt',
      meta: 'id',
    })
    // Seed the singleton meta row on first DB creation. This populate hook
    // runs once, inside Dexie's open transaction — NEVER inside a liveQuery
    // read context (which would throw ReadOnlyError).
    this.on('populate', () => {
      this.meta.add(makeFreshMeta())
    })
  }
}

function makeFreshMeta(): Meta {
  return {
    id: 1,
    petName: 'Lex',
    hatchedAt: Date.now(),
    lastSayHiAt: null,
    graceUsedOnDate: null,
    version: 1,
  }
}

export const db = new LexDB()

/**
 * Belt-and-suspenders: call once from a useEffect at app start. Handles the
 * rare case where the DB existed pre-populate-hook or the meta row was wiped.
 * MUST NOT be called from inside a useLiveQuery — Dexie throws ReadOnlyError
 * if a write runs in a read-only transaction context.
 */
export async function ensureMeta(): Promise<Meta> {
  const existing = await db.meta.get(1)
  if (existing) return existing
  const fresh = makeFreshMeta()
  await db.meta.put(fresh)
  return fresh
}

export interface ExportBundle {
  app: 'lex-lsat-companion'
  exportedAt: number
  schema: number
  sessions: Session[]
  attempts: Attempt[]
  meta: Meta
}

export async function exportAll(): Promise<ExportBundle> {
  const [sessions, attempts, meta] = await Promise.all([
    db.sessions.toArray(),
    db.attempts.toArray(),
    ensureMeta(),
  ])
  return {
    app: 'lex-lsat-companion',
    exportedAt: Date.now(),
    schema: 1,
    sessions,
    attempts,
    meta,
  }
}

export async function importAll(bundle: ExportBundle): Promise<void> {
  if (bundle.app !== 'lex-lsat-companion') {
    throw new Error('Not a Lex backup file')
  }
  await db.transaction('rw', db.sessions, db.attempts, db.meta, async () => {
    await db.sessions.clear()
    await db.attempts.clear()
    await db.meta.clear()
    if (bundle.sessions.length) await db.sessions.bulkAdd(bundle.sessions)
    if (bundle.attempts.length) await db.attempts.bulkAdd(bundle.attempts)
    await db.meta.put({ ...bundle.meta, id: 1 })
  })
}
