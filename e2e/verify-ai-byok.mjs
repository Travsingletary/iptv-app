/**
 * Headless verify: Settings BYOK UI + mock mode without a key.
 * Usage: npm run verify:ai-byok
 */
import { chromium } from 'playwright'

const base = process.env.AETHER_URL || 'http://127.0.0.1:5173'

function note(msg) {
  console.log(`[ai-byok] ${msg}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(`${base}/settings`, { waitUntil: 'networkidle' })

  const section = page.getByTestId('ai-byok-section')
  if (!(await section.count())) throw new Error('Expected ai-byok-section')

  const indicator = page.getByTestId('ai-mode-indicator')
  await indicator.waitFor({ state: 'visible' })
  const indicatorText = await indicator.innerText()
  note(`indicator: ${indicatorText.replace(/\s+/g, ' ').trim()}`)
  if (!/Mock AI|Live AI/i.test(indicatorText)) {
    throw new Error('Expected Mock AI or Live AI badge')
  }

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

  await page.waitForTimeout(400)
  const liveText = await indicator.innerText()
  if (!/Live AI/i.test(liveText) || !/OpenRouter/i.test(liveText)) {
    throw new Error(`Expected Live AI · OpenRouter, got: ${liveText}`)
  }
  note(`live badge: ${liveText.replace(/\s+/g, ' ').trim()}`)

  await page.getByTestId('ai-clear-key').click()
  await page.waitForTimeout(400)
  const mockText = await indicator.innerText()
  if (!/Mock AI/i.test(mockText)) {
    throw new Error(`Expected Mock AI after clear, got: ${mockText}`)
  }
  note(`after clear: ${mockText.replace(/\s+/g, ' ').trim()}`)

  // Ensure presets exist
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
