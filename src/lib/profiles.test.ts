import { describe, expect, it, beforeEach } from 'vitest'
import {
  createDefaultProfiles,
  createProfile,
  getActiveProfile,
  removeProfile,
  switchProfile,
  updateProfile,
} from './profiles'

describe('profiles', () => {
  beforeEach(() => {
    globalThis.localStorage?.clear()
  })

  it('creates default household profile', () => {
    const state = createDefaultProfiles()
    expect(state.profiles).toHaveLength(1)
    expect(getActiveProfile(state).name).toBe('Household')
  })

  it('creates and switches profiles with interest tags', () => {
    let state = createDefaultProfiles()
    state = createProfile(state, 'Kids', { interestTags: ['kids'] })
    expect(state.profiles).toHaveLength(2)
    expect(getActiveProfile(state).name).toBe('Kids')
    expect(getActiveProfile(state).interestTags).toEqual(['kids'])

    const householdId = state.profiles.find((p) => p.name === 'Household')!.id
    state = switchProfile(state, householdId)
    expect(getActiveProfile(state).name).toBe('Household')

    state = updateProfile(state, householdId, { favorites: ['live_arena_sports'] })
    expect(getActiveProfile(state).favorites).toEqual(['live_arena_sports'])

    const kidsId = state.profiles.find((p) => p.name === 'Kids')!.id
    state = removeProfile(state, kidsId)
    expect(state.profiles).toHaveLength(1)
  })
})
