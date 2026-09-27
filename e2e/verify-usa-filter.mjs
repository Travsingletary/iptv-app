/**
 * USA-only live filter: default USA scope, toggle to all countries.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { resolveArtifactDir, safeWriteFile, publishDir } from './artifactDir.mjs'
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

  // Seed mixed USA + UK catalog on top of demo.
  await page.evaluate(() => {
    const store = window.__AETHER_STORE__
    if (!store) throw new Error('missing __AETHER_STORE__')
    const state = store.getState()
    const extra = [
      {
        id: 'usa_espn',
        name: 'ESPN USA',
        group: 'USA | Sports',
        url: state.channels[0]?.url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        kind: 'live',
        number: 101,
      },
      {
        id: 'uk_bbc',
        name: 'BBC One',
        group: 'UK - NEWS',
        url: state.channels[0]?.url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        kind: 'live',
        number: 201,
      },
    ]
    store.setState({
      channels: [...state.channels, ...extra],
      prefs: { ...state.prefs, liveRegionFilter: 'usa' },
    })
  })

  // TV-first: chrome may be hidden — open remote then Live.
  await page.getByTestId('remote-toggle').click().catch(() => {})
  await page.getByTestId('nav-live').click()
  await page.waitForTimeout(800)

  const countText = await page.getByTestId('live-channel-count').innerText()
  note(`count usa: ${countText}`)
  if (!/USA only/i.test(countText)) throw new Error('Expected USA only label')

  const names = await page.locator('[data-testid="live-page"] button').allInnerTexts()
  const joined = names.join('\n')
  if (/BBC One/i.test(joined)) throw new Error('UK channel visible under USA filter')
  if (!/ESPN USA/i.test(joined) && !(await page.getByText('ESPN USA').count())) {
    // May be virtualized — search
    await page.getByTestId('live-channel-search').fill('ESPN USA')
    await page.waitForTimeout(300)
    if (!(await page.getByText('ESPN USA').count())) throw new Error('USA ESPN missing')
  }
  note('usa espn visible; uk hidden')

  await page.getByTestId('live-region-toggle').click()
  await page.waitForTimeout(400)
  const allText = await page.getByTestId('live-channel-count').innerText()
  note(`count all: ${allText}`)
  if (/USA only/i.test(allText)) throw new Error('Expected All countries mode')

  await page.getByTestId('live-channel-search').fill('BBC')
  await page.waitForTimeout(300)
  if (!(await page.getByText('BBC One').count())) throw new Error('BBC should show when All')
  note('all countries shows BBC')

  await page.screenshot({ path: path.join(outDir, 'usa_filter_live.png') })
  note('USA_FILTER_VERIFY_OK')
} catch (err) {
  note(`USA_FILTER_VERIFY_FAIL: ${err instanceof Error ? err.message : String(err)}`)
  await page.screenshot({ path: path.join(outDir, 'usa_filter_failure.png') }).catch(() => undefined)
  process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
  safeWriteFile(path.join(outDir, 'usa_filter_verification.log'), `${log.join('\n')}\n`)
  publishDir(outDir, ['usa_filter_live.png', 'usa_filter_verification.log', 'usa_filter_failure.png'])
}
