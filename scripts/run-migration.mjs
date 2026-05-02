// Run a SQL migration against Supabase Postgres directly.
// Usage:  node scripts/run-migration.mjs <migration-file.sql>
// Requires env: SUPABASE_DB_URL  (postgresql://postgres.<ref>:<password>@<host>:<port>/postgres)

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import pg from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/run-migration.mjs <migration-file.sql>')
  process.exit(1)
}

const conn = process.env.SUPABASE_DB_URL
if (!conn) {
  console.error('Missing SUPABASE_DB_URL env var.')
  process.exit(1)
}

const raw = await readFile(resolve(file), 'utf8')

// Strip line comments (`-- ...`) so they don't interfere with semicolon split.
const sql = raw
  .split('\n')
  .map((line) => line.replace(/--.*$/, ''))
  .join('\n')

// Split into statements by semicolon. ALTER TYPE ADD VALUE must run outside any
// explicit BEGIN/COMMIT, so we run statements one at a time (auto-commit).
const stmts = sql
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0)

const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await client.connect()
console.log(`Connected. Running ${stmts.length} statement(s)…`)

let done = 0
for (const stmt of stmts) {
  const preview = stmt.slice(0, 70).replace(/\s+/g, ' ')
  try {
    await client.query(stmt)
    done++
    console.log(`  [${done}/${stmts.length}] OK: ${preview}…`)
  } catch (err) {
    const msg = String(err?.message ?? err)
    if (
      msg.includes('already exists') ||
      msg.includes('duplicate_object') ||
      msg.includes('duplicate key value')
    ) {
      done++
      console.log(`  [${done}/${stmts.length}] SKIP (exists): ${preview}…`)
    } else {
      console.error(`  FAILED: ${preview}…`)
      console.error(`  ${msg}`)
      await client.end()
      process.exit(1)
    }
  }
}

await client.end()
console.log('\nMigration complete.')
