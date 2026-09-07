/**
 * Finish-pass runtime verification: Auth demo state, AI mode indicator,
 * Xtream docs, catch-up stub, multi-view audio focus chrome, mock help.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const rel of [
  'src/lib/supabaseAuth.ts',
  'src/lib/aiMode.ts',
  'src/lib/supabaseClient.ts',
  'supabase/RLS.md',
]) {
  const ok = fs.existsSync(path.join(root, rel))
  note(`artifact ${rel}: ${ok}`)
  if (!ok) throw new Error(`Missing ${rel}`)
}

const statusRes = await fetch(`${BASE}/api/assistant`)
const statusJson = await statusRes.json()
note(`api aiMode: ${statusJson.aiMode}`)
if (statusJson.aiMode !== 'mock' && statusJson.aiMode !== 'live') {
  throw new Error('GET /api/assistant missing aiMode')
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
    await page.waitForTimeout(700)
  }

  await page.getByRole('button', { name: 'Settings' }).click()
  await page.waitForTimeout(500)
  const settings = await page.locator('body').innerText()
  note(`auth demo state: ${/Auth disabled/i.test(settings)}`)
  note(`ai mode section: ${/Mock AI|Live AI|Assistant AI/i.test(settings)}`)
  note(`xtream fields docs: ${/tv_archive|Server URL|player_api/i.test(settings)}`)
  if (!(await page.getByTestId('auth-demo-state').count())) {
    throw new Error('Expected auth-demo-state without Supabase env')
  }
  if (!(await page.getByTestId('ai-mode-indicator').count())) {
    throw new Error('Expected ai-mode-indicator')
  }
  await page.screenshot({ path: path.join(outDir, 'finish_settings_auth_ai.png') })

  // Catch-up on archive-capable demo channel
  await page.getByRole('button', { name: 'Live' }).click()
  await page.waitForTimeout(400)
  const arena = page.getByText('Arena Sports', { exact: false }).first()
  if (await arena.count()) {
    await arena.click()
    await page.waitForTimeout(600)
  }
  const catchupBtn = page.getByRole('button', { name: /Catch up 15 minutes|−15m/i })
  if (await catchupBtn.count()) {
    await catchupBtn.first().click()
    await page.waitForTimeout(400)
    const status = page.getByTestId('catchup-status')
    note(`catchup status: ${await status.count()}`)
    if (await status.count()) {
      note(`catchup label: ${await status.innerText()}`)
    }
  }
  await page.screenshot({ path: path.join(outDir, 'finish_catchup_demo.png') })

  // Multi-view focus chrome
  await page.getByRole('button', { name: 'Multi-view' }).click()
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: /4-up/i }).click()
  await page.waitForTimeout(400)
  const focusBtns = page.getByRole('button', { name: /Focus slot/i })
  note(`multiview focus buttons: ${await focusBtns.count()}`)
  if ((await focusBtns.count()) >= 2) {
    await focusBtns.nth(1).click()
    await page.waitForTimeout(300)
  }
  note(`multiview focus label: ${/· focus/i.test(await page.locator('body').innerText())}`)
  await page.screenshot({ path: path.join(outDir, 'finish_multiview_audio_focus.png') })

  // Assistant mock help + AI mode badge
  await page.getByRole('button', { name: /^Assistant$/i }).click()
  await page.waitForTimeout(400)
  const aside = page.locator('aside').last()
  note(`assistant ai badge: ${/Mock AI|Live AI/i.test(await aside.innerText())}`)
  const input = page.getByPlaceholder(/Ask, remind, mute|Ask for channels|sports in next/i)
  await input.fill('help')
  await input.press('Enter')
  await page.waitForTimeout(900)
  note(`mock help reply: ${/Recommend|sports in next|Mute/i.test(await aside.innerText())}`)
  await page.screenshot({ path: path.join(outDir, 'finish_assistant_mock_help.png') })

  note('FINISH_VERIFY_OK')
} catch (err) {
  note(`FINISH_VERIFY_FAIL: ${err instanceof Error ? err.message : String(err)}`)
  await page.screenshot({ path: path.join(outDir, 'finish_verify_failure.png') }).catch(() => undefined)
  process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
  fs.writeFileSync(path.join(outDir, 'finish_verification.log'), log.join('\n') + '\n')
}
