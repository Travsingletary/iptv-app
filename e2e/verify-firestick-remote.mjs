/**
 * Fire Stick remote map runtime check (keyboard simulation).
 * Writes screenshots + webm under /opt/cursor/artifacts.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
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
const outDir = '/opt/cursor/artifacts'
fs.mkdirSync(outDir, { recursive: true })
const base = process.env.AETHER_URL || 'http://127.0.0.1:5190'

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
})
const page = await context.newPage()
await page.goto(base, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })

await enterWithDemoPack(page)

await page.waitForSelector('[data-testid="remote-toggle"]', { timeout: 15000 })

const fire = async (key, code = key) => {
  await page.evaluate(
    ({ key, code }) => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }),
      )
    },
    { key, code },
  )
  await page.waitForTimeout(280)
}

// Open overlay via Menu so we can exercise focus rings on the side nav.
if (!(await page.locator('[data-testid="remote-back"]').count())) {
  await page.locator('[data-testid="remote-toggle"]').click()
  await page.waitForTimeout(450)
}

await page.evaluate(() => {
  const live = [...document.querySelectorAll('aside button[data-tv-focus]')].find((b) =>
    /Live/i.test(b.textContent || ''),
  )
  live?.focus()
})
await page.waitForTimeout(250)

const seq = []
for (let i = 0; i < 4; i++) {
  await fire('ArrowDown')
  seq.push(
    await page.evaluate(() =>
      (document.activeElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24),
    ),
  )
}
await page.screenshot({ path: path.join(outDir, 'firestick_dpad_focus_rings.png') })

await fire('Escape')
await page.waitForTimeout(350)
const afterBack = await page.locator('[data-testid="remote-back"]').count()
await page.screenshot({ path: path.join(outDir, 'firestick_back_immersive.png') })

// Immersive ← opens Live side rail (TiviMate-like). OK alone shows chrome first.
await page.evaluate(() => {
  document.body.tabIndex = -1
  document.body.focus()
})
await fire('Enter')
const chromeHint = await page.evaluate(() =>
  Boolean(document.querySelector('[data-testid="player-chrome"], [data-tv-focus]')),
)
await fire('Escape')
await page.waitForTimeout(200)
await page.evaluate(() => {
  document.body.tabIndex = -1
  document.body.focus()
})
await fire('ArrowLeft')
await page.waitForTimeout(400)
const afterLeft = await page.locator('[data-testid="remote-back"]').count()
const liveRailAfterLeft = await page.locator('[data-testid="live-side-rail"]').count()
await page.screenshot({ path: path.join(outDir, 'firestick_ok_opens_live_rail.png') })

await page.evaluate(() => {
  ;[...document.querySelectorAll('aside button')]
    .find((b) => /Live/i.test(b.textContent || ''))
    ?.click()
})
await page.waitForTimeout(650)
await page.evaluate(() => document.querySelector('[data-testid="chip-all"]')?.focus())
await fire('ArrowRight')
await fire('ArrowRight')
await fire('ArrowRight')
const chip = await page.evaluate(() => {
  const el = document.activeElement
  const style = el ? getComputedStyle(el) : null
  const shadow = style?.boxShadow || ''
  const outline = style?.outlineColor || ''
  return {
    text: el?.textContent?.trim().slice(0, 40),
    testid: el?.getAttribute?.('data-testid'),
    ring:
      shadow.includes('232, 160, 69') ||
      shadow.includes('212, 175, 55') ||
      outline.includes('232, 160, 69') ||
      outline.includes('212, 175, 55') ||
      Boolean(el?.matches?.(':focus')),
  }
})
await page.screenshot({ path: path.join(outDir, 'firestick_chip_focus.png') })

await fire('Escape')
await page.evaluate(() => {
  document.body.tabIndex = -1
  document.body.focus()
})
await fire('r', 'KeyR')
const afterR = await page.locator('[data-testid="remote-back"]').count()

const videoPath = await page.video().path()
await context.close()
await browser.close()

const dest = path.join(outDir, 'firestick_dpad_ok_back_demo.webm')
fs.renameSync(videoPath, dest)

const navReachedSettingsOrGuide = seq.some((s) => /Guide|On Demand|Settings|Live/i.test(s))
const result = {
  ok:
    afterBack === 0 &&
    afterLeft === 1 &&
    liveRailAfterLeft === 1 &&
    afterR === 1 &&
    (navReachedSettingsOrGuide || chip.testid?.startsWith('chip-')) &&
    chip.ring,
  seq,
  afterBack,
  chromeHint,
  afterLeft,
  liveRailAfterLeft,
  afterR,
  chip,
  video: dest,
}
fs.writeFileSync(path.join(outDir, 'firestick_verify.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
if (!result.ok) {
  console.error('FIRE_STICK_VERIFY_FAIL')
  process.exit(1)
}
console.log('FIRE_STICK_VERIFY_OK')
