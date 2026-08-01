/**
 * Production bundle check.
 *
 * The Design System Showcase is an internal engineering tool. It must not appear
 * in production builds — not merely hidden, but absent. That guarantee rests on
 * Vite statically replacing `import.meta.env.DEV` with `false` and dropping the
 * dead dynamic import, which is a build-time behaviour and therefore worth
 * verifying rather than trusting.
 *
 * Run after a production build:  npm run build && npm run check:prod
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')

if (!existsSync(DIST)) {
  console.error('No dist/ directory. Run `npm run build` first.')
  process.exit(1)
}

/** Strings that should only ever exist in development-only code. */
const DEV_ONLY_MARKERS = [
  'Design System Showcase',
  '__showcase',
  'ShowcaseShell',
  'Development tool — not part of the product',
]

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const assets = walk(DIST).filter((f) => /\.(js|css|html)$/.test(f))
const findings = []

for (const file of assets) {
  const source = readFileSync(file, 'utf8')
  for (const marker of DEV_ONLY_MARKERS) {
    if (source.includes(marker)) {
      findings.push({ file: relative(ROOT, file), marker })
    }
  }
}

if (findings.length > 0) {
  console.error('\nDevelopment-only code found in the production bundle:\n')
  for (const { file, marker } of findings) {
    console.error(`  ${file}`)
    console.error(`    contains "${marker}"\n`)
  }
  console.error('The showcase must be excluded from production builds.')
  process.exit(1)
}

console.log(`Production bundle clean: no development-only code in ${assets.length} assets.`)
