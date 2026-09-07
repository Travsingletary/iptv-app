/**
 * Phase 1 runtime verification:
 * Assistant panel + Live AI, tool execution, For You Now, event buffer.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { resolveArtifactDir, safeWriteFile, publishDir } from './artifactDir.mjs'

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

const statusRes = await fetch(`${BASE}/api/assistant`)
const statusJson = await statusRes.json()
note(`api aiMode: ${statusJson.aiMode} configured=${statusJson.configured}`)
if (!statusJson.ok) throw new Error('GET /api/assistant not ok')

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
    await page.waitForTimeout(900)
  }
  note('onboarding: demo pack')

  // For You Now rail on Home
  const forYou = page.getByText('For You Now')
  if (!(await forYou.count())) throw new Error('For You Now rail missing on Home')
  note('for you now: visible')
  await page.screenshot({ path: path.join(outDir, 'phase1_home_for_you_now.png') })

  // Live search + channel switch telemetry
  await page.getByRole('button', { name: 'Live TV' }).click()
  await page.waitForTimeout(1200)
  const search = page.getByPlaceholder('Search channels')
  await search.fill('Arena')
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: /Arena Sports/i }).first().click()
  await page.waitForTimeout(2000)
  await search.fill('')
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: /Aether One/i }).first().click()
  await page.waitForTimeout(1800)

  // Favorite toggle
  await page.getByRole('button', { name: 'Toggle favorite' }).click()
  await page.waitForTimeout(400)

  const events = await page.evaluate(() => {
    const raw = localStorage.getItem('aether_event_buffer')
    return raw ? JSON.parse(raw) : []
  })
  const types = Object.fromEntries(
    ['search_query', 'channel_switch', 'play_start', 'play_end', 'favorite_toggle'].map((t) => [
      t,
      events.filter((e) => e.type === t).length,
    ]),
  )
  note(`events: ${JSON.stringify(types)}`)
  if (!types.search_query) throw new Error('Expected search_query event')
  if (!types.channel_switch) throw new Error('Expected channel_switch event')
  if (!types.play_start) throw new Error('Expected play_start event')
  if (!types.favorite_toggle) throw new Error('Expected favorite_toggle event')

  // Assistant panel + Live AI badge + live chat tool
  await page.getByRole('button', { name: /^Assistant$/i }).click()
  await page.waitForTimeout(600)
  const modeBadge = page.getByTestId('assistant-ai-mode')
  const modeText = (await modeBadge.count()) ? await modeBadge.innerText() : ''
  note(`assistant badge: ${modeText}`)
  if (statusJson.aiMode === 'live' && !/Live AI/i.test(modeText)) {
    throw new Error(`Expected Live AI badge when API is live, got: ${modeText}`)
  }

  const input = page.getByPlaceholder(/Ask, remind, mute|Ask for channels/i)
  await input.fill('Play Pulse News 24')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(statusJson.aiMode === 'live' ? 8000 : 2000)

  let asideText = await page.locator('aside').last().innerText()
  note(`play_channel UI: ${/play_channel/i.test(asideText)}`)
  if (!/play_channel/i.test(asideText)) throw new Error('play_channel not surfaced')
  if (!/Pulse News/i.test(asideText)) throw new Error('Expected Pulse News in play_channel result')
  if (statusJson.aiMode === 'live' && !/Live AI/i.test(asideText)) {
    throw new Error('Expected Live AI label on assistant reply')
  }

  await input.fill('Recommend something to watch')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(statusJson.aiMode === 'live' ? 8000 : 2000)
  asideText = await page.locator('aside').last().innerText()
  note(`recommend_now UI: ${/recommend_now/i.test(asideText)}`)
  if (!/recommend_now/i.test(asideText)) throw new Error('recommend_now not surfaced')

  await page.screenshot({ path: path.join(outDir, 'phase1_assistant_live_tools.png') })

  // Confirm playback switched to Pulse via store / player
  const current = await page.evaluate(() => {
    const store = window.__AETHER_STORE__
    return store?.getState?.()?.player?.channelId ?? null
  })
  note(`current channel after play tool: ${current}`)
  if (current && current !== 'live_pulse_news') {
    // Soft fail note if store bridge missing; hard fail if store present with wrong id
    const hasStore = await page.evaluate(() => Boolean(window.__AETHER_STORE__))
    if (hasStore) throw new Error(`play_channel did not tune Pulse (got ${current})`)
  }

  note('PHASE1_VERIFY_OK')
} catch (err) {
  note(`PHASE1_VERIFY_FAIL: ${err instanceof Error ? err.message : String(err)}`)
  await page.screenshot({ path: path.join(outDir, 'phase1_verify_failure.png') }).catch(() => undefined)
  process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
  safeWriteFile(path.join(outDir, 'phase1_verification.log'), `${log.join('\n')}\n`)
  publishDir(outDir, [
    'phase1_home_for_you_now.png',
    'phase1_assistant_live_tools.png',
    'phase1_verification.log',
    'phase1_verify_failure.png',
  ])
}
