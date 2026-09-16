/**
 * Record a short channel-surfing walkthrough (zap OSD + number pad + hop strip).
 * Publishes webm + png under /opt/cursor/artifacts.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { enterWithDemoPack } from './onboarding.mjs'
import { publishArtifact, resolveArtifactDir, safeWriteFile } from './artifactDir.mjs'

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
const preferred = '/opt/cursor/artifacts'
fs.mkdirSync(preferred, { recursive: true })

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

// Go immersive
for (let i = 0; i < 4; i++) {
  if (!(await page.locator('[data-testid="remote-back"]').count())) break
  await fire('Escape')
  await page.waitForTimeout(180)
}
await page.evaluate(() => {
  document.body.tabIndex = -1
  document.body.focus()
})
await page.waitForTimeout(300)

// Rapid zap — OSD should track immediately
for (let i = 0; i < 8; i++) {
  await fire('ArrowDown')
  await page.waitForTimeout(70)
}
await page.waitForTimeout(450)
await page.screenshot({ path: path.join(outDir, 'channel_surfing_rapid_zap_osd.png') })
await page.screenshot({ path: path.join(preferred, 'channel_surfing_rapid_zap_osd.png') })

// Number entry for channel 3 (Arena Sports)
await fire('3')
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(outDir, 'channel_surfing_number_entry.png') })
await page.screenshot({ path: path.join(preferred, 'channel_surfing_number_entry.png') })
await page.waitForTimeout(200)
await fire('Enter')
await page.waitForTimeout(500)

// Open Live rail — hop strip
await fire('Enter')
await page.waitForTimeout(600)
await page.screenshot({ path: path.join(outDir, 'channel_surfing_hop_strip_rail.png') })
await page.screenshot({ path: path.join(preferred, 'channel_surfing_hop_strip_rail.png') })

const videoPath = await page.video()?.path()
await context.close()
await browser.close()

if (videoPath && fs.existsSync(videoPath)) {
  const destLocal = path.join(outDir, 'channel_surfing_zap_osd_number_pad_demo.webm')
  const destPub = path.join(preferred, 'channel_surfing_zap_osd_number_pad_demo.webm')
  fs.copyFileSync(videoPath, destLocal)
  try {
    fs.copyFileSync(videoPath, destPub)
  } catch (err) {
    console.warn('publish video failed', err)
  }
  try {
    fs.unlinkSync(videoPath)
  } catch {
    /* ignore */
  }
  console.log('DEMO_VIDEO', destPub)
}

safeWriteFile(
  path.join(preferred, 'channel_surfing_demo_ok.log'),
  'CHANNEL_SURFING_DEMO_OK\n',
)
console.log('CHANNEL_SURFING_DEMO_OK')
