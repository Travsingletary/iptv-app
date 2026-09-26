/**
 * Household / user profiles: separate prefs bias, favorites, assistant memory key.
 */
import type { UiPrefs } from '../types/iptv.js'

export interface HouseholdProfile {
  id: string
  name: string
  avatarHue: number
  favorites: string[]
  prefs: Partial<UiPrefs>
  /** Bias keywords for recommendations / EPG (e.g. sports, kids). */
  interestTags: string[]
  createdAt: number
  updatedAt: number
}

export interface ProfileStoreState {
  activeProfileId: string
  profiles: HouseholdProfile[]
}

const STORAGE_KEY = 'aether_profiles_v1'

const defaultPrefs: Partial<UiPrefs> = {}

export function createDefaultProfiles(): ProfileStoreState {
  const now = Date.now()
  const household: HouseholdProfile = {
    id: 'profile_household',
    name: 'Household',
    avatarHue: 28,
    favorites: [],
    prefs: { ...defaultPrefs },
    interestTags: [],
    createdAt: now,
    updatedAt: now,
  }
  return { activeProfileId: household.id, profiles: [household] }
}

function canUseStorage() {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined'
}

export function loadProfiles(): ProfileStoreState {
  if (!canUseStorage()) return createDefaultProfiles()
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultProfiles()
    const parsed = JSON.parse(raw) as ProfileStoreState
    if (!parsed?.profiles?.length || !parsed.activeProfileId) {
      return createDefaultProfiles()
    }
    return parsed
  } catch {
    return createDefaultProfiles()
  }
}

export function saveProfiles(state: ProfileStoreState): void {
  if (!canUseStorage()) return
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getActiveProfile(state: ProfileStoreState): HouseholdProfile {
  return (
    state.profiles.find((p) => p.id === state.activeProfileId) ?? state.profiles[0]
  )
}

export function createProfile(
  state: ProfileStoreState,
  name: string,
  options: { interestTags?: string[]; avatarHue?: number } = {},
): ProfileStoreState {
  const now = Date.now()
  const profile: HouseholdProfile = {
    id: `profile_${now.toString(36)}`,
    name: name.trim() || 'Viewer',
    avatarHue: options.avatarHue ?? Math.floor(Math.random() * 360),
    favorites: [],
    prefs: {},
    interestTags: options.interestTags ?? [],
    createdAt: now,
    updatedAt: now,
  }
  const next = {
    activeProfileId: profile.id,
    profiles: [...state.profiles, profile],
  }
  saveProfiles(next)
  return next
}

export function switchProfile(
  state: ProfileStoreState,
  profileId: string,
): ProfileStoreState {
  if (!state.profiles.some((p) => p.id === profileId)) return state
  const next = { ...state, activeProfileId: profileId }
  saveProfiles(next)
  return next
}

export function updateProfile(
  state: ProfileStoreState,
  profileId: string,
  patch: Partial<Pick<HouseholdProfile, 'name' | 'favorites' | 'prefs' | 'interestTags' | 'avatarHue'>>,
): ProfileStoreState {
  const profiles = state.profiles.map((p) =>
    p.id === profileId
      ? { ...p, ...patch, updatedAt: Date.now() }
      : p,
  )
  const next = { ...state, profiles }
  saveProfiles(next)
  return next
}

export function removeProfile(
  state: ProfileStoreState,
  profileId: string,
): ProfileStoreState {
  if (state.profiles.length <= 1) return state
  const profiles = state.profiles.filter((p) => p.id !== profileId)
  const activeProfileId =
    state.activeProfileId === profileId ? profiles[0].id : state.activeProfileId
  const next = { activeProfileId, profiles }
  saveProfiles(next)
  return next
}

/** Per-profile assistant memory storage key. */
export function profileMemoryKey(profileId: string): string {
  return `aether_assistant_memory_${profileId}_v1`
}
