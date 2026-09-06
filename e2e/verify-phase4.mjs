/**
 * Phase 4 runtime verification: NL EPG structured results, profiles UI,
 * reminder sync status affordance.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

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
    await page.waitForTimeout(800)
  }

  // Profiles in Settings
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.waitForTimeout(600)
  const settingsText = await page.locator('body').innerText()
  note(`profiles section: ${/Household profiles/i.test(settingsText)}`)
  if (!/Household profiles/i.test(settingsText)) throw new Error('Profiles UI missing')

  await page.getByLabel('New profile name').fill('Sports Fan')
  await page.getByRole('button', { name: /Add profile/i }).click()
  await page.waitForTimeout(400)
  let body = await page.locator('body').innerText()
  note(`created Sports Fan profile: ${/Sports Fan/i.test(body)}`)
  if (!/Sports Fan/i.test(body)) throw new Error('Profile create failed')

  await page.getByLabel('Active profile interest tags').fill('sports, news')
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(outDir, 'phase4_profiles_settings.png') })

  // NL EPG in assistant
  await page.getByRole('button', { name: /^Assistant$/i }).click()
  await page.waitForTimeout(400)
  const aside = page.locator('aside').last()
  note(`phase4 badge: ${/Phase 4/i.test(await aside.innerText())}`)

  const syncStatus = page.getByTestId('reminder-sync-status')
  note(`reminder sync status visible: ${await syncStatus.count()}`)
  if (!(await syncStatus.count())) throw new Error('Reminder sync status missing')
  note(`sync label: ${await syncStatus.innerText()}`)

  const input = page.getByPlaceholder(/Ask, remind, mute|Ask for channels|sports in next/i)
  await input.fill('sports in next 2 hours')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(2200)
  const asideText = await aside.innerText()
  note(`nl epg search_epg: ${/search_epg/i.test(asideText)}`)
  note(`nl epg sports filter: ${/Sports/i.test(asideText)}`)
  const structured = page.getByTestId('epg-structured-results')
  note(`structured results: ${await structured.count()}`)
  if (!(await structured.count())) throw new Error('Expected structured EPG results')
  if (!/search_epg/i.test(asideText)) throw new Error('Expected search_epg tool')

  await page.screenshot({ path: path.join(outDir, 'phase4_nl_epg_structured.png') })

  // Profile name in assistant chrome
  note(`profile in badge: ${/Sports Fan/i.test(asideText)}`)

  note('PHASE4_VERIFY_OK')
} catch (err) {
  note(`PHASE4_VERIFY_FAIL: ${err instanceof Error ? err.message : String(err)}`)
  await page.screenshot({ path: path.join(outDir, 'phase4_verify_failure.png') }).catch(() => undefined)
  process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
  fs.writeFileSync(path.join(outDir, 'phase4_verification.log'), log.join('\n') + '\n')
}
