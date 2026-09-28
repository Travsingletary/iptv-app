/**
 * Shared e2e helpers for SteadyStream onboarding + shell.
 * @param {import('playwright').Page} page
 */
export async function finishOnboardingTour(page) {
  const tour = page.getByTestId('onboarding-tour')
  try {
    await tour.waitFor({ state: 'visible', timeout: 4_000 })
  } catch {
    return
  }
  for (let i = 0; i < 6; i++) {
    const next = page.getByTestId('onboarding-tour-next')
    const done = page.getByTestId('onboarding-tour-done')
    if (await done.count()) {
      await done.click()
      await tour.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
      return
    }
    if (await next.count()) {
      await next.click()
      await page.waitForTimeout(200)
      continue
    }
    break
  }
}

/** Click demo pack and complete the short tour when present. */
export async function enterWithDemoPack(page) {
  const demoBtn = page.getByTestId('onboarding-demo')
  if (await demoBtn.count()) {
    await demoBtn.click()
    await finishOnboardingTour(page)
    return
  }
  const demoByRole = page.getByRole('button', { name: /demo pack/i })
  if (await demoByRole.count()) {
    await demoByRole.click()
    await finishOnboardingTour(page)
  }
}
