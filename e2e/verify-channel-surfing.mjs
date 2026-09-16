/**
 * Channel surfing: zap OSD, debounced tune, number pad, hop strip, stable canvas.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { enterWithDemoPack } from './onboarding.mjs'
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
  log.push(String(msg))
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await context.newPage()

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await enterWithDemoPack(page)
await page.waitForSelector('[data-testid="remote-toggle"]', { timeout: 15_000 })

const fire = async (key, code = key) => {
  await page.evaluate(
    ({ key, code }) => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }),
      )
    },
    { key, code },
  )
}

// Ensure immersive (menu closed)
for (let i = 0; i < 3; i++) {
  if (!(await page.locator('[data-testid="remote-back"]').count())) break
  await fire('Escape')
  await page.waitForTimeout(200)
}
await page.evaluate(() => {
  document.body.tabIndex = -1
  document.body.focus()
})

const canvasBefore = await page.locator('[data-testid="video-canvas"]').count()
note(`video_canvas_before=${canvasBefore}`)

const osdNames = []
for (let i = 0; i < 6; i++) {
  await fire('ArrowDown')
  await page.waitForTimeout(40)
  const name = await page.evaluate(() => {
    const osd = document.querySelector('[data-testid="zap-osd"]')
    return osd?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80) || ''
  })
  if (name) osdNames.push(name)
}
await page.waitForTimeout(350)
const osdVisible = await page.locator('[data-testid="zap-osd"]').count()
note(`zap_osd_visible=${osdVisible} samples=${osdNames.length}`)
await page.screenshot({ path: path.join(outDir, 'channel_surfing_zap_osd.png') })

// Number pad — channel 3 (Arena Sports HD in demo pack)
await fire('3')
await page.waitForTimeout(120)
const digitOverlay = await page.locator('[data-testid="channel-number-overlay"]').count()
const digits = await page.locator('[data-testid="channel-number-digits"]').textContent()
note(`digit_overlay=${digitOverlay} digits=${digits}`)
await page.screenshot({ path: path.join(outDir, 'channel_surfing_number_pad.png') })
await fire('Enter')
await page.waitForTimeout(400)
const afterCommitOsd = await page.locator('[data-testid="zap-osd"]').count()
note(`after_digit_commit_osd=${afterCommitOsd}`)

// Live rail hop strip
await fire('Enter')
await page.waitForTimeout(500)
const liveRail = await page.locator('[data-testid="live-side-rail"]').count()
const hopStrip = await page.locator('[data-testid="surfing-hop-strip"]').count()
note(`live_rail=${liveRail} hop_strip=${hopStrip}`)
await page.screenshot({ path: path.join(outDir, 'channel_surfing_hop_strip.png') })

const canvasAfter = await page.locator('[data-testid="video-canvas"]').count()
note(`video_canvas_after=${canvasAfter}`)

const ok =
  canvasBefore === 1 &&
  canvasAfter === 1 &&
  osdVisible >= 1 &&
  osdNames.length >= 3 &&
  digitOverlay === 1 &&
  String(digits || '').includes('3') &&
  afterCommitOsd >= 1 &&
  liveRail === 1 &&
  hopStrip === 1

safeWriteFile(path.join(outDir, 'channel_surfing_verify.log'), log.join('\n') + '\n')
try {
  for (const name of [
    'channel_surfing_zap_osd.png',
    'channel_surfing_number_pad.png',
    'channel_surfing_hop_strip.png',
    'channel_surfing_verify.log',
  ]) {
    const src = path.join(outDir, name)
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join('/opt/cursor/artifacts', name))
  }
} catch (err) {
  note(`publish_warn=${err instanceof Error ? err.message : err}`)
}
await browser.close()

if (!ok) {
  console.error('CHANNEL_SURFING_VERIFY_FAIL')
  console.error(log.join('\n'))
  process.exit(1)
}
console.log('CHANNEL_SURFING_VERIFY_OK')
