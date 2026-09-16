import type { Channel } from '../types/iptv'

/** Soft ceiling only for emergency localStorage overflow fallback — not a browse limit. */
export const PERSIST_LIVE_SOFT_CAP = 20_000

/**
 * Historical Zustand partialize bug capped persisted catalogs at 500 channels,
 * so MegaOTT (~6897 live) looked incomplete after reload.
 */
export const LEGACY_PERSIST_CHANNEL_CAP = 500

/** Drop heavy optional fields that are not required to resume live playback. */
export function compactChannelForPersist(channel: Channel): Channel {
  const {
    poster: _poster,
    backdrop: _backdrop,
    description: _description,
    ...rest
  } = channel
  return rest
}

/**
 * Persist live catalog completely; never keep panel VOD titles in localStorage
 * (VOD stays lazy via category fetch).
 */
export function channelsForPersistence(channels: Channel[]): Channel[] {
  const live = channels.filter((c) => c.kind === 'live').map(compactChannelForPersist)
  if (live.length <= PERSIST_LIVE_SOFT_CAP) return live
  return live.slice(0, PERSIST_LIVE_SOFT_CAP)
}

/** Ultra-compact form when JSON is too large for localStorage (~4.5MB budget). */
export function channelsForPersistenceTight(channels: Channel[]): Channel[] {
  return channelsForPersistence(channels).map((c) => {
    const { logo: _logo, ...rest } = c
    return rest
  })
}

export function shouldBackgroundRefreshLiveCatalog(options: {
  sourceType?: string
  liveCount: number
  /** True when we know this session previously hit the legacy 500 cap. */
  suspectLegacyCap?: boolean
}): boolean {
  const type = options.sourceType
  if (type !== 'megaott' && type !== 'xtream') return false
  if (options.suspectLegacyCap) return true
  // Exact legacy cap is a strong signal the catalog was truncated on save.
  if (options.liveCount === LEGACY_PERSIST_CHANNEL_CAP) return true
  return false
}
