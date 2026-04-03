import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const migrationsDir = path.join(rootDir, 'supabase', 'migrations')
const readmePath = path.join(migrationsDir, 'README.md')

const migrationFilePattern = /^\d{8}_\d{6}_[a-z0-9_]+\.sql$/

function failWithErrors(errors) {
  console.error('Migration validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

if (!fs.existsSync(migrationsDir)) {
  failWithErrors([`Missing migrations directory: ${migrationsDir}`])
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((fileName) => fileName.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b))

const errors = []

if (files.length === 0) {
  errors.push('No SQL migrations were found in supabase/migrations.')
}

const seenPrefixes = new Set()
for (const fileName of files) {
  if (!migrationFilePattern.test(fileName)) {
    errors.push(
      `Invalid migration file name: ${fileName}. Expected pattern YYYYMMDD_000000_description.sql`
    )
  }

  const prefix = fileName.split('_').slice(0, 2).join('_')
  if (seenPrefixes.has(prefix)) {
    errors.push(`Duplicate migration prefix detected: ${prefix}`)
  }
  seenPrefixes.add(prefix)

  const fullPath = path.join(migrationsDir, fileName)
  const content = fs.readFileSync(fullPath, 'utf8')

  if (!/^\s*begin\s*;/i.test(content)) {
    errors.push(`${fileName}: missing transaction start (begin;).`)
  }

  if (!/\bcommit\s*;\s*$/i.test(content.trim())) {
    errors.push(`${fileName}: missing transaction end (commit;).`)
  }
}

if (!fs.existsSync(readmePath)) {
  errors.push('Missing migrations README at supabase/migrations/README.md')
} else {
  const readmeContent = fs.readFileSync(readmePath, 'utf8')

  for (const fileName of files) {
    if (!readmeContent.includes(`- \`${fileName}\``)) {
      errors.push(`README does not reference migration: ${fileName}`)
    }
  }
}

if (errors.length > 0) {
  failWithErrors(errors)
}

console.log(`Migration validation passed for ${files.length} file(s).`)
