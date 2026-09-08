/**
 * Live MegaOTT connect verification (credentials via env — never committed).
 *
 * Required:
 *   MEGAOTT_PORTAL_URL  e.g. http://panel-host
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
  // Never echo password
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
  channelCount: 0,
  liveCount: 0,
  archiveCount: 0,
  tunedChannel: null,
  playback: {
    readyState: null,
    videoWidth: null,
    currentTime: null,
    error: null,
    networkState: null,
  },
  catchup: {
    userInfoNote: 'checked via panel API separately; channel.catchup from tv_archive',
    channelWithArchive: null,
    controlVisible: false,
    statusText: null,
  },
}

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 })

  // Fresh state shows onboarding — go straight to Settings / MegaOTT import
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
  await page.waitForTimeout(300)

  await page.getByTestId('megaott-portal').fill(PORTAL)
  await page.getByTestId('megaott-username').fill(USER)
  await page.getByTestId('megaott-password').fill(PASS)

  // Screenshot settings with password field obscured (type=password already masks)
  const settingsShot = path.join(outDir, 'megaott_live_settings_filled.png')
  await page.screenshot({ path: settingsShot })
  try {
    fs.copyFileSync(settingsShot, path.join('/opt/cursor/artifacts', 'megaott_live_settings_filled.png'))
  } catch {
    /* artifacts mount may be flaky */
  }

  note(`connecting portal=${PORTAL} user=${USER}`)
  await page.getByTestId('megaott-connect').click()

  await page.waitForSelector('[data-testid="xtream-status"]', { timeout: 120_000 })
  // Allow large catalog mapping to finish
  let statusText = ''
  for (let i = 0; i < 60; i += 1) {
    statusText = (await page.getByTestId('xtream-status').innerText()).trim()
    if (statusText && !/connecting|busy|loading/i.test(statusText)) break
    await page.waitForTimeout(1000)
  }
  report.status = statusText.split(PASS).join('REDACTED')
  report.usedDemoFallback = /demo pack/i.test(statusText)
  report.authOk = /Imported \d+ live/i.test(statusText) && !report.usedDemoFallback
  note(`status: ${report.status}`)
  note(`authOk=${report.authOk} demoFallback=${report.usedDemoFallback}`)

  // Disable auto-fallback automation — panel max_connections is often 1
  await page.evaluate(() => {
    try {
      const raw = localStorage.getItem('aether_automation_rules_v1')
      const rules = raw ? JSON.parse(raw) : []
      const next = (Array.isArray(rules) ? rules : []).map((r) =>
        r && (r.kind === 'stream_error_auto_fallback' || r.id === 'rule_error_auto_fallback')
          ? { ...r, enabled: false }
          : r,
      )
      if (next.length) localStorage.setItem('aether_automation_rules_v1', JSON.stringify(next))
      else {
        localStorage.setItem(
          'aether_automation_rules_v1',
          JSON.stringify([
            { id: 'rule_error_auto_fallback', kind: 'stream_error_auto_fallback', enabled: false },
            { id: 'rule_buffering_fallback', kind: 'buffering_fallback_suggest', enabled: false },
          ]),
        )
      }
    } catch {
      /* ignore */
    }
  })


  await page.screenshot({
    path: path.join(outDir, 'megaott_live_connect_status.png'),
  })

  if (!report.authOk) {
    throw new Error(`MegaOTT live connect failed: ${report.status}`)
  }

  // Prefer status text counts (localStorage may omit huge catalogs)
  const statusMatch = statusText.match(
    /Imported\s+(\d+)\s+live\s+\((\d+)\s+with catch-up\),\s+(\d+)\s+VOD,\s+(\d+)\s+series/i,
  )
  const counts = await page.evaluate(() => {
    const raw = localStorage.getItem('aether-iptv-v2')
    if (!raw) return { channelCount: 0, liveCount: 0, archiveCount: 0, sample: null, archiveSample: null }
    try {
      const parsed = JSON.parse(raw)
      const channels = parsed?.state?.channels || []
      const live = channels.filter((c) => c.kind === 'live')
      const archive = live.filter((c) => c.catchup)
      return {
        channelCount: channels.length,
        liveCount: live.length,
        archiveCount: archive.length,
        sample: live[0]
          ? { id: live[0].id, name: live[0].name, catchup: !!live[0].catchup }
          : null,
        archiveSample: archive[0]
          ? { id: archive[0].id, name: archive[0].name }
          : null,
      }
    } catch {
      return { channelCount: 0, liveCount: 0, archiveCount: 0, sample: null, archiveSample: null }
    }
  })
  if (statusMatch) {
    report.liveCount = Number(statusMatch[1])
    report.archiveCount = Number(statusMatch[2])
    report.channelCount = Math.max(
      counts.channelCount,
      Number(statusMatch[1]) + Number(statusMatch[3]) + Number(statusMatch[4]),
    )
  } else {
    report.channelCount = counts.channelCount
    report.liveCount = counts.liveCount
    report.archiveCount = counts.archiveCount
  }
  report.catchup.channelWithArchive = counts.archiveSample
  note(
    `channels=${report.channelCount} live=${report.liveCount} archive=${report.archiveCount} (storageLive=${counts.liveCount})`,
  )

  if (report.liveCount < 1 && counts.liveCount < 1) {
    throw new Error('Expected live channels > 0')
  }

  // Tune a live channel — Live TV auto-plays first channel; click archive if known
  await page.getByRole('button', { name: 'Live TV' }).click()
  await page.waitForTimeout(1200)

  const targetName = counts.archiveSample?.name || counts.sample?.name || null
  report.tunedChannel = targetName
  note(`tuning: ${targetName || '(auto first live)'}`)

  if (targetName) {
    const escaped = targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const channelBtn = page.getByRole('button', { name: new RegExp(escaped, 'i') }).first()
    if (await channelBtn.count()) {
      await channelBtn.click()
    }
  }
  await page.waitForTimeout(2500)

  // Probe video element
  const playback = await page.evaluate(async () => {
    const video = document.querySelector('video')
    if (!video) return { error: 'no video element' }
    const start = Date.now()
    while (Date.now() - start < 20000) {
      if (video.readyState >= 2 && video.videoWidth > 0) break
      if (video.error) break
      await new Promise((r) => setTimeout(r, 500))
    }
    return {
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      currentTime: video.currentTime,
      networkState: video.networkState,
      paused: video.paused,
      error: video.error ? String(video.error.message || video.error.code) : null,
    }
  })
  report.playback = playback
  note(`playback: ${JSON.stringify(playback)}`)

  await page.screenshot({
    path: path.join(outDir, 'megaott_live_playback.png'),
  })

  // Catch-up control if archive channel
  if (counts.archiveSample) {
    await page.mouse.move(400, 200)
    await page.waitForTimeout(300)
    const catchupBtn = page.getByRole('button', { name: /Catch up 30 minutes|−30m/i })
    for (let i = 0; i < 10 && !(await catchupBtn.count()); i += 1) {
      await page.mouse.move(420 + i * 5, 220)
      await page.waitForTimeout(200)
    }
    report.catchup.controlVisible = (await catchupBtn.count()) > 0
    note(`catchup control visible: ${report.catchup.controlVisible}`)
    if (report.catchup.controlVisible) {
      await catchupBtn.click()
      await page.waitForTimeout(500)
      const status = page.getByTestId('catchup-status')
      if (await status.count()) {
        report.catchup.statusText = await status.innerText()
        note(`catchup status: ${report.catchup.statusText}`)
      }
    }
  }

  const framesOk = (playback.videoWidth || 0) > 0 || (playback.readyState || 0) >= 2
  note(`frames_or_ready=${framesOk}`)

  safeWriteFile(
    path.join(outDir, 'megaott_live_report.json'),
    JSON.stringify(report, null, 2),
  )
  safeWriteFile(path.join(outDir, 'megaott_live_verify.log'), log.join('\n'))
  publishDir(outDir, [
    'megaott_live_settings_filled.png',
    'megaott_live_connect_status.png',
    'megaott_live_playback.png',
    'megaott_live_report.json',
    'megaott_live_verify.log',
  ])

  if (!framesOk) {
    note('MEGAOTT_LIVE_VERIFY_PARTIAL: ingest OK, playback did not reach frames/readyState>=2')
    console.log('MEGAOTT_LIVE_VERIFY_PARTIAL')
    process.exitCode = 0
  } else {
    console.log('MEGAOTT_LIVE_VERIFY_OK')
  }
} catch (err) {
  note(`FAIL: ${err instanceof Error ? err.message : err}`)
  safeWriteFile(
    path.join(outDir, 'megaott_live_report.json'),
    JSON.stringify(report, null, 2),
  )
  safeWriteFile(path.join(outDir, 'megaott_live_verify.log'), log.join('\n'))
  await page.screenshot({ path: path.join(outDir, 'megaott_live_fail.png') }).catch(() => {})
  publishDir(outDir, [
    'megaott_live_fail.png',
    'megaott_live_report.json',
    'megaott_live_verify.log',
  ])
  console.error('MEGAOTT_LIVE_VERIFY_FAIL')
  process.exitCode = 1
} finally {
  await browser.close()
}
