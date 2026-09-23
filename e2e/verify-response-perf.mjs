/**
 * Measure zap-path main-thread cost: persist serialization must stay cheap when
 * only recentIds change (channels array identity unchanged).
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
const base = process.env.AETHER_URL || 'http://127.0.0.1:5173'

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
await page.goto(base, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await enterWithDemoPack(page)

// Seed a large live catalog so persist work resembles MegaOTT scale.
await page.evaluate(() => {
  const raw = localStorage.getItem('aether-iptv-v2')
  const parsed = raw ? JSON.parse(raw) : { state: {} }
  const state = parsed.state || {}
  const channels = []
  for (let i = 0; i < 2500; i++) {
    channels.push({
      id: `perf_${i}`,
      name: `Perf Channel ${i}`,
      group: `Group ${i % 40}`,
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      kind: 'live',
    })
  }
  state.sources = [
    {
      id: 'megaott_perf',
      name: 'Perf',
      type: 'megaott',
      url: 'http://example.test',
      username: 'u',
      password: 'p',
    },
  ]
  state.activeSourceId = 'megaott_perf'
  state.channels = channels
  state.player = { ...(state.player || {}), channelId: 'perf_0', overlayVisible: false }
  state.view = 'live'
  state.menuOpen = false
  state.onboarded = true
  state.prefs = { ...(state.prefs || {}), reduceMotion: true }
  parsed.state = state
  localStorage.setItem('aether-iptv-v2', JSON.stringify(parsed))
})
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(800)

const metrics = await page.evaluate(async () => {
  const fire = (key) =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true }))

  // Warm
  for (let i = 0; i < 3; i++) {
    fire('ArrowDown')
    await new Promise((r) => setTimeout(r, 50))
  }

  const setItemTimes = []
  const orig = localStorage.setItem.bind(localStorage)
  localStorage.setItem = (k, v) => {
    const t0 = performance.now()
    orig(k, v)
    setItemTimes.push({ key: k, ms: performance.now() - t0, bytes: String(v).length })
  }

  const t0 = performance.now()
  for (let i = 0; i < 12; i++) {
    fire('ArrowDown')
    await new Promise((r) => setTimeout(r, 40))
  }
  const zapMs = performance.now() - t0

  // Allow debounce window to flush once
  await new Promise((r) => setTimeout(r, 1800))
  localStorage.setItem = orig

  const iptvWrites = setItemTimes.filter((w) => w.key === 'aether-iptv-v2')
  return {
    zapMs: Math.round(zapMs),
    zapPerKeyMs: Math.round(zapMs / 12),
    persistWritesDuringZapWindow: iptvWrites.length,
    maxPersistMs: iptvWrites.reduce((m, w) => Math.max(m, w.ms), 0),
    maxPersistBytes: iptvWrites.reduce((m, w) => Math.max(m, w.bytes), 0),
    reduceMotion: true,
  }
})

await page.screenshot({ path: path.join(outDir, 'response_perf_zap_osd.png') })
await browser.close()

const result = {
  ok:
    metrics.zapPerKeyMs < 120 &&
    metrics.persistWritesDuringZapWindow <= 2 &&
    metrics.maxPersistMs < 250,
  metrics,
}
fs.writeFileSync(path.join(outDir, 'response_perf_verify.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
if (!result.ok) {
  console.error('RESPONSE_PERF_VERIFY_FAIL')
  process.exit(1)
}
console.log('RESPONSE_PERF_VERIFY_OK')
