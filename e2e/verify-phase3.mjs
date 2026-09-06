/**
 * Phase 3 runtime verification: multi-step agent, confirm gate,
 * automation rules UI, and automation toast on stream error.
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

  // Multi-step agent: mute + remind
  await page.getByRole('button', { name: /^Assistant$/i }).click()
  await page.waitForTimeout(400)
  const aside = page.locator('aside').last()
  note(`phase3 badge: ${/Phase [34]/i.test(await aside.innerText())}`)

  const input = page.getByPlaceholder(/Ask, remind, mute|Ask for channels/i)
  await input.fill('Mute and remind me when Match Center starts')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(2000)
  let text = await aside.innerText()
  note(`multi-step set_mute: ${/set_mute/i.test(text)}`)
  note(`multi-step set_reminder: ${/set_reminder/i.test(text)}`)
  note(`multi-step plan label: ${/2-step plan|step plan/i.test(text)}`)
  if (!/set_mute/i.test(text) || !/set_reminder/i.test(text)) {
    throw new Error('Expected multi-step mute + remind tools')
  }

  // Confirm gate for clear reminders
  await input.fill('Clear all reminders')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1800)
  text = await aside.innerText()
  note(`pending confirm UI: ${/pending confirm|Confirm action/i.test(text)}`)
  if (!/Confirm action/i.test(text)) throw new Error('Expected Confirm action button')
  await aside.getByRole('button', { name: /Confirm action/i }).click()
  await page.waitForTimeout(1800)
  text = await aside.innerText()
  note(`confirmed clear: ${/dismissed|clear_reminders|All active reminders/i.test(text)}`)

  await page.screenshot({ path: path.join(outDir, 'phase3_agent_multistep_confirm.png') })

  // Automation rules in Settings
  await page.getByRole('button', { name: 'Close assistant' }).click().catch(() => undefined)
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.waitForTimeout(600)
  const settingsText = await page.locator('body').innerText()
  note(`automation rules section: ${/Automation rules/i.test(settingsText)}`)
  if (!/Automation rules/i.test(settingsText)) throw new Error('Automation rules UI missing')
  note(`buffering rule: ${/Suggest fallback when buffering/i.test(settingsText)}`)
  note(`favorite remind rule: ${/Remind before favorites start/i.test(settingsText)}`)
  note(`error auto fallback rule: ${/Auto-try alternate on stream error/i.test(settingsText)}`)

  // Toggle a rule off/on
  const toggle = page.getByLabel(/Toggle Suggest fallback when buffering/i)
  if (await toggle.count()) {
    const before = await toggle.isChecked()
    await toggle.click()
    await page.waitForTimeout(200)
    const after = await toggle.isChecked()
    note(`rule toggle ${before} -> ${after}`)
    if (before === after) throw new Error('Automation rule toggle did not change')
    // restore
    await toggle.click()
  }

  await page.screenshot({ path: path.join(outDir, 'phase3_automation_rules_settings.png') })

  // Trigger stream-error automation via React-bound store bridge
  await page.getByRole('button', { name: 'Live TV' }).click()
  await page.waitForTimeout(800)
  await page.evaluate(() => {
    const store = window.__AETHER_STORE__
    store.getState().playChannel('live_aether_one')
    store.getState().setStreamError('Stream error. Try another channel.')
    store.getState().tickAutomation(Date.now())
  })
  await page.waitForTimeout(400)
  const autoResult = await page.evaluate(() => {
    const state = window.__AETHER_STORE__.getState()
    return {
      toasts: state.automationToasts.map((t) => ({ kind: t.kind, message: t.message })),
      channelId: state.player.channelId,
      firedKeys: state.automationFiredKeys.slice(-5),
    }
  })
  note(`automation after error: ${JSON.stringify(autoResult)}`)
  if (!autoResult.toasts.some((t) => t.kind === 'auto_switch_fallback' || /Stream error/i.test(t.message))) {
    throw new Error('Expected automation toast after stream error')
  }

  await page.waitForTimeout(700)
  const bodyText = await page.locator('body').innerText()
  note(`automation toast visible: ${/Automation|Stream error/i.test(bodyText)}`)
  await page.screenshot({ path: path.join(outDir, 'phase3_automation_stream_error_toast.png') })

  // Conversation memory key written (profile-scoped since Phase 4)
  const memoryOk = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith('aether_assistant_memory'),
    )
    for (const key of keys) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || '[]')
        if (Array.isArray(parsed) && parsed.length > 0) return true
      } catch {
        // continue
      }
    }
    return false
  })
  note(`conversation memory persisted: ${memoryOk}`)
  if (!memoryOk) throw new Error('Expected assistant memory in localStorage')

  note('PHASE3_VERIFY_OK')
} catch (err) {
  note(`PHASE3_VERIFY_FAIL: ${err instanceof Error ? err.message : String(err)}`)
  await page.screenshot({ path: path.join(outDir, 'phase3_verify_failure.png') }).catch(() => undefined)
  process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
  fs.writeFileSync(path.join(outDir, 'phase3_verification.log'), log.join('\n') + '\n')
}
