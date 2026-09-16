/**
 * Headless verify: Settings BYOK UI + mock/live toggle without a real provider key.
 * Usage: AETHER_URL=http://127.0.0.1:5173 npm run verify:ai-byok
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
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
const base = process.env.AETHER_URL || 'http://127.0.0.1:5173'

function note(msg) {
  console.log(`[ai-byok] ${msg}`)
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await context.newPage()

  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await enterWithDemoPack(page)

  const settingsBtn = page.getByTestId('nav-settings')
  await settingsBtn.waitFor({ state: 'visible', timeout: 15_000 })
  await settingsBtn.click()
  await page.waitForTimeout(500)

  const section = page.getByTestId('ai-byok-section')
  if (!(await section.count())) throw new Error('Expected ai-byok-section')

  const indicator = page.getByTestId('ai-mode-indicator')
  await indicator.waitFor({ state: 'visible' })
  const indicatorText = await indicator.innerText()
  note(`indicator: ${indicatorText.replace(/\s+/g, ' ').trim()}`)
  if (!/Mock AI|Live AI/i.test(indicatorText)) {
    throw new Error('Expected Mock AI or Live AI badge')
  }

  // Scroll BYOK into view on TV-ish layout
  await section.scrollIntoViewIfNeeded()

  const select = page.getByTestId('ai-provider-select')
  await select.selectOption('openrouter')
  note('selected OpenRouter')

  await page.getByTestId('ai-api-key-input').fill('sk-or-test-verify-key-abcdef')
  await page.getByTestId('ai-save-key').click()
  await page.getByTestId('ai-api-key-masked').waitFor({ state: 'visible' })
  const masked = await page.getByTestId('ai-api-key-masked').inputValue()
  if (!masked.includes('cdef')) throw new Error(`Expected masked key ending, got ${masked}`)
  if (masked.includes('sk-or-test-verify-key-abcdef')) {
    throw new Error('Full API key must not be shown')
  }
  note(`masked key ok: ${masked}`)

  await page.waitForTimeout(500)
  const liveText = await indicator.innerText()
  if (!/Live AI/i.test(liveText) || !/OpenRouter/i.test(liveText)) {
    throw new Error(`Expected Live AI · OpenRouter, got: ${liveText}`)
  }
  note(`live badge: ${liveText.replace(/\s+/g, ' ').trim()}`)

  await page.getByTestId('ai-clear-key').click()
  await page.waitForTimeout(500)
  const mockText = await indicator.innerText()
  if (!/Mock AI/i.test(mockText)) {
    throw new Error(`Expected Mock AI after clear, got: ${mockText}`)
  }
  note(`after clear: ${mockText.replace(/\s+/g, ' ').trim()}`)

  for (const value of ['openai', 'anthropic', 'gemini', 'groq', 'openrouter', 'custom']) {
    await select.selectOption(value)
  }
  note('all provider presets selectable')

  await browser.close()
  console.log('AI_BYOK_VERIFY_OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
