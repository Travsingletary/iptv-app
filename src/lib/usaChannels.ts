import type { Channel, LiveRegionFilter } from '../types/iptv.js'

export type { LiveRegionFilter }

/**
 * MegaOTT / Xtream packs usually tag country in the group title:
 * `USA | Entertainment`, `US|SPORTS`, `UK - NEWS`, `LATINO|…`.
 */
const USA_MARK =
  /(?:^|[^a-z0-9])(?:usa|u\.s\.a\.?|united\s*states)(?:[^a-z0-9]|$)|(?:^|[^a-z0-9])us(?:\||\s*[-|/])/i

const FOREIGN_MARK =
  /(?:^|[^a-z0-9])(?:uk|united\s*kingdom|canada|ca\s*[-|/]|australia|au\s*[-|/]|latino|latin\s*america|mexico|brasil|brazil|argentina|spain|france|germany|italy|india|pakistan|arabic|arabia|turkey|portugal|netherlands|poland|russia|china|japan|korea|africa|caribbean)(?:[^a-z0-9]|$)/i

/** Well-known US network / brand tokens when the group has no country tag. */
const US_NETWORK =
  /\b(?:abc|cbs|nbc|fox(?:\s*news)?|espn|cnn|msnbc|cnbc|hbo|showtime|amc|tnt|usa\s*network|cw|pbs|espn2|nfl\s*network|nba\s*tv|mlb\s*network|nhl\s*network)\b/i

export function channelRegionHay(channel: Pick<Channel, 'group' | 'name'>): string {
  return `${channel.group ?? ''} ${channel.name ?? ''}`.trim()
}

export function isUsaChannel(channel: Pick<Channel, 'group' | 'name'>): boolean {
  const hay = channelRegionHay(channel)
  if (!hay) return false
  if (USA_MARK.test(hay)) return true
  if (FOREIGN_MARK.test(hay)) return false
  // Unscoped US brands (common when providers omit the USA folder prefix).
  if (US_NETWORK.test(hay)) return true
  return false
}

export function filterLiveByRegion<T extends Channel>(
  channels: T[],
  region: LiveRegionFilter = 'all',
): T[] {
  const live = channels.filter((c) => c.kind === 'live')
  if (region !== 'usa') return live
  return live.filter(isUsaChannel)
}
