/**
 * Shared e2e helpers for SteadyStream onboarding + shell.
 * @param {import('playwright').Page} page
 */
export async function finishOnboardingTour(page) {
  const tour = page.getByTestId('onboarding-tour')
  if (!(await tour.count())) return
  for (let i = 0; i < 4; i++) {
    const next = page.getByTestId('onboarding-tour-next')
    const done = page.getByTestId('onboarding-tour-done')
    if (await done.count()) {
      await done.click()
      return
    }
    if (await next.count()) {
      await next.click()
      continue
    }
    break
  }
}

/** Click demo pack and complete the short tour when present. */
export async function enterWithDemoPack(page) {
  const demoBtn = page.getByRole('button', { name: /demo pack/i })
  if (await demoBtn.count()) {
    await demoBtn.click()
    await finishOnboardingTour(page)
  }
}
