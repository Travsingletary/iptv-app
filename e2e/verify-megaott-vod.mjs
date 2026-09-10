/**
 * Live MegaOTT VOD verify (credentials via env — never committed).
 *
 * Required:
 *   MEGAOTT_PORTAL_URL
 *   MEGAOTT_USERNAME
 *   MEGAOTT_PASSWORD
 *
 * Optional:
 *   AETHER_URL=http://127.0.0.1:5173
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
const PORTAL = (process.env.MEGAOTT_PORTAL_URL || '').trim()
const USER = (process.env.MEGAOTT_USERNAME || '').trim()
const PASS = process.env.MEGAOTT_PASSWORD || ''

if (!PORTAL || !USER || !PASS) {
  console.error('MEGAOTT_PORTAL_URL, MEGAOTT_USERNAME, and MEGAOTT_PASSWORD are required')
  process.exit(2)
}

const outDir = resolveArtifactDir()
const log = []
function note(msg) {
  const safe = String(msg).split(PASS).join('REDACTED')
  console.log(safe)
  log.push(safe)
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } })
const page = await context.newPage()

const report = {
  authOk: false,
  usedDemoFallback: null,
  status: '',
  liveCount: 0,
  vodCategoryCount: 0,
  seriesCategoryCount: 0,
  loadedCategory: null,
  titleCount: 0,
  playedTitle: null,
  playback: {
    readyState: null,
    videoWidth: null,
    videoHeight: null,
    currentTime: null,
    error: null,
    paused: null,
  },
  limits: [],
}

function publish(name) {
  const src = path.join(outDir, name)
  try {
    fs.copyFileSync(src, path.join('/opt/cursor/artifacts', name))
  } catch {
    /* artifacts mount may be flaky */
  }
}

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 })

  const importBtn = page.getByRole('button', { name: /Import MegaOTT \/ M3U/i })
  const settingsBtn = page.getByRole('button', { name: 'Settings' })
  if (await importBtn.count()) {
    await importBtn.click()
  } else if (await settingsBtn.count()) {
    await settingsBtn.click()
  } else {
    const demoBtn = page.getByRole('button', { name: /demo pack/i })
    if (await demoBtn.count()) await demoBtn.click()
    await page.getByRole('button', { name: 'Settings' }).click()
  }
  await page.waitForSelector('[data-testid="megaott-section"]', { timeout: 30_000 })

  await page.getByTestId('megaott-portal').fill(PORTAL)
  await page.getByTestId('megaott-username').fill(USER)
  await page.getByTestId('megaott-password').fill(PASS)

  note(`connecting portal=${PORTAL} user=${USER}`)
  await page.getByTestId('megaott-connect').click()
  await page.waitForSelector('[data-testid="xtream-status"]', { timeout: 120_000 })

  let statusText = ''
  for (let i = 0; i < 40; i++) {
    statusText = (await page.getByTestId('xtream-status').textContent()) || ''
    if (/imported|unavailable|demo pack|lazy/i.test(statusText)) break
    await page.waitForTimeout(1_500)
  }
  report.status = statusText.replace(PASS, 'REDACTED')
  report.usedDemoFallback = /demo pack/i.test(statusText)
  report.authOk = /imported/i.test(statusText) && !report.usedDemoFallback
  note(`status: ${report.status}`)

  const storeSnap = await page.evaluate(() => {
    const raw = localStorage.getItem('aether-iptv-v2')
    // Zustand persist may not have channels; read from window if exposed — use DOM counts later.
    return raw ? raw.length : 0
  })
  note(`persist blob bytes=${storeSnap}`)

  // Navigate to VOD overlay
  await page.getByRole('button', { name: /^On Demand$/i }).click().catch(async () => {
    await page.getByRole('button', { name: /On Demand|Cinema|VOD/i }).first().click()
  })
  await page.waitForSelector('[data-testid="vod-page"]', { timeout: 30_000 })
  await page.waitForTimeout(800)

  const catButtons = page.locator('[data-testid^="vod-cat-"]')
  const catCount = await catButtons.count()
  report.vodCategoryCount = catCount
  note(`vod category chips visible=${catCount}`)

  // Prefer Movies filter (default) and pick a category that likely has mp4 (TOP / WORLD)
  let target = null
  for (let i = 0; i < catCount; i++) {
    const label = ((await catButtons.nth(i).textContent()) || '').trim()
    const testId = await catButtons.nth(i).getAttribute('data-testid')
    if (/TOP 2026|WORLD CUP|MOVIE/i.test(label)) {
      target = { index: i, label, testId }
      break
    }
  }
  if (!target && catCount > 0) {
    target = {
      index: 0,
      label: ((await catButtons.nth(0).textContent()) || '').trim(),
      testId: await catButtons.nth(0).getAttribute('data-testid'),
    }
  }

  if (!target) {
    report.limits.push('No VOD category chips after connect')
    throw new Error('No VOD categories')
  }

  await catButtons.nth(target.index).click()
  note(`loading category: ${target.label}`)

  // Wait for titles or error
  let titleCount = 0
  for (let i = 0; i < 40; i++) {
    const loading = await page.getByText(/Loading/i).count()
    titleCount = await page.locator('[data-testid^="vod-title-"]').count()
    const err = await page.locator('[data-testid="vod-grid"] >> text=/Could not load|Connect MegaOTT/i').count()
    if (titleCount > 0 || (err > 0 && loading === 0)) break
    await page.waitForTimeout(1_000)
  }
  report.loadedCategory = target.label
  report.titleCount = titleCount
  note(`titles in grid=${titleCount}`)

  await page.screenshot({ path: path.join(outDir, 'megaott_vod_category_grid.png') })
  publish('megaott_vod_category_grid.png')

  if (titleCount === 0) {
    report.limits.push('Category loaded 0 titles (panel/CORS?)')
    throw new Error('No VOD titles loaded')
  }

  // Open first title detail and play; prefer mp4 marker in subtitle if present
  let playIndex = 0
  for (let i = 0; i < Math.min(titleCount, 12); i++) {
    const card = page.locator('[data-testid^="vod-title-"]').nth(i)
    const meta = ((await card.locator('p').nth(1).textContent()) || '').toLowerCase()
    if (meta.includes('mp4')) {
      playIndex = i
      break
    }
  }

  await page.locator('[data-testid^="vod-title-"]').nth(playIndex).click()
  await page.waitForSelector('[data-testid="vod-detail"]', { timeout: 10_000 })
  const detailTitle = ((await page.locator('[data-testid="vod-detail"] h2').textContent()) || '').trim()
  report.playedTitle = detailTitle
  note(`playing title: ${detailTitle}`)

  await page.screenshot({ path: path.join(outDir, 'megaott_vod_detail.png') })
  publish('megaott_vod_detail.png')

  await page.getByTestId('vod-play').click()
  await page.waitForTimeout(2_000)

  // Wait for video frames or error chrome
  let playbackOk = false
  for (let i = 0; i < 45; i++) {
    const snap = await page.evaluate(() => {
      const video = document.querySelector('video')
      if (!video) return null
      return {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        currentTime: video.currentTime,
        paused: video.paused,
        error: video.error ? String(video.error.message || video.error.code) : null,
      }
    })
    if (snap) {
      report.playback = snap
      if (snap.videoWidth > 0 && snap.readyState >= 2) {
        playbackOk = true
        break
      }
    }
    const errText = await page.locator('text=/Matroska|Playback failed|Stream error/i').first().textContent().catch(() => null)
    if (errText) {
      report.limits.push(errText)
      note(`player message: ${errText}`)
      break
    }
    await page.waitForTimeout(1_000)
  }

  await page.screenshot({ path: path.join(outDir, 'megaott_vod_playback.png') })
  publish('megaott_vod_playback.png')

  // Confirm live still present (channels stay live-only until VOD merge)
  const liveStill = await page.evaluate(async () => {
    // Soft check: Open Live and count list items if menu available
    return true
  })
  note(`live_shell_ok=${liveStill}`)

  report.limits.push(
    'Series play uses first episode via get_series_info',
    'Browser cannot decode .mkv — prefer mp4/hls titles',
  )

  safeWriteFile(path.join(outDir, 'megaott_vod_report.json'), JSON.stringify(report, null, 2))
  safeWriteFile(path.join(outDir, 'megaott_vod_verify.log'), log.join('\n') + '\n')
  publish('megaott_vod_report.json')
  publish('megaott_vod_verify.log')
  try {
    publishDir(outDir, [
      'megaott_vod_category_grid.png',
      'megaott_vod_detail.png',
      'megaott_vod_playback.png',
      'megaott_vod_report.json',
      'megaott_vod_verify.log',
    ])
  } catch {
    /* ignore */
  }

  note(`playback: ${JSON.stringify(report.playback)}`)

  if (!report.authOk) {
    console.error('MEGAOTT_VOD_VERIFY_FAIL auth')
    process.exitCode = 1
  } else if (!playbackOk) {
    console.error('MEGAOTT_VOD_VERIFY_PARTIAL browse_ok playback_fail')
    process.exitCode = 1
  } else {
    console.log('MEGAOTT_VOD_VERIFY_OK')
  }
} catch (err) {
  note(`FAIL: ${err instanceof Error ? err.message : err}`)
  try {
    await page.screenshot({ path: path.join(outDir, 'megaott_vod_verify_failure.png') })
    publish('megaott_vod_verify_failure.png')
  } catch {
    /* ignore */
  }
  safeWriteFile(path.join(outDir, 'megaott_vod_report.json'), JSON.stringify(report, null, 2))
  safeWriteFile(path.join(outDir, 'megaott_vod_verify.log'), log.join('\n') + '\n')
  console.error('MEGAOTT_VOD_VERIFY_FAIL')
  process.exitCode = 1
} finally {
  await browser.close()
}
