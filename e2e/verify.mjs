/**
 * Runtime verification for gap-close work.
 * Uses npx-installed playwright (no project dependency required).
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
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
const outDir = '/opt/cursor/artifacts'
fs.mkdirSync(outDir, { recursive: true })

const log = []
function note(msg) {
  console.log(msg)
  log.push(msg)
}

async function waitForVideo(page, label, timeoutMs = 12000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const state = await page.evaluate(() => {
      const v = document.querySelector('video')
      if (!v) return null
      return {
        readyState: v.readyState,
        paused: v.paused,
        currentTime: v.currentTime,
        videoWidth: v.videoWidth,
        error: v.error?.message ?? null,
      }
    })
    if (state && (state.videoWidth > 0 || state.currentTime > 0.2 || state.readyState >= 2)) {
      note(`${label}: ${JSON.stringify(state)}`)
      return state
    }
    await page.waitForTimeout(500)
  }
  const finalState = await page.evaluate(() => {
    const v = document.querySelector('video')
    if (!v) return { error: 'no video' }
    return {
      readyState: v.readyState,
      paused: v.paused,
      currentTime: v.currentTime,
      videoWidth: v.videoWidth,
      error: v.error?.message ?? null,
      src: v.currentSrc || v.getAttribute('src'),
    }
  })
  note(`${label} TIMEOUT: ${JSON.stringify(finalState)}`)
  return finalState
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  recordVideo: { dir: outDir, size: { width: 1400, height: 900 } },
})
const page = await context.newPage()

try {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.clear()
  })
  await page.reload({ waitUntil: 'networkidle' })

  await enterWithDemoPack(page)
  note('onboarding: entered demo pack')
  await page.screenshot({ path: path.join(outDir, 'verify_home.png') })

  await page.getByRole('button', { name: 'Live TV' }).click()
  await page.waitForTimeout(2000)

  const search = page.getByPlaceholder('Search channels')
  await search.fill('Arena')
  await page.waitForTimeout(500)

  const eventsAfterSearch = await page.evaluate(() => {
    const raw = localStorage.getItem('aether_event_buffer')
    return raw ? JSON.parse(raw) : []
  })
  const searchEvents = eventsAfterSearch.filter((e) => e.type === 'search_query')
  note(`live search_query events: ${searchEvents.length}`)
  if (!searchEvents.length) throw new Error('Expected search_query event after Live search')
  await page.screenshot({ path: path.join(outDir, 'verify_live_search.png') })

  await page.getByRole('button', { name: /Arena Sports/i }).first().click()
  const arenaState = await waitForVideo(page, 'arena playback')
  await page.screenshot({ path: path.join(outDir, 'verify_arena_playing.png') })
  if (!(arenaState?.videoWidth > 0 || arenaState?.currentTime > 0)) {
    throw new Error('Arena Sports stream did not produce video frames')
  }

  // Clear search so other channels appear, then switch
  await search.fill('')
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: /SteadyStream One/i }).first().click()
  await page.waitForTimeout(2500)
  await waitForVideo(page, 'aether playback')

  const eventsAfterSwitch = await page.evaluate(() => {
    const raw = localStorage.getItem('aether_event_buffer')
    return raw ? JSON.parse(raw) : []
  })
  const playEnds = eventsAfterSwitch.filter((e) => e.type === 'play_end')
  const playStarts = eventsAfterSwitch.filter((e) => e.type === 'play_start')
  note(`play_start=${playStarts.length} play_end=${playEnds.length}`)
  if (!playEnds.length) throw new Error('Expected play_end after channel switch')
  if (!playStarts.length) throw new Error('Expected play_start events')

  // Assistant tools
  await page.getByRole('button', { name: /^Assistant$/i }).click()
  await page.waitForTimeout(400)
  const input = page.getByPlaceholder(/Ask, remind, mute|Ask for channels/i)
  await input.fill('Play Pulse News 24')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1800)
  let asideText = await page.locator('aside').last().innerText()
  note(`play_channel UI: ${/play_channel/i.test(asideText)}`)
  if (!/play_channel/i.test(asideText)) throw new Error('play_channel not surfaced')

  await input.fill('Recommend something to watch')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1800)
  asideText = await page.locator('aside').last().innerText()
  note(`recommend_now UI: ${/recommend_now/i.test(asideText)}`)
  if (!/recommend_now/i.test(asideText)) throw new Error('recommend_now not surfaced')
  await page.screenshot({ path: path.join(outDir, 'verify_assistant_tools.png') })

  // VOD Aurora
  await page.getByRole('button', { name: 'On Demand' }).click()
  await page.waitForTimeout(800)
  await page.getByText('Aurora Drift').first().click()
  await page.waitForTimeout(800)
  const playBtn = page.getByRole('button', { name: /play|watch/i }).first()
  if (await playBtn.count()) await playBtn.click()
  const vodState = await waitForVideo(page, 'aurora vod')
  await page.screenshot({ path: path.join(outDir, 'verify_aurora_vod.png') })
  if (!(vodState?.videoWidth > 0 || vodState?.currentTime > 0)) {
    throw new Error('Aurora Drift stream did not produce video frames')
  }

  // Local fallback when API aborted
  await page.route('**/api/assistant', (route) => route.abort())
  await page.getByRole('button', { name: /^Assistant$/i }).click().catch(() => undefined)
  await page.waitForTimeout(300)
  const input2 = page.getByPlaceholder(/Ask, remind, mute|Ask for channels/i)
  await input2.fill('Play SteadyStream One')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1500)
  const fallbackText = await page.locator('aside').last().innerText()
  note(`local fallback label: ${/Local fallback/i.test(fallbackText)}`)
  if (!/Local fallback/i.test(fallbackText)) throw new Error('Expected Local fallback label')
  await page.screenshot({ path: path.join(outDir, 'verify_assistant_local_fallback.png') })

  note('VERIFY_OK')
} catch (err) {
  note(`VERIFY_FAIL: ${err instanceof Error ? err.message : String(err)}`)
  await page.screenshot({ path: path.join(outDir, 'verify_failure.png') }).catch(() => undefined)
  process.exitCode = 1
} finally {
  const videoPath = await page.video()?.path()
  await context.close()
  await browser.close()
  if (videoPath && fs.existsSync(videoPath)) {
    const dest = path.join(outDir, 'gap_close_e2e_walkthrough.webm')
    fs.renameSync(videoPath, dest)
    note(`video: ${dest}`)
  }
  fs.appendFileSync(
    path.join(outDir, 'gap_close_verification.log'),
    `\n=== playwright e2e ===\n${log.join('\n')}\n`,
  )
}
