/**
 * Architecture boundary check.
 *
 * The layering rules in the engineering blueprint are enforced here rather than
 * left to code review, so a violation fails the build. Dependencies point downward
 * only:
 *
 *   spaces  ->  features  ->  components  ->  lib
 *                    \-> data
 *
 * Run with: npm run check:architecture
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

/** layer -> layers it must never import from */
const FORBIDDEN = {
  components: ['features', 'spaces'],
  features: ['spaces'],
  lib: ['features', 'spaces', 'components', 'data'],
  types: ['features', 'spaces', 'components', 'data', 'lib'],
}

const IMPORT_PATTERN = /(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]/g

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

function layerOf(path) {
  return relative(SRC, path).split(sep)[0]
}

const violations = []

for (const file of walk(SRC)) {
  const layer = layerOf(file)
  const forbidden = FORBIDDEN[layer]
  if (!forbidden) continue

  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1]
    if (!specifier.startsWith('@/')) continue
    const target = specifier.slice(2).split('/')[0]
    if (forbidden.includes(target)) {
      violations.push({
        file: relative(SRC, file),
        layer,
        target,
        specifier,
      })
    }
  }
}

// Cross-feature imports: features must not depend on each other. Shared behaviour
// belongs in components or is coordinated by the shell.
for (const file of walk(join(SRC, 'features'))) {
  const own = relative(join(SRC, 'features'), file).split(sep)[0]
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1]
    if (!specifier.startsWith('@/features/')) continue
    const other = specifier.slice('@/features/'.length).split('/')[0]
    if (other !== own) {
      violations.push({
        file: relative(SRC, file),
        layer: `features/${own}`,
        target: `features/${other}`,
        specifier,
      })
    }
  }
}

if (violations.length > 0) {
  console.error(`\nArchitecture violations (${violations.length}):\n`)
  for (const v of violations) {
    console.error(`  ${v.file}`)
    console.error(`    ${v.layer} must not import from ${v.target}  ->  ${v.specifier}\n`)
  }
  process.exit(1)
}

console.log('Architecture boundaries: OK')

/*
 * Safety invariant: severity colors must be literal values, never CSS variables.
 *
 * These strings are handed to three.Color in the Body. three.js cannot parse
 * `var(--x)` — it warns and yields white, which silently renders every diseased
 * organ as healthy-looking white while the feature appears to work. This has
 * happened once already, so it is checked on every build rather than trusted.
 */
const statusSource = readFileSync(join(SRC, 'lib', 'status.ts'), 'utf8')
const severityBlock = statusSource.match(/SEVERITY_COLOR[^}]*}/s)?.[0] ?? ''
const severityValues = [...severityBlock.matchAll(/\d:\s*'([^']+)'/g)].map((m) => m[1])

const invalid = severityValues.filter((value) => !/^#[0-9a-fA-F]{6}$/.test(value))

if (severityValues.length !== 6 || invalid.length > 0) {
  console.error('\nSeverity color invariant failed.')
  if (severityValues.length !== 6) {
    console.error(`  Expected 6 severity levels (0-5), found ${severityValues.length}.`)
  }
  for (const value of invalid) {
    console.error(`  "${value}" is not a literal hex color — three.js cannot parse it.`)
  }
  process.exit(1)
}

console.log('Severity color invariant: OK')
