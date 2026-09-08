/**
 * Phase 5 runtime verification: MegaOTT demo fallback, catchup affordance,
 * multi-view mosaic, TV focus rings.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { resolveArtifactDir, safeWriteFile } from './artifactDir.mjs'

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

  const demoBtn = page.getByRole('button', { name: /demo pack/i })
  if (await demoBtn.count()) {
    await demoBtn.click()
    await page.waitForTimeout(800)
  }

  // MegaOTT form + demo fallback (Xtream-compatible client)
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.waitForTimeout(500)
  const body = await page.locator('body').innerText()
  note(`megaott section: ${/MegaOTT/i.test(body)}`)
  if (!/MegaOTT/i.test(body)) throw new Error('MegaOTT UI missing')
  note(`xtream advanced: ${/Xtream-compatible API/i.test(body)}`)

  await page.getByTestId('megaott-portal').fill('http://127.0.0.1:59999')
  await page.getByTestId('megaott-username').fill('demo')
  await page.getByTestId('megaott-password').fill('demo')
  await page.getByRole('button', { name: /Connect MegaOTT/i }).click()
  await page.waitForSelector('[data-testid="xtream-status"]', { timeout: 10_000 })
  const statusText = await page.getByTestId('xtream-status').innerText()
  note(`megaott status: ${statusText}`)
  note(`megaott demo fallback: ${/demo pack/i.test(statusText)}`)
  if (!/MegaOTT unavailable/i.test(statusText) || !/demo pack/i.test(statusText)) {
    throw new Error('Expected MegaOTT demo fallback message')
  }
  await page.screenshot({ path: path.join(outDir, 'phase5_xtream_fallback.png') }).catch((err) => note(`screenshot skipped: ${err instanceof Error ? err.message : err}`))

  // Catchup on Arena Sports (catchup:true) — click UI (avoid Vite dual-module store imports)
  await page.getByRole('button', { name: 'Live TV' }).click()
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: /Arena Sports HD/i }).first().click()
  await page.waitForTimeout(700)
  // Reveal chrome
  await page.mouse.move(400, 200)
  await page.waitForTimeout(200)
  const catchupBtn = page.getByRole('button', { name: /Catch up 30 minutes|−30m/i })
  for (let i = 0; i < 8 && !(await catchupBtn.count()); i += 1) {
    await page.mouse.move(420 + i * 5, 220)
    await page.waitForTimeout(200)
  }
  note(`catchup control: ${await catchupBtn.count()}`)
  note(`no-catchup label: ${await page.getByText('No catch-up').count()}`)
  note(`now watching: ${(await page.locator('body').innerText()).match(/NOW WATCHING[\s\S]{0,40}/)?.[0]}`)
  if (!(await catchupBtn.count())) throw new Error('Catchup control missing on archive channel')
  await catchupBtn.click()
  await page.waitForTimeout(400)
  await page.mouse.move(400, 200)
  await page.waitForTimeout(200)
  const catchupStatus = page.getByTestId('catchup-status')
  note(`catchup status: ${await catchupStatus.count()}`)
  if (!(await catchupStatus.count())) throw new Error('Catchup status missing')
  note(`catchup text: ${await catchupStatus.innerText()}`)
  await page.screenshot({ path: path.join(outDir, 'phase5_catchup_stub.png') }).catch((err) => note(`screenshot skipped: ${err instanceof Error ? err.message : err}`))

  // Multi-view
  await page.getByRole('button', { name: 'Multi-view' }).first().click()
  await page.waitForTimeout(700)
  let mv = await page.locator('body').innerText()
  note(`multiview page: ${/Live mosaic|Multi-view/i.test(mv)}`)
  await page.getByRole('button', { name: /4-up mosaic/i }).click()
  await page.waitForTimeout(500)
  mv = await page.locator('body').innerText()
  const slotCount = await page.getByText(/Slot \d/).count()
  note(`4-up slots: ${slotCount}`)
  if (slotCount < 4) throw new Error(`Expected 4 mosaic slots, got ${slotCount}`)
  const focusBtn = page.getByRole('button', { name: /Focus slot/i }).first()
  if (await focusBtn.count()) await focusBtn.click()
  await page.screenshot({ path: path.join(outDir, 'phase5_multiview_4up.png') }).catch((err) => note(`screenshot skipped: ${err instanceof Error ? err.message : err}`))

  // TV focus: tab to a nav button and check focus-visible styling path exists
  await page.getByRole('button', { name: 'Home' }).focus()
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim() || '')
  note(`tv focus home: ${focused.includes('Home')}`)
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(200)
  const afterArrow = await page.evaluate(() => document.activeElement?.textContent?.trim() || '')
  note(`tv focus after arrow: ${afterArrow}`)
  await page.screenshot({ path: path.join(outDir, 'phase5_tv_focus.png') }).catch((err) => note(`screenshot skipped: ${err instanceof Error ? err.message : err}`))

  note('PHASE5_VERIFY_OK')
} catch (err) {
  note(`PHASE5_VERIFY_FAIL: ${err instanceof Error ? err.message : String(err)}`)
  await page.screenshot({ path: path.join(outDir, 'phase5_verify_failure.png') }).catch(() => undefined)
  process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
  safeWriteFile(path.join(outDir, 'phase5_verification.log'), log.join('\n') + '\n')
}
