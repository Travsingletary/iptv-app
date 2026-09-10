/**
 * Fire Stick remote map runtime check (keyboard simulation).
 * Writes screenshots + webm under /opt/cursor/artifacts.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

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

const demoBtn = page.getByRole('button', { name: /demo pack/i })
if (await demoBtn.count()) {
  // Prefer native React click when pointer interception flakes
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) =>
      x.textContent?.includes('Enter with demo pack'),
    )
    if (!b) return false
    const propKey = Object.keys(b).find((k) => k.startsWith('__reactProps'))
    const p = propKey ? b[propKey] : null
    if (p?.onClick) {
      p.onClick({ preventDefault() {}, stopPropagation() {} })
      return true
    }
    b.click()
    return true
  })
  if (!clicked) await demoBtn.click({ force: true })
  await page.waitForTimeout(1000)
}

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
await page.screenshot({ path: path.join(outDir, 'firestick_ok_opens_menu.png') })

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
const chip = await page.evaluate(() => ({
  text: document.activeElement?.textContent?.trim().slice(0, 40),
  testid: document.activeElement?.getAttribute?.('data-testid'),
  ring: getComputedStyle(document.activeElement).boxShadow.includes('232, 160, 69'),
}))
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

const result = {
  ok: afterBack === 0 && afterOk === 1 && afterR === 1 && seq.includes('Live TV') && chip.ring,
  seq,
  afterBack,
  afterOk,
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
