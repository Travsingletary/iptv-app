/**
 * Perf + TiviMate Live rail + playlist persistence verify.
 * Injects a MegaOTT-scale catalog, measures virtual list DOM size, checks OK → live rail.
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

const CATALOG = 6897

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

const injectMs = await page.evaluate(async (count) => {
  const t0 = performance.now()
  const channels = []
  for (let i = 0; i < count; i++) {
    channels.push({
      id: `perf_live_${i}`,
      name: `Perf Channel ${String(i).padStart(4, '0')}`,
      group: i % 3 === 0 ? 'Sports' : i % 3 === 1 ? 'News' : 'Entertainment',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      kind: 'live',
    })
  }
  // Access zustand store via window if exposed; else patch through React by rewriting localStorage + reload.
  const key = 'aether-iptv-v2'
  const raw = localStorage.getItem(key)
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 }
  parsed.state = {
    ...parsed.state,
    onboarded: true,
    channels,
    sources: [
      {
        id: 'megaott_perf',
        name: 'Perf MegaOTT',
        type: 'megaott',
        url: 'http://example.test',
        username: 'u',
        password: 'p',
        createdAt: Date.now(),
      },
    ],
    activeSourceId: 'megaott_perf',
    vodCategories: [],
    favorites: [],
    recentIds: [],
    view: 'live',
    menuOpen: true,
  }
  localStorage.setItem(key, JSON.stringify(parsed))
  return performance.now() - t0
}, CATALOG)

await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('[data-testid="live-channel-list"]', { timeout: 20_000 })

const listMetrics = await page.evaluate(() => {
  const list = document.querySelector('[data-testid="live-channel-list"]')
  const countEl = document.querySelector('[data-testid="live-channel-count"]')
  const rail = document.querySelector('[data-testid="live-side-rail"]')
  const video = document.querySelector('video')
  return {
    catalogAttr: list?.getAttribute('data-catalog-count'),
    virtualAttr: list?.getAttribute('data-virtual-count'),
    domButtons: list?.querySelectorAll('button[data-tv-focus]').length ?? 0,
    countText: countEl?.textContent?.trim() ?? '',
    hasRail: Boolean(rail),
    hasVideo: Boolean(video),
  }
})

// Persist round-trip: ensure >500 channels survive reload
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('[data-testid="live-channel-count"]', { timeout: 20_000 })
const afterReload = await page.evaluate(() => {
  const countEl = document.querySelector('[data-testid="live-channel-count"]')
  const list = document.querySelector('[data-testid="live-channel-list"]')
  return {
    countText: countEl?.textContent?.trim() ?? '',
    catalogAttr: list?.getAttribute('data-catalog-count'),
    persistedLive: (() => {
      try {
        const parsed = JSON.parse(localStorage.getItem('aether-iptv-v2') || '{}')
        return (parsed.state?.channels || []).filter((c) => c.kind === 'live').length
      } catch {
        return -1
      }
    })(),
  }
})

// TiviMate OK path: dismiss → Enter opens live rail
await page.evaluate(() => {
  document.body.tabIndex = -1
  document.body.focus()
})
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
await page.evaluate(() => {
  document.body.tabIndex = -1
  document.body.focus()
})
await page.keyboard.press('Enter')
await page.waitForTimeout(500)
const okOpensLive = await page.evaluate(() => ({
  rail: Boolean(document.querySelector('[data-testid="live-side-rail"]')),
  compactNav: Boolean(document.querySelector('[data-testid="side-nav-compact"]')),
  menuBack: Boolean(document.querySelector('[data-testid="remote-back"]')),
}))

await page.screenshot({
  path: path.join(outDir, 'perf_tivimate_live_rail.png'),
  fullPage: false,
})

const result = {
  catalogSize: CATALOG,
  injectMs: Math.round(injectMs),
  listMetrics,
  afterReload,
  okOpensLive,
  virtualOk:
    Number(listMetrics.virtualAttr) > 0 &&
    Number(listMetrics.virtualAttr) < 80 &&
    Number(listMetrics.catalogAttr) >= CATALOG,
  persistOk: afterReload.persistedLive >= CATALOG,
  tivimateOk: okOpensLive.rail && okOpensLive.menuBack,
}

const ok = result.virtualOk && result.persistOk && result.tivimateOk
result.ok = ok

safeWriteFile(path.join(outDir, 'perf_tivimate_playlist_verify.json'), JSON.stringify(result, null, 2))
safeWriteFile(path.join(outDir, 'perf_tivimate_playlist_verify.log'), log.join('\n') + '\n' + JSON.stringify(result, null, 2))
note(JSON.stringify(result, null, 2))

await browser.close()

if (!ok) {
  console.error('PERF_TIVIMATE_PLAYLIST_VERIFY_FAIL')
  process.exit(1)
}
console.log('PERF_TIVIMATE_PLAYLIST_VERIFY_OK')
