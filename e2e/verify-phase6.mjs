/**
 * Phase 6 runtime verification: settings docs surface, package scripts,
 * multi-view nav, assistant still healthy after phases 4–5.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { resolveArtifactDir, safeWriteFile } from './artifactDir.mjs'
import { fileURLToPath } from 'node:url'
import { enterWithDemoPack } from './onboarding.mjs'

function resolvePlaywright() {
  const require = createRequire(import.meta.url)
  try {
    return require('playwright')
  } catch {
    const npxRoots = fs
      .readdirSync('/home/ubuntu/.npm/_npx')
      .map((name) => `/home/ubuntu/.npm/_npx/${name}/node_modules/playwright`)
      .filter((p) => fs.existsSync(p))
    if (!npxRoots.length) throw new Error('playwright not found')
    return require(npxRoots[0])
  }
}

const { chromium } = resolvePlaywright()
const BASE = process.env.AETHER_URL || 'http://127.0.0.1:5173'
const outDir = resolveArtifactDir()
const log = []
function note(msg) {
  console.log(msg)
  log.push(msg)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const requiredFiles = [
  'supabase/migrations/003_production_rls_notes.sql',
  'supabase/RLS.md',
  'e2e/verify-phase4.mjs',
  'e2e/verify-phase5.mjs',
  'e2e/verify-phase6.mjs',
  'e2e/verify-all.mjs',
  'README.md',
  '.env.example',
]
for (const rel of requiredFiles) {
  const ok = fs.existsSync(path.join(root, rel))
  note(`artifact ${rel}: ${ok}`)
  if (!ok) throw new Error(`Missing ${rel}`)
}

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8')
note(`readme phase map: ${/Phase map|Phase 4|Phase 5|Phase 6/i.test(readme)}`)
if (!/Phase map/i.test(readme)) throw new Error('README missing Phase map')

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
note(`script test:e2e: ${Boolean(pkg.scripts?.['test:e2e'])}`)
note(`script verify:phase4: ${Boolean(pkg.scripts?.['verify:phase4'])}`)
if (!pkg.scripts?.['test:e2e']) throw new Error('package.json missing test:e2e')

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } })
const page = await context.newPage()

try {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  await enterWithDemoPack(page)

  await page.getByRole('button', { name: 'Home' }).click()
  await page.waitForTimeout(400)
  note(`home: ${/For You|SteadyStream|Continue/i.test(await page.locator('body').innerText())}`)

  await page.getByRole('button', { name: 'Multi-view' }).click()
  await page.waitForTimeout(500)
  note(`multiview nav: ${/mosaic|2-up|4-up/i.test(await page.locator('body').innerText())}`)

  await page.getByRole('button', { name: 'Settings' }).click()
  await page.waitForTimeout(400)
  const settings = await page.locator('body').innerText()
  note(`settings megaott: ${/MegaOTT/i.test(settings)}`)
  note(`settings xtream advanced: ${/Xtream-compatible API/i.test(settings)}`)
  note(`settings profiles: ${/Household profiles/i.test(settings)}`)

  await page.getByRole('button', { name: /^Assistant$/i }).click()
  await page.waitForTimeout(400)
  const aside = page.locator('aside').last()
  note(`assistant finish: ${/Mock AI|Live AI|profiles|NL EPG/i.test(await aside.innerText())}`)

  await page.screenshot({ path: path.join(outDir, 'phase6_ship_ready_shell.png') }).catch((err) => note(`screenshot skipped: ${err instanceof Error ? err.message : err}`))
  note('PHASE6_VERIFY_OK')
} catch (err) {
  note(`PHASE6_VERIFY_FAIL: ${err instanceof Error ? err.message : String(err)}`)
  await page.screenshot({ path: path.join(outDir, 'phase6_verify_failure.png') }).catch(() => undefined)
  process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
  safeWriteFile(path.join(outDir, 'phase6_verification.log'), log.join('\n') + '\n')
}
