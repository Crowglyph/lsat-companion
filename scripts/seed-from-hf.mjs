// Fetches LSAT LR + RC drills from HuggingFace and writes public/drills.json.
//
// Source: tasksource/lsat-lr (4520 rows) + tasksource/lsat-rc (2366 rows).
// These are real LSAT questions transcribed by ML researchers (Microsoft
// AGIEval / AR-LSAT pipeline). MIT-licensed repo. Underlying questions
// remain LSAC copyright; this is for personal-use only.
//
// Usage: node scripts/seed-from-hf.mjs

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT_PATH = resolve(ROOT, 'public', 'drills.json')
const OUT_META = resolve(ROOT, 'src', 'content', 'drills-meta.json')

const PAGE_SIZE = 100

async function fetchAllRows(dataset, split) {
  const rows = []
  let offset = 0
  for (;;) {
    const url = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(dataset)}&config=default&split=${split}&offset=${offset}&length=${PAGE_SIZE}`
    const r = await fetch(url)
    if (!r.ok) {
      throw new Error(`HF API ${r.status} for ${dataset}/${split} offset=${offset}`)
    }
    const json = await r.json()
    const page = json.rows.map(x => x.row)
    rows.push(...page)
    process.stdout.write(`  ${dataset} ${split}: ${rows.length}/${json.num_rows_total}\r`)
    if (rows.length >= json.num_rows_total) break
    offset += PAGE_SIZE
    if (page.length === 0) break
  }
  process.stdout.write('\n')
  return rows
}

/** Parse "199106_3-LR1_1_1" → { ptNumber: 3, section: 'LR1', qNum: 1 }. */
function parseId(idString) {
  // Format examples: "199106_3-LR1_1_1", "199106_1-RC_1_1"
  // Group 1: PT number; Group 2: section tag; Group 3: question number
  const m = /^\d+_(\d+)-([A-Z]+\d*)_(\d+)_/.exec(idString)
  if (!m) return null
  return { ptNumber: Number(m[1]), section: m[2], qNum: Number(m[3]) }
}

function normalizeRow(row, type) {
  if (!row.context || !row.question || !Array.isArray(row.answers) || row.answers.length !== 5) {
    return null
  }
  if (typeof row.label !== 'number' || row.label < 0 || row.label > 4) {
    return null
  }
  const parsed = parseId(row.id_string)
  const sourceLabel = parsed
    ? `PT ${parsed.ptNumber} · ${parsed.section} Q${parsed.qNum}`
    : `hf:${row.id_string}`
  return {
    id: row.id_string,
    source: sourceLabel,
    type,
    stimulus: row.context.trim(),
    stem: row.question.trim(),
    choices: row.answers.map(s => String(s).trim()),
    correctIdx: row.label,
  }
}

function dedupe(drills) {
  const seen = new Set()
  const out = []
  for (const d of drills) {
    if (seen.has(d.id)) continue
    seen.add(d.id)
    out.push(d)
  }
  return out
}

async function main() {
  console.log('Fetching LR rows...')
  const lrRows = []
  for (const split of ['train', 'validation', 'test']) {
    lrRows.push(...(await fetchAllRows('tasksource/lsat-lr', split)))
  }
  console.log(`Fetched ${lrRows.length} LR rows.`)

  console.log('Fetching RC rows...')
  const rcRows = []
  for (const split of ['train', 'validation', 'test']) {
    rcRows.push(...(await fetchAllRows('tasksource/lsat-rc', split)))
  }
  console.log(`Fetched ${rcRows.length} RC rows.`)

  const lrDrills = dedupe(
    lrRows.map(r => normalizeRow(r, 'LR')).filter(Boolean),
  )
  const rcDrills = dedupe(
    rcRows.map(r => normalizeRow(r, 'RC')).filter(Boolean),
  )

  const all = [...lrDrills, ...rcDrills]
  const bundle = {
    generatedAt: new Date().toISOString(),
    source: 'tasksource/lsat-lr + tasksource/lsat-rc (HuggingFace)',
    counts: { lr: lrDrills.length, rc: rcDrills.length, total: all.length },
    drills: all,
  }

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, JSON.stringify(bundle))
  console.log(`Wrote ${OUT_PATH} (${(JSON.stringify(bundle).length / 1024 / 1024).toFixed(2)} MB)`)

  const meta = {
    generatedAt: bundle.generatedAt,
    counts: bundle.counts,
  }
  await mkdir(dirname(OUT_META), { recursive: true })
  await writeFile(OUT_META, JSON.stringify(meta, null, 2))
  console.log(`Wrote ${OUT_META}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
