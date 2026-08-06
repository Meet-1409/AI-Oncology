/**
 * Architecture boundary check — rebuilt for the spatial shell.
 *
 * Layering is unchanged: dependencies point downward only.
 *
 *   spaces  ->  features  ->  components  ->  lib
 *                    \-> data
 *
 * The cinematic/clinical visual-vocabulary boundary that used to be enforced
 * here is retired, not merely relaxed: the whole premise of the rebuild is
 * that there is one continuous 3D volume, not a premium Entry and a
 * restrained app. (`components/cinematic/` still exists and is still
 * imported by the not-yet-migrated Entry — that's fine; nothing here
 * prevents it, because there is no longer a rule saying it shouldn't be.)
 *
 * Two checks are new, generalizing the ONE dual-renderer discipline that
 * already existed for the Body (`use-body-view-model.ts` feeding both
 * `BodyScene` and `BodyStructured`) to every space being rebuilt:
 *
 *   - a `*ViewModel`/`use-*-view-model` module must never import `three` —
 *     "camera state can never reach clinical state" as an enforced lint,
 *     not just a comment.
 *   - an `*Accessible` module (the flat fallback rendered when there's no
 *     WebGL2) must never import `three` either — it has to work with the
 *     Canvas entirely unmounted.
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
const THREE_IMPORT_PATTERN = /from\s+['"](three|@react-three\/[a-z-]+)['"]/

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

/*
 * ViewModel purity: camera state can never reach clinical state.
 *
 * Generalizes the invariant `use-body-view-model.ts` already had to every
 * space's own view-model — a file matching this naming convention computes
 * what a space shows, never how the camera is doing it.
 */
const VIEW_MODEL_PATTERN = /(use-.*-view-model|ViewModel)\.tsx?$/

for (const file of walk(SRC)) {
  if (!VIEW_MODEL_PATTERN.test(file)) continue
  const source = readFileSync(file, 'utf8')
  const match = source.match(THREE_IMPORT_PATTERN)
  if (match) {
    violations.push({
      file: relative(SRC, file),
      layer: 'a view-model',
      target: 'three.js — camera state can never reach clinical state',
      specifier: match[0],
    })
  }
}

/*
 * AccessibleView purity: the flat fallback has to work with the Canvas
 * entirely unmounted — no WebGL2, jsdom, a screen reader, or simply the
 * rendering failure path. A file matching this convention importing three
 * defeats the one property it exists to guarantee.
 */
const ACCESSIBLE_VIEW_PATTERN = /(Accessible|Structured)\.tsx?$/

for (const file of walk(SRC)) {
  if (!ACCESSIBLE_VIEW_PATTERN.test(file)) continue
  const source = readFileSync(file, 'utf8')
  const match = source.match(THREE_IMPORT_PATTERN)
  if (match) {
    violations.push({
      file: relative(SRC, file),
      layer: 'an accessible view',
      target: 'three.js — this must render with the Canvas unmounted',
      specifier: match[0],
    })
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
 * The rebuild does not change these values — see design/theme.ts.
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

/*
 * The severity scale is necessarily duplicated in three places:
 *   design/tokens.css  (CSS consumers)
 *   design/theme.ts    (three.js materials)
 *   lib/status.ts      (status mapping)
 *
 * three.Color cannot read CSS custom properties, so a single source is not
 * possible without a build step. Drift between them would mean the same severity
 * renders as two different colors in the 3D scene and the surrounding interface,
 * so equality is checked here instead of trusted.
 */
function severityFromCss(source) {
  return [...source.matchAll(/--color-severity-(\d):\s*(#[0-9a-fA-F]{6})/g)]
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map((m) => m[2].toLowerCase())
}

function severityFromTs(source, symbol) {
  const block = source.match(new RegExp(`${symbol}[^}]*}`, 's'))?.[0] ?? ''
  return [...block.matchAll(/\d:\s*'(#[0-9a-fA-F]{6})'/g)].map((m) => m[1].toLowerCase())
}

const cssScale = severityFromCss(readFileSync(join(SRC, 'design', 'tokens.css'), 'utf8'))
const themeScale = severityFromTs(
  readFileSync(join(SRC, 'design', 'theme.ts'), 'utf8'),
  'severityScale',
)
const statusScale = severityValues.map((v) => v.toLowerCase())

const sources = { 'tokens.css': cssScale, 'theme.ts': themeScale, 'status.ts': statusScale }
const mismatches = []

for (let level = 0; level <= 5; level++) {
  const seen = new Set()
  for (const scale of Object.values(sources)) seen.add(scale[level])
  if (seen.size !== 1) {
    mismatches.push(
      `  severity ${level}: ` +
        Object.entries(sources)
          .map(([name, scale]) => `${name}=${scale[level] ?? 'missing'}`)
          .join('  '),
    )
  }
}

if (mismatches.length > 0) {
  console.error('\nSeverity scale drift between sources:\n')
  for (const line of mismatches) console.error(line)
  process.exit(1)
}

console.log('Severity scale synchronised across CSS, theme and status: OK')

/*
 * Theme completeness.
 *
 * Every component consumes semantic tokens, so a token defined for the light
 * theme but forgotten in the dark one does not fail loudly — the light value is
 * inherited, and the result is dark text on a dark surface, or an invisible
 * border, or a status chip nobody can read. It looks like a styling slip and it
 * can hide clinical information.
 *
 * Two rules, checked here rather than trusted:
 *   1. Every semantic token has a dark value.
 *   2. The dark theme never redefines a severity value. The scale is fixed by
 *      documentation [00 §6.7], shared with three.js and checked for equality
 *      across three files above; a theme that restyled it would mean the same
 *      finding rendering as two different colours depending on a display
 *      preference.
 */
const tokensSource = readFileSync(join(SRC, 'design', 'tokens.css'), 'utf8')

function declaredIn(selector) {
  const start = tokensSource.indexOf(selector)
  if (start === -1) return null
  const open = tokensSource.indexOf('{', start)
  let depth = 0
  let end = open
  for (let i = open; i < tokensSource.length; i++) {
    if (tokensSource[i] === '{') depth++
    else if (tokensSource[i] === '}') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  const body = tokensSource.slice(open, end)
  return new Set([...body.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]))
}

const lightTokens = declaredIn(':root {')
const darkTokens = declaredIn(":root[data-theme='dark'] {")

if (!lightTokens || !darkTokens) {
  console.error('\nTheme check failed: could not locate the semantic token blocks.')
  process.exit(1)
}

// Motion, cinema (transitional — see tokens.css), scene, and body-volume
// (transitional) tokens are intentionally theme-independent: the scene is
// only ever dark, and durations/easing don't change with the lighting.
const THEME_EXEMPT = /^--(motion|cinema|severity-ring|body-volume|scene|glass-blur)/

const missingInDark = [...lightTokens].filter(
  (token) => !THEME_EXEMPT.test(token) && !darkTokens.has(token),
)

const severityInDark = [...darkTokens].filter((token) => token.startsWith('--color-severity-'))

if (missingInDark.length > 0 || severityInDark.length > 0) {
  console.error('\nTheme completeness failed.\n')
  for (const token of missingInDark) {
    console.error(`  ${token} has no dark value — it would inherit the light one.`)
  }
  for (const token of severityInDark) {
    console.error(`  ${token} is redefined by the dark theme; the severity scale is fixed.`)
  }
  process.exit(1)
}

console.log(`Theme completeness (${darkTokens.size} dark tokens): OK`)
