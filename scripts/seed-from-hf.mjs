// Fetches LSAT LR + RC drills from HuggingFace and writes public/drills.json.
//
// Source: tasksource/lsat-lr (4520 rows) + tasksource/lsat-rc (2366 rows).
// These are real LSAT questions transcribed by ML researchers (Microsoft
// AGIEval / AR-LSAT pipeline). MIT-licensed repo. Underlying questions
// remain LSAC copyright; this is for personal-use only.
//
// Each row is also tagged with a subtype (strengthen/weaken/flaw/etc.)
// via question-stem heuristics — see classifyLr / classifyRc.
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

// ---------- Classifier ----------------------------------------------------
// Patterns matched against the question stem in priority order. First match
// wins. Wide net first to capture compound types (parallel-flaw before flaw,
// principle-strengthen before strengthen, etc.).
//
// Subtype keys are lowercase-kebab; the UI maps them to display labels.

const LR_PATTERNS = [
  // Compound / specific first
  ['parallel-flaw', /\bparallel\b.{0,40}\b(flaw|reasoning is flawed|questionable)\b/i],
  ['parallel-flaw', /\bflaw(ed)?\b.{0,40}\bparallel\b/i],
  ['parallel', /\b(parallels?|most (?:closely )?(?:similar|parallel)|exhibits .* similar)\b.{0,60}\b(reasoning|argument|pattern)\b/i],
  ['parallel', /\bpattern of reasoning\b.{0,40}\bmost (?:similar|parallel)\b/i],

  ['principle-strengthen', /\bprinciple\b.{0,80}\b(most help(s)? to justify|most strongly justify|most strongly support)\b/i],
  ['principle-strengthen', /\b(principle|proposition)\b.{0,60}\bmost (closely )?conforms? to\b/i],
  ['principle-identify', /\bprinciple\b.{0,60}\b(illustrated|exemplified|conforming|underli(es|ying))\b/i],
  ['principle-identify', /\bwhich .* principle\b/i],

  ['sufficient-assumption', /\b(conclusion follows logically|conclusion .* properly drawn)\b.{0,40}\bif\b/i],
  ['sufficient-assumption', /\bif (assumed|added),? .* conclusion\b/i],
  ['sufficient-assumption', /\benables? the conclusion\b/i],

  ['necessary-assumption', /\b(assumption (on which|required by)|required (assumption|by the argument)|presuppose[sd]?)\b/i],
  ['necessary-assumption', /\bargument depends on .* assum/i],

  ['flaw', /\b(flaw(ed)?|vulnerable to (?:the )?criticism|questionable (?:on the grounds|because)|reasoning .* (?:flawed|defective|erroneous))\b/i],

  ['strengthen', /\bmost (?:strongly )?(?:strengthens?|supports?|justify the reasoning|helps to justify)\b/i],
  ['strengthen', /\bif true,? (?:most )?(?:strengthens?|supports?)\b/i],

  ['weaken', /\b(weakens?|undermines?|(?:most|seriously) calls? into question|casts? doubt|most damages)\b/i],
  ['weaken', /\bif true,? .* (?:weakens?|undermines?)\b/i],

  ['resolve-paradox', /\b(resolves?|explains?)\b.{0,40}\b(apparent )?(?:paradox|discrepancy|conflict|contradiction|puzzle)\b/i],
  ['resolve-paradox', /\bmost helps? to (?:resolve|explain)\b/i],

  ['main-point', /\bmain (point|conclusion|idea)\b/i],
  ['main-point', /\bexpresses? the (?:overall )?conclusion\b/i],

  ['method', /\b(method of reasoning|argues? by|argument proceeds by|technique of reasoning)\b/i],
  ['method', /\b(?:how|in what way) does .* argument\b/i],

  ['role', /\b(role|function) (?:played )?(?:by|in the argument|of the (?:claim|statement|sentence))\b/i],
  ['role', /\bplays which one of the following roles\b/i],

  ['point-at-issue', /\b(disagree|at issue|disagreement|committed to (?:agreement|disagreement)|agree on)\b.{0,40}\b(which|whether)\b/i],
  ['point-at-issue', /\bgrounds .* to (?:disagree|agree)\b/i],

  ['must-be-true', /\bmust (?:also )?be true\b/i],
  ['must-be-true', /\bproperly (?:inferred|concluded|drawn) from\b/i],

  ['most-strongly-supported', /\bmost (?:strongly )?supported by (?:the )?(?:information|statements|passage)\b/i],
  ['most-strongly-supported', /\b(?:statements|information),? if true,? most (?:strongly )?support\b/i],

  ['cannot-be-true', /\b(cannot be true|EXCEPT)\b/],

  ['inference', /\b(inferred|reasonably (?:conclude|infer))\b/i],
] // anything else → 'other'

const RC_PATTERNS = [
  ['main-point', /\b(main (point|idea)|central (thesis|focus|claim)|primary purpose|primarily concerned with)\b/i],
  ['attitude', /\b(author'?s? )?(attitude|tone|view|stance|opinion)\b/i],
  ['function', /\b(function|purpose|role) of (?:the )?(paragraph|passage|sentence|reference|quotation|phrase|word)\b/i],
  ['function', /\bwhy (?:does )?the author (?:mention|refer|include)\b/i],
  ['detail', /\b(according to the passage|passage (?:states|asserts|indicates))\b/i],
  ['application', /\b(would (?:most likely )?agree|would be most consistent with|likely to (?:agree|endorse))\b/i],
  ['application', /\b(analogous|similar) to .* (?:described|discussed)\b/i],
  ['inference', /\b(inferred?|implied|suggested by the passage)\b/i],
  ['comparative', /\b(both passages|either passage|each passage|passage [AB])\b/i],
]

function classify(stem, patterns) {
  for (const [key, re] of patterns) {
    if (re.test(stem)) return key
  }
  return 'other'
}

function classifyLr(stem) {
  return classify(stem, LR_PATTERNS)
}

function classifyRc(stem, stimulus) {
  // Comparative passages are tagged on stimulus too (starts with Passage A/B).
  if (/^\s*Passage A[:.]?\s/i.test(stimulus) || /\bPassage A\b.{0,400}\bPassage B\b/is.test(stimulus.slice(0, 800))) {
    return 'comparative'
  }
  return classify(stem, RC_PATTERNS)
}

// ---------- Fetch ----------------------------------------------------------

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
  const stem = row.question.trim()
  const stimulus = row.context.trim()
  const subtype = type === 'LR' ? classifyLr(stem) : classifyRc(stem, stimulus)
  return {
    id: row.id_string,
    source: sourceLabel,
    type,
    subtype,
    stimulus,
    stem,
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

function countsBySubtype(drills) {
  const m = {}
  for (const d of drills) m[d.subtype] = (m[d.subtype] || 0) + 1
  return m
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
  const lrSubtypes = countsBySubtype(lrDrills)
  const rcSubtypes = countsBySubtype(rcDrills)

  const bundle = {
    generatedAt: new Date().toISOString(),
    source: 'tasksource/lsat-lr + tasksource/lsat-rc (HuggingFace)',
    counts: {
      lr: lrDrills.length,
      rc: rcDrills.length,
      total: all.length,
      lrSubtypes,
      rcSubtypes,
    },
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

  // Pretty-print classification summary
  console.log('\nLR subtype counts:')
  for (const [k, v] of Object.entries(lrSubtypes).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(28)} ${v}`)
  }
  console.log('\nRC subtype counts:')
  for (const [k, v] of Object.entries(rcSubtypes).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(28)} ${v}`)
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
