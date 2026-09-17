/**
 * TV-first simplify: provider category chips + slim nav + focus cursor.
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
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await context.newPage()
await page.goto(base, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await enterWithDemoPack(page)

await page.locator('[data-testid="remote-toggle"]').click()
await page.waitForTimeout(400)
await page.getByTestId('nav-live').click()
await page.waitForTimeout(500)

const nav = await page.evaluate(() => {
  const labels = [...document.querySelectorAll('[data-testid^="nav-"]')].map((el) =>
    (el.getAttribute('data-testid') || '').replace('nav-', ''),
  )
  return {
    labels,
    hasHome: labels.includes('home'),
    hasFavorites: labels.includes('favorites'),
    hasMultiview: labels.includes('multiview'),
    primary: ['live', 'guide', 'vod', 'settings'].every((id) => labels.includes(id)),
  }
})

// Inject a non-demo source with provider-style group folders.
await page.evaluate(() => {
  const raw = localStorage.getItem('aether-iptv-v2')
  const parsed = raw ? JSON.parse(raw) : { state: {} }
  const state = parsed.state || {}
  state.prefs = {
    ...(state.prefs || {}),
    categoryBrowseMode: 'provider',
    showAssistantFab: false,
  }
  state.sources = [
    {
      id: 'megaott_test',
      name: 'MegaOTT test',
      type: 'megaott',
      url: 'http://example.test',
      username: 'u',
      password: 'p',
    },
  ]
  state.activeSourceId = 'megaott_test'
  state.channels = [
    {
      id: 'p1',
      name: 'ESPN Demo',
      group: 'US|SPORTS|ESPN',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      kind: 'live',
      category: 'Sports',
    },
    {
      id: 'p2',
      name: 'BBC Demo',
      group: 'UK - NEWS',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      kind: 'live',
      category: 'News',
    },
    {
      id: 'p3',
      name: 'ESPN 2',
      group: 'US|SPORTS|ESPN',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      kind: 'live',
      category: 'Sports',
    },
  ]
  state.player = {
    channelId: 'p1',
    paused: false,
    muted: false,
    volume: 1,
    overlayVisible: false,
    multiViewLayout: 1,
    multiViewSlots: [],
    catchup: null,
  }
  state.view = 'live'
  state.menuOpen = true
  state.onboarded = true
  parsed.state = state
  localStorage.setItem('aether-iptv-v2', JSON.stringify(parsed))
})
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(700)
if (await page.locator('[data-testid="remote-toggle"]').count()) {
  await page.locator('[data-testid="remote-toggle"]').click()
  await page.waitForTimeout(300)
}
await page.getByTestId('nav-live').click()
await page.waitForTimeout(600)

const chips = await page.evaluate(() => {
  const texts = [...document.querySelectorAll('[data-testid="live-category-chips"] button')].map(
    (b) => (b.textContent || '').replace(/\s+/g, ' ').trim(),
  )
  return {
    texts,
    hasProviderSports: texts.some((t) => /US\|SPORTS\|ESPN/i.test(t)),
    hasProviderNews: texts.some((t) => /UK - NEWS/i.test(t)),
    assistantFabVisible: Boolean(
      document.querySelector('[data-testid="assistant-fab"]:not(.sr-only)'),
    ),
  }
})

await page.evaluate(() => document.querySelector('[data-testid="chip-all"]')?.focus())
const focus = await page.evaluate(() => {
  const el = document.activeElement
  const style = el ? getComputedStyle(el) : null
  return {
    outline: style?.outline || '',
    boxShadow: style?.boxShadow || '',
    focused: el?.getAttribute('data-testid'),
  }
})

await page.screenshot({ path: path.join(outDir, 'tv_first_provider_categories.png') })
await page.screenshot({ path: path.join(outDir, 'tv_first_focus_cursor.png') })

await context.close()
await browser.close()

const result = {
  ok: nav.primary && !nav.hasHome && !nav.hasFavorites && chips.hasProviderSports && chips.hasProviderNews,
  nav,
  chips,
  focus,
}
fs.writeFileSync(path.join(outDir, 'tv_first_simplify_verify.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
if (!result.ok) {
  console.error('TV_FIRST_SIMPLIFY_VERIFY_FAIL')
  process.exit(1)
}
console.log('TV_FIRST_SIMPLIFY_VERIFY_OK')
