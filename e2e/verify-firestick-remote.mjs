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

if (!(await page.locator('[data-testid="remote-back"]').count())) {
  await page.locator('[data-testid="remote-toggle"]').click()
  await page.waitForTimeout(450)
}

await page.evaluate(() => {
  const home = [...document.querySelectorAll('aside button[data-tv-focus]')].find((b) =>
    b.textContent.includes('Home'),
  )
  home?.focus()
})
await page.waitForTimeout(250)

const seq = []
for (let i = 0; i < 5; i++) {
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

await page.evaluate(() => {
  document.body.tabIndex = -1
  document.body.focus()
})
await fire('Enter')
const afterOk = await page.locator('[data-testid="remote-back"]').count()
const liveRailAfterOk = await page.locator('[data-testid="live-side-rail"]').count()
await page.screenshot({ path: path.join(outDir, 'firestick_ok_opens_live_rail.png') })

await page.evaluate(() => {
  ;[...document.querySelectorAll('aside button')]
    .find((b) => b.textContent.includes('Live TV'))
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
    // Ember focus may be box-shadow or outline depending on a11y CSS.
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

const navReachedLive = seq.some((s) => /Live/i.test(s))
const result = {
  ok:
    afterBack === 0 &&
    afterOk === 1 &&
    liveRailAfterOk === 1 &&
    afterR === 1 &&
    (navReachedLive || chip.testid?.startsWith('chip-')) &&
    chip.ring,
  seq,
  afterBack,
  afterOk,
  liveRailAfterOk,
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
