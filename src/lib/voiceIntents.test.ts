import { describe, expect, it } from 'vitest'
import { parseVoiceIntent } from './voiceIntents'

describe('parseVoiceIntent', () => {
  it('maps play utterances', () => {
    expect(parseVoiceIntent('Play Arena Sports HD').kind).toBe('play')
    expect(parseVoiceIntent('tune to Pulse News 24').assistantMessage).toContain('Play')
  })

  it('maps mute and unmute', () => {
    expect(parseVoiceIntent('Mute').kind).toBe('mute')
    expect(parseVoiceIntent('unmute').kind).toBe('unmute')
  })

  it('maps recommend, guide, search, and remind', () => {
    expect(parseVoiceIntent('Recommend something upbeat').kind).toBe('recommend')
    expect(parseVoiceIntent("What's on sports").kind).toBe('guide')
    expect(parseVoiceIntent('Search Match Center').kind).toBe('search')
    expect(parseVoiceIntent('Remind me when Match Center starts').kind).toBe('remind')
  })
})
