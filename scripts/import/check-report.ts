/**
 * Report-only: read a committed checks-*.json and print the mechanical report (flags,
 * misconception coverage, longest-option %, near-duplicates, stray-markup items) computed
 * purely from the data. No API calls — this re-reads what generation already wrote.
 *
 * Usage: pnpm tsx scripts/import/check-report.ts src/content/data/checks-intermedio.json
 */
import { readFileSync } from 'node:fs'
import { checksFileSchema, reportMechanical } from './checks'

const path = process.argv[2]
if (!path) {
  console.error('usage: pnpm tsx scripts/import/check-report.ts <path-to-checks-*.json>')
  process.exit(1)
}

const file = checksFileSchema.parse(JSON.parse(readFileSync(path, 'utf8')))
console.log(`${path} — generated ${file.generatedAt} with ${file.model}`)
reportMechanical(file.sourceSection, file.checks)
