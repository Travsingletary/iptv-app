import { describe, expect, it } from 'vitest'
import {
  createReminder,
  findUpcomingPrograms,
  markDueReminders,
} from './reminders'
import { DEMO_CHANNELS, DEMO_EPG } from './demoData'

describe('reminders', () => {
  it('finds upcoming EPG matches for a reminder query', () => {
    const drafts = findUpcomingPrograms('Match Center', DEMO_CHANNELS, DEMO_EPG, Date.now(), 3)
    expect(drafts.length).toBeGreaterThan(0)
    expect(drafts[0].programTitle.toLowerCase()).toContain('match')
    expect(drafts[0].fireAt).toBeGreaterThan(Date.now())
  })

  it('marks due reminders as fired', () => {
    const reminder = createReminder(
      {
        programId: 'p1',
        programTitle: 'Night Desk Live',
        channelId: 'live_pulse_news',
        channelName: 'Pulse News 24',
        fireAt: Date.now() - 1000,
      },
      Date.now() - 5000,
    )
    const { next, newlyFired } = markDueReminders([reminder], Date.now())
    expect(newlyFired).toHaveLength(1)
    expect(next[0].fired).toBe(true)
  })
})
